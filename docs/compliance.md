# Product claim record checks

Sources checked 9 October 2026. This database supports internal catalogue review. It does not certify products, assess scientific evidence, determine compliance with labelling standards or replace the responsible person's judgment.

## External rules and the implemented check

The [New Zealand Commerce Commission's guidance on accurate claims](https://www.comcom.govt.nz/business/dealing-with-typical-situations/making-accurate-claims/) explains that a business needs reasonable grounds when it makes a claim. The [ACCC guidance on false or misleading claims](https://www.accc.gov.au/consumers/advertising-and-promotions/false-or-misleading-claims) covers accurate representations about goods and services. [ACCC environmental claims guidance](https://www.accc.gov.au/consumers/advertising-and-promotions/environmental-and-sustainability-claims) is relevant to recycled-content and sustainability wording.

`compliance` reads claim_issues. CLAIM-EVIDENCE flags every non-withdrawn claim that is pending, has no evidence reference or reviewer, has a missing or future review date, or has reached its next review date. These are prompts to examine the underlying material. The software does not open the evidence or decide that the reference substantiates the statement. It cannot detect unrecorded claims hidden in prose. Product review therefore requires the reviewer to confirm that all claims in the content are recorded or removed.

## Internal policies

The operator chooses the next evidence review date. There is no statutory review interval encoded here. A review is due on the date, not the day after it. Ninety days without a product content change produces a stale-content prompt; that is an internal policy, not a legal deadline. Open tasks become overdue the day after their due date. Required attributes are business rules chosen per channel, not a complete legal labelling checklist.

A channel file includes only products with an owner, enabled status, all required fields, no unresolved claim record checks and a review of the current content revision. Content and claim edits invalidate prior reviews. Withdrawing a claim does not rewrite a description: remove the wording as a separate content edit before reviewing the product.

Record history is append-only through the database trigger, but a database owner can change the software. Actor labels are not electronic signatures. Real team use requires authentication, access controls and backups. Restricted product categories, safety certification, food labels, medical claims and statutory recalls need a separately scoped system.
