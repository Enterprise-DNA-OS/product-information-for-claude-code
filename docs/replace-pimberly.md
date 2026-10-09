# Move product records from Pimberly

Pimberly's [public API documentation](https://apidocs.pimberly.com/) describes product attributes, primaryId and exports with fileFormat csv and layoutFormat rowPerProduct. Its documented export example maps Primary ID and Description. These are examples, not a universal set of customer headings. The [FAQ](https://pimberly.com/faq/) describes configurable product data and outbound channels. Checked 9 October 2026. The full help centre requires a customer account.

1. In your authorised Pimberly account, create or use a CSV product export with one row per product. Include the primary identifier, name and the attributes you need. Use your account's export help for its exact controls. Keep the original file unchanged and private.
2. Inspect the headers. Copy examples/pimberly/mapping.json into a private working folder and map your actual primary identifier and name headers. Map each content column to an attribute, locale and optional existing channel. Create channels before importing scoped content. Export fully resolved values for variants; this base has no inherited parent-product model.
3. Test the whole file before saving:

```bash
node scripts/pim.mjs import pimberly --file=imports/products.csv --mapping=imports/mapping.json --actor="Catalogue owner" --dry-run --json
```

4. Run the same command without --dry-run. It imports the mapped product and content records in one transaction. It keeps every original column in import_rows.raw. Unknown columns are retained but not made active attributes. Map them when needed. New products are disabled and unreviewed; source approval status is never promoted to a local approval.
5. Reconcile product counts and a sample of every family and locale against the export. Add claim evidence, required fields and owners. Enable products, review their content, then generate a private channel file. Keep Pimberly running until your owner has accepted the comparison.

The default mapping recognises Primary ID, Name, Family, Supplier, Owner, Description, Material, Care and Barcode. Only Primary ID and Name are mandatory. The shipped file is a fictional fixture in this documented CSV shape, not a customer export. Real account headings vary. Comma-separated UTF-8 CSV supports a BOM, CRLF, quoted commas, doubled quotes and multiline text. Convert XLSX or other delimiters locally before import.

Identical repeat imports skip. Changed source rows or changed mappings are refused so a rerun cannot overwrite local work. Duplicate identifiers, unknown channels, existing local identifiers and malformed files roll back the whole import. Reconcile changes explicitly with set-product and set-value and record a note; importing again is not a sync.

Asset binaries, product relationships, inherited variants, workflow history, permissions, automations and live commerce connectors do not carry over. A mapped asset URL is text; no file is downloaded or hosted. Supplier claims need a separate evidence review. Enterprise DNA can scope those migrations and connections in your version. The supported flat catalogue can be rehearsed in a day; a complete account migration depends on those additional requirements.
