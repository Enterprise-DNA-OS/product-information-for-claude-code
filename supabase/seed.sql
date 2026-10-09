INSERT INTO products(id,sku,name,family,supplier,owner,enabled,updated_at) VALUES
 ('10000000-0000-4000-8000-000000000001','BOT-750','Harbour steel bottle','drinkware','Kauri Supply','Mara',true,now()),
 ('10000000-0000-4000-8000-000000000002','BAG-020','Recycled carry bag','bags','Kauri Supply','Mara',true,now()),
 ('10000000-0000-4000-8000-000000000003','BOX-010','Storage box','storage','Tasman Supply','',false,now()) ON CONFLICT DO NOTHING;
INSERT INTO channels(id,name,locale,required_fields) VALUES
 ('20000000-0000-4000-8000-000000000001','nz-web','en_NZ','["description","material","care"]'),
 ('20000000-0000-4000-8000-000000000002','au-retail','en_AU','["description","material","care","barcode"]') ON CONFLICT DO NOTHING;
INSERT INTO product_values(id,product_id,attribute,value) VALUES
 ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','description','Reusable steel bottle, 750 ml'),
 ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','material','Stainless steel'),
 ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','care','Hand wash'),
 ('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002','description','Carry bag'),
 ('30000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000002','material','Supplier confirmation pending') ON CONFLICT DO NOTHING;
INSERT INTO claims(id,product_id,statement) VALUES
 ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','Made with recycled material') ON CONFLICT DO NOTHING;
INSERT INTO tasks(id,product_id,title,owner,due_on) VALUES
 ('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','Obtain supplier evidence for recycled-content claim','Mara',current_date-5),
 ('50000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Confirm retail barcode','Anika',current_date+3) ON CONFLICT DO NOTHING;
INSERT INTO activity(id,product_id,actor,action,detail) VALUES
 ('60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Demo author','seed','{"fictional":true}') ON CONFLICT DO NOTHING;
INSERT INTO products(id,sku,name,supplier,owner,enabled,updated_at) VALUES ('10000000-0000-4000-8000-000000000004','CUP-OLD','Legacy travel cup','Tasman Supply','Anika',true,now()-interval '100 days') ON CONFLICT DO NOTHING;
INSERT INTO reviews(id,product_id,channel_id,product_revision,reviewer,note,claims_checked)
 SELECT '70000000-0000-4000-8000-000000000001',id,'20000000-0000-4000-8000-000000000001',revision,'Mara','Fictional demonstration review; no product claims made',true FROM products WHERE sku='BOT-750' ON CONFLICT DO NOTHING;
