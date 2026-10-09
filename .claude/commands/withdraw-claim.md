---
description: Withdraw claim for the product catalogue.
---

Read CLAUDE.md. Run `node scripts/pim.mjs withdraw-claim --claim=<id> --reason="<reason>" --actor="<operator>" --json` using the operator's real values in place of placeholders.

Remove the withdrawn claim from all product copy with set-value as well. Withdrawal alone does not edit descriptions.

Read current records before answering. For mutations, require an attributed operator and use --dry-run first. Never invent content, evidence, approvals or supplier confirmations. If a reference is ambiguous, show the candidates and stop. Keep exports and drafts private. Never deliver a feed or send a message.
