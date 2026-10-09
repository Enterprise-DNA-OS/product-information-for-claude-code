# Product Information for Claude Code

Own your product catalogue, its channel checks and the evidence behind its claims. An MIT-licensed database and command library for manufacturers, distributors and brand owners. Runs with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free. Try the fictional catalogue and import a mapped Pimberly CSV. | Your attributes, review rules, documents, web front end or different stack. | Installed, connected and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=pimberly&utm_medium=customise) | [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=pimberly&utm_medium=managed) |

## The catalogue meeting

Five weekly rituals: collect supplier content, check channel completeness, review product claims, approve revised content and prepare a private channel export. The fictional Harbour Product Supply demo includes missing Australian retail content, a pending recycled-content claim, an overdue supplier request and a stale product.

## Quick start

Node 20 or later on Windows or Linux:

```bash
git clone https://github.com/Enterprise-DNA-OS/product-information-for-claude-code.git
cd product-information-for-claude-code
npm install
npm run demo
npm test
npm run pim -- weekly-review
npm run view
npm run docs
```

Local PGlite runs in .data/db and supports one process. DATABASE_URL selects Postgres 15 or later with verified TLS. For real records, select a fresh DATA_DIR, migrate and import without seeding. Shared use needs authenticated operators, restricted database roles and protected backups. Actor labels record attribution, not verified identity.

29 CLI commands including help, plus 30 slash recipes. [Command reference](docs/cli.md). The same .claude/commands library serves every agent runtime through CLAUDE.md and AGENTS.md.

## Content approval follows the current revision

A channel file includes only enabled products with an owner, every required attribute, current claim evidence records and a review of the current content revision. Changing a product or claim invalidates earlier reviews. Locale and channel content overrides shared values; an explicit blank blocks a required field. No translation or variant inheritance is implied.

The owner must check that claims in descriptions are recorded or removed before approving content. Record checks cannot prove a statement is true. [Rules and limits](docs/compliance.md).

## Ten questions beyond a fixed report

Pimberly offers reporting and workflows. These are questions the shipped commands answer, not unsupported claims that Pimberly cannot answer them.

1. Which enabled products still lack content for Australia? `readiness --channel=au-retail`
2. Which products are ready for the New Zealand channel? `release-queue --channel=nz-web`
3. Which claims are waiting for evidence? `compliance`
4. Which claims have reached their next review date? `compliance`
5. Which supplier tasks are overdue? `attention`
6. Which products have no named owner? `attention`
7. Which old products need their content checked? `attention`
8. What did the last recorded content change contain? `history --product=BOT-750`
9. Which channel needs a fresh review after an edit? `readiness`
10. What does each supplier still owe us? `supplier-chase`

## Your first hour: ten things to ask for

1. Put our business name, logo and colours on the product review sheet.
2. Show what blocks the Australian channel.
3. Show what is ready for New Zealand.
4. Draft a supplier follow-up from overdue tasks.
5. Record evidence for a claim after I check it.
6. Add our packaging attribute through /customise.
7. Add a catalogue-owner report through /new-view.
8. Rehearse our Pimberly export with a dry run.
9. Compare a product's current values with its change history.
10. Prepare a private channel file for my review.

## Documents and read-only views

brand.json controls business name, logo and colours. npm run docs creates a product information review sheet per product and a supplier content brief for products with open requests. npm run view creates the catalogue meeting and supplier follow-up reports. Open the HTML files locally or print them to PDF. These are internal review documents, not approved product labels. Drafts, snapshots and feeds remain private. [Why no front end](docs/why-no-front-end.md).

## Switch from Pimberly

[Replacement guide](docs/replace-pimberly.md). Import a mapped row-per-product CSV in one command. Preserve every original field, roll back malformed batches and skip identical repeats. Changed source rows require explicit reconciliation. The base imports product content, not media files, inherited variants, approval history or live channel connections. Those requirements belong in the migration scope.

## Verification

npm test uses an isolated database and exercises every CLI command, import rollback, repeat imports, ambiguity, channel overrides, evidence expiry, review invalidation, branded documents and exports. CI defines Windows and Linux runs and a disposable Postgres run. [Verification record](docs/verification.md).

MIT licence. Not affiliated with Pimberly or Anthropic. Hosting and coding-agent use carry their own costs. [Research](docs/research.md). [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=pimberly&utm_medium=readme).
