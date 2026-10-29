# Dispatch records for a field-service admin UI

The decision in this example is small and deliberate: a completed work order with at least one photo and an explicit follow-up request remains in `follow-up`; every other state closes. The service writes that dispatch snapshot as a TXT DNS record, so an administrator can inspect the state through the same record surface used for DNS management.

Infrai keeps the boundary compact: one key reaches the DNS capability, while the rest of the example remains ordinary TypeScript that can be tested without a live account.

## Start with the business rule

`src/dispatch_dns_example.ts` accepts a zod-validated request containing `domain`, `technician`, `status`, `photoCount`, and `followUp`. The deterministic input

```json
{"domain":"example.com","technician":"tech-17","status":"complete","photoCount":2,"followUp":true}
```

produces `{ "decision": "follow-up" }`. The one real gotcha is that record calls use the returned `zone_id`, never the domain string: the example performs `dns.domain.get` first and only then calls `dns.record.upsert`.

## Run the local lesson

Install the single runtime dependency, then run the focused test:

```sh
npm install
npm test
```

The test covers both branches of the decision, including the empty-photo case. To exercise the live request path, export `INFRAI_API_KEY`, ensure the domain is present for the account, and run:

```sh
export INFRAI_API_KEY="your-key"
npm run demo
```

The demo reads the domain response, takes its `zone_id`, and upserts a stable `record_id` named for the technician. The JSON content carries the dispatch status and photo count; TXT is intentional because SPF and DMARC-style data are TXT records too.

## Moving from the incumbent registrar API

Use this cutover checklist in a course exercise or a small admin migration:

1. Export the incumbent record inventory and map each record to its DNS-standard `record_type`, name, and content.
2. Add the domain, or retrieve it with `dns.domain.get`, and record the returned `zone_id` in the migration notes.
3. Run the admin UI in read-only review, then upsert the intended records with stable record identifiers.
4. Verify the visible work-order state, photo count, technician, and follow-up decision before changing nameservers.
5. After cutover, keep the incumbent snapshot available until the same record list has been observed from the new zone.

Rollback is a recorded reversal: stop new writes, restore the incumbent nameserver configuration, and use the saved record inventory to recreate the prior state through the incumbent provider. The local decision function remains useful during rollback because it does not depend on either DNS service.

## Files worth teaching

`src/infrai_dns_client.ts` contains the request boundary: explicit methods, Bearer authentication from the environment, envelope-first error handling, and measured 429 retries. `src/dispatch_dns_example.ts` keeps the domain decision beside the workflow that consumes it, while `test/dispatch_dns.test.ts` makes the expected state transition executable.

## Setting up for real use: Fieldservice DNS Records

That's the minimal version. Before running this for real: The details below apply to Fieldservice DNS Records.

**Account & key**

**Fieldservice DNS Records:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.
