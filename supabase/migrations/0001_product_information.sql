CREATE FUNCTION touch_updated() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TABLE products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sku text NOT NULL CHECK(btrim(sku)<>''), name text NOT NULL CHECK(btrim(name)<>''),
 family text NOT NULL DEFAULT 'general', supplier text NOT NULL DEFAULT '', owner text NOT NULL DEFAULT '', enabled boolean NOT NULL DEFAULT false,
 revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX product_sku_unique ON products(lower(sku));
CREATE TABLE channels (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, locale text NOT NULL, required_fields jsonb NOT NULL CHECK(jsonb_typeof(required_fields)='array' AND jsonb_array_length(required_fields)>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE product_values (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id), attribute text NOT NULL CHECK(btrim(attribute)<>''), locale text NOT NULL DEFAULT '', channel text NOT NULL DEFAULT '', value text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(product_id,attribute,locale,channel)
);
CREATE TABLE claims (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id), statement text NOT NULL CHECK(btrim(statement)<>''),
 evidence text NOT NULL DEFAULT '', reviewer text NOT NULL DEFAULT '', reviewed_on date, review_due date, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','withdrawn')),
 CHECK(status<>'approved' OR (btrim(evidence)<>'' AND btrim(reviewer)<>'' AND reviewed_on IS NOT NULL AND review_due IS NOT NULL AND review_due>reviewed_on)),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id), title text NOT NULL CHECK(btrim(title)<>''), owner text NOT NULL CHECK(btrim(owner)<>''), due_on date NOT NULL,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','done')), resolution text NOT NULL DEFAULT '', CHECK(status<>'done' OR btrim(resolution)<>''),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id), channel_id uuid NOT NULL REFERENCES channels(id), product_revision integer NOT NULL,
 reviewer text NOT NULL, note text NOT NULL, claims_checked boolean NOT NULL CHECK(claims_checked),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(product_id,channel_id,product_revision)
);
CREATE TABLE import_rows (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source text NOT NULL, source_id text NOT NULL, product_id uuid NOT NULL REFERENCES products(id), fingerprint text NOT NULL, raw jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(source,source_id)
);
CREATE TABLE activity (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid REFERENCES products(id), actor text NOT NULL CHECK(btrim(actor)<>''), action text NOT NULL, detail jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION immutable_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'History is append-only'; END $$;
CREATE TRIGGER activity_immutable BEFORE UPDATE OR DELETE ON activity FOR EACH ROW EXECUTE FUNCTION immutable_history();
CREATE FUNCTION bump_product() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.revision=OLD.revision+1; RETURN NEW; END $$;
CREATE TRIGGER bump_product_revision BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION bump_product();
CREATE FUNCTION changed_content() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE products SET updated_at=now() WHERE id=COALESCE(NEW.product_id,OLD.product_id); RETURN COALESCE(NEW,OLD); END $$;
CREATE TRIGGER changed_values AFTER INSERT OR UPDATE OR DELETE ON product_values FOR EACH ROW EXECUTE FUNCTION changed_content();
CREATE TRIGGER changed_claims AFTER INSERT OR UPDATE OR DELETE ON claims FOR EACH ROW EXECUTE FUNCTION changed_content();
CREATE FUNCTION changed_channel() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE products SET updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER channel_rules_changed AFTER UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION changed_channel();
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['products','channels','product_values','claims','tasks','reviews','import_rows'] LOOP
 EXECUTE format('CREATE TRIGGER touch_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['products','channels','product_values','claims','tasks','reviews','import_rows','activity'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t); END LOOP;
END $$;
CREATE VIEW resolved_values WITH (security_invoker=true) AS
 SELECT p.id product_id,c.id channel_id,a.attribute,chosen.value FROM products p CROSS JOIN channels c
 CROSS JOIN LATERAL (SELECT DISTINCT attribute FROM product_values WHERE product_id=p.id) a
 LEFT JOIN LATERAL (SELECT v.value FROM product_values v WHERE v.product_id=p.id AND v.attribute=a.attribute
 AND v.locale IN ('',c.locale) AND v.channel IN ('',c.name)
 ORDER BY (v.channel=c.name)::integer DESC,(v.locale=c.locale)::integer DESC LIMIT 1) chosen ON true;
CREATE VIEW claim_issues WITH (security_invoker=true) AS
 SELECT p.id product_id,p.sku,c.id claim_id,c.statement,c.status,c.review_due,
 CASE WHEN c.status='pending' THEN 'Claim awaiting evidence review' WHEN c.review_due<=current_date THEN 'Claim evidence review due' WHEN c.reviewed_on>current_date THEN 'Claim review is future dated' ELSE 'Claim evidence missing' END issue
 FROM claims c JOIN products p ON p.id=c.product_id WHERE c.status<>'withdrawn' AND
 (c.status<>'approved' OR btrim(c.evidence)='' OR btrim(c.reviewer)='' OR c.review_due IS NULL OR c.review_due<=current_date OR c.reviewed_on IS NULL OR c.reviewed_on>current_date);
CREATE VIEW channel_readiness WITH (security_invoker=true) AS
 SELECT p.id product_id,p.sku,p.name,p.supplier,p.owner,p.revision,c.id channel_id,c.name channel,c.locale,p.enabled,
 ARRAY(SELECT f FROM jsonb_array_elements_text(c.required_fields) f WHERE NOT EXISTS
 (SELECT 1 FROM resolved_values v WHERE v.product_id=p.id AND v.channel_id=c.id AND v.attribute=f AND btrim(v.value)<>'')) missing_fields,
 (SELECT count(*)::integer FROM claim_issues ci WHERE ci.product_id=p.id) claim_issues,
 EXISTS(SELECT 1 FROM reviews r WHERE r.product_id=p.id AND r.channel_id=c.id AND r.product_revision=p.revision) reviewed
 FROM products p CROSS JOIN channels c;
CREATE VIEW release_queue WITH (security_invoker=true) AS
 SELECT *, enabled AND cardinality(missing_fields)=0 AND claim_issues=0 AND reviewed AND btrim(owner)<>'' AS ready FROM channel_readiness;
CREATE VIEW attention WITH (security_invoker=true) AS
 SELECT p.id product_id,p.sku,'overdue-task' issue,t.title detail,t.owner,t.due_on FROM tasks t JOIN products p ON p.id=t.product_id WHERE t.status='open' AND t.due_on<current_date
 UNION ALL SELECT id,sku,'missing-owner','Assign a catalogue owner',owner,NULL::date FROM products WHERE btrim(owner)=''
 UNION ALL SELECT id,sku,'stale-content','Content unchanged for 90 days',owner,updated_at::date FROM products WHERE enabled AND updated_at<now()-interval '90 days'
 UNION ALL SELECT p.id,p.sku,'claim-review',ci.issue,p.owner,ci.review_due FROM claim_issues ci JOIN products p ON p.id=ci.product_id;
