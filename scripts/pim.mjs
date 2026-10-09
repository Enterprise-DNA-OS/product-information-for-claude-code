#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const commands=['help','products','product','channels','values','readiness','release-queue','claims','tasks','attention','compliance','supplier-chase','history','add-product','set-value','set-product','add-channel','add-claim','review-claim','withdraw-claim','add-task','close-task','review-product','log','import','export','channel-export','draft-supplier','weekly-review'];
const optionKeys={
 product:'product',values:'product',readiness:'product channel','release-queue':'product channel',history:'product',
 'add-product':'sku name family supplier owner','set-product':'product field value','set-value':'product attribute value locale channel',
 'add-channel':'name locale required','add-claim':'product statement','review-claim':'claim evidence reviewed-on review-due',
 'withdraw-claim':'claim reason','add-task':'product title owner due','close-task':'task resolution',
 'review-product':'product channel claims-checked note',log:'product note',import:'file mapping',export:'out','channel-export':'channel out','draft-supplier':'supplier out'
};
const mutating=new Set(['add-product','set-value','set-product','add-channel','add-claim','review-claim','withdraw-claim','add-task','close-task','review-product','log','import']);
export function parseArgs(args){
 const opts={},pos=[];for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(k in opts)throw Error(`Duplicate option --${k}`);opts[k]=i<0?true:a.slice(i+1);}else pos.push(a);}return {cmd:pos[0]||'help',pos:pos.slice(1),opts};
}
const required=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k}= is required`);return o[k].trim();};
function isoDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error('Expected a real YYYY-MM-DD date');return s;}
function boolean(s){if(!['true','false'].includes(s))throw Error('Expected true or false');return s==='true';}
const entities={products:['sku','name'],channels:['name'],claims:['statement'],tasks:['title']};
export async function resolve(db,kind,ref){
 if(!entities[kind])throw Error('Unknown entity');if(!ref)throw Error(`A ${kind} reference is required`);
 const cols=entities[kind];const all=await db.query(`SELECT * FROM ${kind} ORDER BY created_at,id`);
 let rows=all.filter(r=>r.id===ref||cols.some(k=>String(r[k]).toLowerCase()===String(ref).toLowerCase()));
 if(!rows.length) rows=all.filter(r=>r.id.startsWith(ref)||cols.some(k=>String(r[k]).toLowerCase().includes(String(ref).toLowerCase())));
 if(rows.length!==1){const e=Error(rows.length?'Ambiguous reference; choose a listed ID':'No match; available records listed');e.candidates=(rows.length?rows:all).map(r=>({id:r.id,label:r[cols[0]]}));throw e;}return rows[0];
}
async function audit(db,p,actor,action,detail){await db.query('INSERT INTO activity(product_id,actor,action,detail) VALUES($1,$2,$3,$4::jsonb)',[p,actor,action,JSON.stringify(detail)]);}
const rowsText=rows=>{if(!rows.length)return '(none)';return table(rows,Object.keys(rows[0]).map(key=>({key,label:key,width:key==='detail'?70:36,format:v=>typeof v==='object'&&v!==null?JSON.stringify(v):v})));};
function writePrivate(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data,{flag:'wx',mode:0o600});return file;}
function outputFile(o,dir,ext){return o.out?path.resolve(required(o,'out')):path.join(process.env.OUTPUT_DIR||REPO_ROOT,dir,`${Date.now()}-${randomUUID().slice(0,8)}.${ext}`);}

export async function run(db,cmd,o={},pos=[]){
 if(!commands.includes(cmd))throw Error(`Unknown command ${cmd}`);
 const allowed=new Set(['json',...(optionKeys[cmd]||'').split(' '),...(mutating.has(cmd)?['actor','dry-run']:[])]);
 for(const key of Object.keys(o))if(!allowed.has(key))throw Error(`Unknown option --${key} for ${cmd}`);
 for(const key of ['json','dry-run','claims-checked'])if(key in o && o[key]!==true)throw Error(`--${key} is a flag; do not give it a value`);
 if(cmd!=='import'&&pos.length)throw Error('Unexpected positional argument');
 if(cmd==='help')return commands.map(command=>({command}));
 let actor;if(mutating.has(cmd))actor=required(o,'actor');
 if(mutating.has(cmd))await db.exec('BEGIN');
 try{
 let out;
 const product=()=>resolve(db,'products',required(o,'product'));
 const queryProduct=async sql=>{const p=await product();return db.query(sql,[p.id]);};
 switch(cmd){
 case 'products':out=await db.query('SELECT id,sku,name,family,supplier,owner,enabled,revision FROM products ORDER BY sku');break;
 case 'product':out=[await product()];break;
 case 'channels':out=await db.query('SELECT id,name,locale,required_fields FROM channels ORDER BY name');break;
 case 'values':out=await queryProduct('SELECT attribute,locale,channel,value FROM product_values WHERE product_id=$1 ORDER BY attribute,locale,channel');break;
 case 'readiness':case 'release-queue':{
 const params=[],where=[];if(o.channel){params.push((await resolve(db,'channels',o.channel)).id);where.push(`channel_id=$${params.length}`);}if(o.product){params.push((await product()).id);where.push(`product_id=$${params.length}`);}
 out=await db.query(`SELECT sku,name,channel,locale,missing_fields,claim_issues,reviewed,ready FROM release_queue ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY sku,channel`,params);break;}
 case 'claims':out=await db.query('SELECT c.id,p.sku,c.statement,c.status,c.evidence,c.reviewer,c.reviewed_on,c.review_due FROM claims c JOIN products p ON p.id=c.product_id ORDER BY p.sku,c.id');break;
 case 'tasks':out=await db.query('SELECT t.id,p.sku,t.title,t.owner,t.due_on,t.status,t.resolution FROM tasks t JOIN products p ON p.id=t.product_id ORDER BY t.due_on');break;
 case 'attention':out=await db.query('SELECT sku,issue,detail,owner,due_on FROM attention ORDER BY due_on NULLS LAST,sku');break;
 case 'compliance':out=await db.query("SELECT sku,'CLAIM-EVIDENCE' rule,issue,review_due FROM claim_issues ORDER BY sku");break;
 case 'supplier-chase':out=await db.query("SELECT p.supplier,p.sku,t.title,t.owner,t.due_on FROM tasks t JOIN products p ON p.id=t.product_id WHERE t.status='open' ORDER BY p.supplier,t.due_on");break;
 case 'history':out=await queryProduct('SELECT actor,action,detail,created_at FROM activity WHERE product_id=$1 ORDER BY created_at,id');break;
 case 'add-product':{
 const p=(await db.query('INSERT INTO products(sku,name,family,supplier,owner) VALUES($1,$2,$3,$4,$5) RETURNING *',[required(o,'sku'),required(o,'name'),o.family||'general',o.supplier||'',required(o,'owner')]))[0];await audit(db,p.id,actor,cmd,p);out=[p];break;}
 case 'set-product':{
 const p=await product(),key=required(o,'field');if(!['name','family','supplier','owner','enabled'].includes(key))throw Error('Editable fields: name, family, supplier, owner, enabled');const value=key==='enabled'?boolean(required(o,'value')):required(o,'value');
 out=await db.query(`UPDATE products SET ${key}=$2 WHERE id=$1 RETURNING *`,[p.id,value]);await audit(db,p.id,actor,cmd,{field:key,before:p[key],after:value});break;}
 case 'set-value':{
 const p=await product(),attribute=required(o,'attribute');let channel=o.channel||'';if(channel)channel=(await resolve(db,'channels',channel)).name;
 const locale=o.locale||'';const value=typeof o.value==='string'?o.value:(()=>{throw Error('--value= required; blank explicitly clears a value');})();
 const before=await db.query('SELECT * FROM product_values WHERE product_id=$1 AND attribute=$2 AND locale=$3 AND channel=$4',[p.id,attribute,locale,channel]);
 out=await db.query('INSERT INTO product_values(product_id,attribute,locale,channel,value) VALUES($1,$2,$3,$4,$5) ON CONFLICT(product_id,attribute,locale,channel) DO UPDATE SET value=excluded.value RETURNING *',[p.id,attribute,locale,channel,value]);await audit(db,p.id,actor,cmd,{before,after:out});break;}
 case 'add-channel':{
 const fields=required(o,'required').split(',').map(x=>x.trim());if(fields.some(x=>!x)||new Set(fields).size!==fields.length)throw Error('Required fields must be unique and nonempty');
 out=await db.query('INSERT INTO channels(name,locale,required_fields) VALUES($1,$2,$3::jsonb) RETURNING *',[required(o,'name'),required(o,'locale'),JSON.stringify(fields)]);await audit(db,null,actor,cmd,out);break;}
 case 'add-claim':{const p=await product();out=await db.query('INSERT INTO claims(product_id,statement) VALUES($1,$2) RETURNING *',[p.id,required(o,'statement')]);await audit(db,p.id,actor,cmd,out);break;}
 case 'review-claim':{
 const c=await resolve(db,'claims',required(o,'claim')),date=isoDate(required(o,'reviewed-on')),due=isoDate(required(o,'review-due'));const today=(await db.query('SELECT current_date::text today'))[0].today;
 if(date>today||due<=today||due<=date)throw Error('Review must be today or earlier and next review must be in the future');if(c.status==='withdrawn')throw Error('Withdrawn claim cannot be approved; create a new claim');
 out=await db.query("UPDATE claims SET evidence=$2,reviewer=$3,reviewed_on=$4,review_due=$5,status='approved' WHERE id=$1 RETURNING *",[c.id,required(o,'evidence'),actor,date,due]);await audit(db,c.product_id,actor,cmd,{before:c,after:out});break;}
 case 'withdraw-claim':{const c=await resolve(db,'claims',required(o,'claim'));out=await db.query("UPDATE claims SET status='withdrawn' WHERE id=$1 RETURNING *",[c.id]);await audit(db,c.product_id,actor,cmd,{before:c,reason:required(o,'reason')});break;}
 case 'add-task':{const p=await product();out=await db.query('INSERT INTO tasks(product_id,title,owner,due_on) VALUES($1,$2,$3,$4) RETURNING *',[p.id,required(o,'title'),required(o,'owner'),isoDate(required(o,'due'))]);await audit(db,p.id,actor,cmd,out);break;}
 case 'close-task':{const t=await resolve(db,'tasks',required(o,'task'));if(t.status==='done')throw Error('Task is already done');out=await db.query("UPDATE tasks SET status='done',resolution=$2 WHERE id=$1 RETURNING *",[t.id,required(o,'resolution')]);await audit(db,t.product_id,actor,cmd,out);break;}
 case 'review-product':{
 const p=await product(),c=await resolve(db,'channels',required(o,'channel'));if(o['claims-checked']!==true)throw Error('Read the product content and use --claims-checked to attest all claims are recorded or removed');
 await db.query('SELECT id FROM products WHERE id=$1 FOR UPDATE',[p.id]);
 const r=(await db.query('SELECT * FROM channel_readiness WHERE product_id=$1 AND channel_id=$2',[p.id,c.id]))[0];
 if(r.missing_fields.length||r.claim_issues||!r.enabled||!r.owner.trim())throw Error('Product is blocked: required fields, claim review, enabled status and owner must be resolved');
 out=await db.query('INSERT INTO reviews(product_id,channel_id,product_revision,reviewer,note,claims_checked) VALUES($1,$2,$3,$4,$5,true) RETURNING *',[p.id,c.id,r.revision,actor,required(o,'note')]);await audit(db,p.id,actor,cmd,out);break;}
 case 'log':{const p=await product();const note=required(o,'note');await audit(db,p.id,actor,'note',{note});out=[{sku:p.sku,note}];break;}
 case 'import':out=await importPimberly(db,o,pos,actor);break;
 case 'export':{
 const snapshot={format:'product-information-v1',exported_at:new Date().toISOString(),data:{}};
 await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const t of ['products','channels','product_values','claims','tasks','reviews','import_rows','activity'])snapshot.data[t]=await db.query(`SELECT * FROM ${t} ORDER BY id`);await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
 out=[{file:writePrivate(outputFile(o,'exports','json'),JSON.stringify(snapshot,null,2)+'\n'),products:snapshot.data.products.length}];break;}
 case 'channel-export':{
 const c=await resolve(db,'channels',required(o,'channel'));
 const items=await db.query(`SELECT p.sku,p.name,COALESCE((SELECT jsonb_object_agg(v.attribute,v.value) FROM resolved_values v WHERE v.product_id=p.product_id AND v.channel_id=p.channel_id),'{}'::jsonb) attributes FROM release_queue p WHERE p.channel_id=$1 AND p.ready ORDER BY p.sku`,[c.id]);
 const file=writePrivate(outputFile(o,'feeds','json'),JSON.stringify({channel:c.name,locale:c.locale,generated_at:new Date().toISOString(),products:items},null,2)+'\n');out=[{file,products:items.length,note:'Private file only. Review before delivery; no external system contacted.'}];break;}
 case 'draft-supplier':{
 const supplier=required(o,'supplier');const rows=await db.query("SELECT p.sku,t.title,t.due_on FROM tasks t JOIN products p ON p.id=t.product_id WHERE lower(p.supplier)=lower($1) AND t.status='open' ORDER BY t.due_on",[supplier]);if(!rows.length)throw Error('No open supplier tasks');
 out=[{file:writePrivate(outputFile(o,'drafts','md'),`# Draft supplier follow-up\n\nTo: ${supplier}\n\nPlease confirm the following product details.\n\n${rowsText(rows)}\n\nDraft only. No message has been sent.\n`),tasks:rows.length}];break;}
 case 'weekly-review':{
 out={readiness:await run(db,'readiness'),attention:await run(db,'attention'),supplier_chase:await run(db,'supplier-chase')};break;}
 }
 if(mutating.has(cmd))await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');
 return out;
 }catch(e){if(mutating.has(cmd))await db.exec('ROLLBACK');throw e;}
}

