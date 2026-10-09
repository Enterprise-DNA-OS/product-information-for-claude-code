# Catalogue command reference

Use `npm run pim -- <command>`. All commands accept `--json`. Options use `--name=value`, with quoted values containing spaces. Mutations require `--actor=Name` and accept `--dry-run`. The actor is an attribution label, not authenticated identity. Unknown references show candidates and exit 1. Names are matched without case, and IDs accept unique prefixes.

## products

```bash
node scripts/pim.mjs products
```

## product

```bash
node scripts/pim.mjs product --product=BOT-750
```

## channels

```bash
node scripts/pim.mjs channels
```

## values

```bash
node scripts/pim.mjs values --product=BOT-750
```

## readiness

```bash
node scripts/pim.mjs readiness
```

## release-queue

```bash
node scripts/pim.mjs release-queue --channel=nz-web
```

## claims

```bash
node scripts/pim.mjs claims
```

## tasks

```bash
node scripts/pim.mjs tasks
```

## attention

```bash
node scripts/pim.mjs attention
```

## compliance

```bash
node scripts/pim.mjs compliance
```

## supplier-chase

```bash
node scripts/pim.mjs supplier-chase
```

## history

```bash
node scripts/pim.mjs history --product=BOT-750
```

## add-product

```bash
node scripts/pim.mjs add-product --sku=<sku> --name="<name>" --family=<family> --supplier="<supplier>" --owner="<owner>" --actor="<operator>"
```

## set-product

```bash
node scripts/pim.mjs set-product --product=<sku> --field=<name|family|supplier|owner|enabled> --value="<value>" --actor="<operator>"
```

## set-value

```bash
node scripts/pim.mjs set-value --product=<sku> --attribute=<attribute> --value="<value>" --actor="<operator>"
```

## add-channel

```bash
node scripts/pim.mjs add-channel --name=<channel> --locale=<locale> --required=description,material,care --actor="<operator>"
```

## add-claim

```bash
node scripts/pim.mjs add-claim --product=<sku> --statement="<claim>" --actor="<operator>"
```

## review-claim

```bash
node scripts/pim.mjs review-claim --claim=<id> --evidence="<evidence reference>" --reviewed-on=<YYYY-MM-DD> --review-due=<YYYY-MM-DD> --actor="<reviewer>"
```

## withdraw-claim

```bash
node scripts/pim.mjs withdraw-claim --claim=<id> --reason="<reason>" --actor="<operator>"
```

## add-task

```bash
node scripts/pim.mjs add-task --product=<sku> --title="<request>" --owner="<owner>" --due=<YYYY-MM-DD> --actor="<operator>"
```

## close-task

```bash
node scripts/pim.mjs close-task --task=<id> --resolution="<confirmed result>" --actor="<operator>"
```

## review-product

```bash
node scripts/pim.mjs review-product --product=<sku> --channel=<channel> --claims-checked --note="<what was checked>" --actor="<reviewer>"
```

## log

```bash
node scripts/pim.mjs log --product=<sku> --note="<verified note>" --actor="<operator>"
```

## import

```bash
node scripts/pim.mjs import pimberly --file=<export.csv> --mapping=examples/pimberly/mapping.json --actor="<operator>" --dry-run
```

## export

```bash
node scripts/pim.mjs export
```

## channel-export

```bash
node scripts/pim.mjs channel-export --channel=nz-web
```

## draft-supplier

```bash
node scripts/pim.mjs draft-supplier --supplier="Kauri Supply"
```

## weekly-review

```bash
node scripts/pim.mjs weekly-review
```

`set-value --value=` explicitly clears a value. Locale defaults to shared content and channel defaults to shared content. Resolution priority is channel-and-locale, channel with shared locale, locale with shared channel, then shared content. An explicit blank overrides a fallback and blocks a required field. There is no automatic translation or parent-product inheritance.

`channel-export` writes a private JSON file containing only enabled, complete, reviewed products with current claim evidence. It sends nothing. `export` writes a full JSON record snapshot, including original import fields and history. It is portable data, not a restore command. Back up the database separately. Existing output files are never overwritten. `--out=<path>` chooses a new destination; OUTPUT_DIR sets the default output root.
