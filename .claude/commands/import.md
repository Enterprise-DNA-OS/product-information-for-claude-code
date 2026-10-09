---
description: Import for the product catalogue.
---

Read CLAUDE.md. Run `node scripts/pim.mjs import pimberly --file=<export.csv> --mapping=examples/pimberly/mapping.json --actor="<operator>" --dry-run --json` using the operator's real values in place of placeholders.

Read docs/replace-pimberly.md first. Inspect the actual export headers and map them. Compare the dry-run counts before removing --dry-run. Imported products remain disabled and unreviewed.

Read current records before answering. For mutations, require an attributed operator and use --dry-run first. Never invent content, evidence, approvals or supplier confirmations. If a reference is ambiguous, show the candidates and stop. Keep exports and drafts private. Never deliver a feed or send a message.