async function importPimberly(db,o,pos,actor){
 if(pos[0]!=='pimberly')throw Error('Usage: import pimberly --file=export.csv --actor=Name [--mapping=mapping.json]');
 const rows=parseCsv(fs.readFileSync(required(o,'file'),'utf8'));if(!rows.length)throw Error('Export has no product rows');
 const map=o.mapping?JSON.parse(fs.readFileSync(o.mapping,'utf8')):{sku:'Primary ID',name:'Name',family:'Family',supplier:'Supplier',owner:'Owner',attributes:[{column:'Description',attribute:'description'},{column:'Material',attribute:'material'},{column:'Care',attribute:'care'},{column:'Barcode',attribute:'barcode'}]};
 if(!map.sku||!map.name)throw Error('Mapping requires sku and name headers');
 if(map.attributes!==undefined&&!Array.isArray(map.attributes))throw Error('Mapping attributes must be an array');
 const head=Object.keys(rows[0]);
 if(o.mapping){for(const k of ['sku','name','family','supplier','owner'])if(map[k]&&!head.includes(map[k]))throw Error(`Missing mapped header ${map[k]}`);for(const a of map.attributes||[])if(!head.includes(a.column))throw Error(`Missing mapped header ${a.column}`);}
 for(const k of ['sku','name'])if(!head.includes(map[k]))throw Error(`Missing mapped header ${map[k]}`);
 const attrs=map.attributes||[];const targets=new Set();for(const a of attrs){if(!a.column||!a.attribute)throw Error('Each attribute mapping needs column and attribute');const key=JSON.stringify([a.attribute,a.locale||'',a.channel||'']);if(targets.has(key))throw Error('Duplicate attribute destination');targets.add(key);if(a.channel)await resolve(db,'channels',a.channel);}
 let imported=0,skipped=0;const seen=new Set();
 for(const row of rows){
 const sku=row[map.sku].trim(),name=row[map.name].trim();if(!sku||!name)throw Error('Every row needs a Primary ID and name');if(seen.has(sku.toLowerCase()))throw Error(`Duplicate source product ${sku}`);seen.add(sku.toLowerCase());
 const fingerprint=createHash('sha256').update(JSON.stringify({row,map})).digest('hex');
 const existing=(await db.query("SELECT * FROM import_rows WHERE source='pimberly' AND source_id=$1",[sku.toLowerCase()]))[0];
 if(existing){if(existing.fingerprint!==fingerprint)throw Error(`Changed source or mapping for ${sku}; reconcile explicitly before replacing local content`);skipped++;continue;}
 const p=(await db.query('INSERT INTO products(sku,name,family,supplier,owner) VALUES($1,$2,$3,$4,$5) RETURNING *',[sku,name,row[map.family]||'general',row[map.supplier]||'',row[map.owner]||'']))[0];
 for(const a of attrs){if(!head.includes(a.column))continue;const channel=a.channel?(await resolve(db,'channels',a.channel)).name:'';await db.query('INSERT INTO product_values(product_id,attribute,locale,channel,value) VALUES($1,$2,$3,$4,$5)',[p.id,a.attribute,a.locale||'',channel,row[a.column]]);}
 await db.query("INSERT INTO import_rows(source,source_id,product_id,fingerprint,raw) VALUES('pimberly',$1,$2,$3,$4::jsonb)",[sku.toLowerCase(),p.id,fingerprint,JSON.stringify(row)]);await audit(db,p.id,actor,'import',{source:'pimberly',source_id:sku,fingerprint});imported++;
 }
 return [{imported,skipped,review_required:true,dry_run:!!o['dry-run']}];
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{const {cmd,opts,pos}=parseArgs(process.argv.slice(2));db=await getDb();const result=await run(db,cmd,opts,pos);console.log(opts.json?JSON.stringify(result,null,2):Array.isArray(result)?rowsText(result):Object.entries(result).map(([k,v])=>`${k}\n${rowsText(v)}`).join('\n\n'));if(opts['dry-run'])console.error('Dry run: no database changes saved');}
 catch(e){console.error(JSON.stringify({error:e.message,...e.candidates?{candidates:e.candidates}:{}},null,2));process.exitCode=1;}finally{await db?.close();}
}
