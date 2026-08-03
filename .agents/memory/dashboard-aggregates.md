---
name: Dashboard SQL aggregates
description: Dashboard must use SQL COUNT/SUM aggregates, never fetch all units into memory
---

GET /dashboard previously fetched ALL units into memory and filtered/reduced in JS. This causes severe latency as data grows.

**Rule:** Always use `count()`, `sum(sql\`...\`)` from drizzle-orm, run in parallel with `Promise.all`, and `limit(5)` for recent units.

**Why:** A full table scan of thousands of units for 4 numbers is O(n) per request. SQL aggregates are O(1) index scans.

**How to apply:** Any new aggregate metric on units must be added as a SQL expression, not a JS filter.
