# Verification

npm test runs against a temporary PGlite directory, applies the migration twice, seeds twice and checks business behaviour and import failure cases. TEST_DATABASE_URL opts into a disposable Postgres database; the test refuses a nonempty database. Database rows, exports and HTML files used by tests are fictional and removed afterwards. Windows and Linux CI and a Postgres service job are configured. Results are recorded after the checks complete.

Local Linux verification on 9 October 2026: npm install, npm test (72 assertions across all 29 CLI commands), npm run demo, npm run view and npm run docs passed. Both report types and a product sheet were rendered and visually inspected. Brand lint passed all nine main prose files. Cross-platform CI results are reported separately; configuration alone is not evidence of a passed run.

The template's single .github/workflows/ci.yml remains the CI path: Node 20 and 22 on both Windows and Linux, plus Postgres 17.
