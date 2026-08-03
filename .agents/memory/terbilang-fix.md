---
name: terbilang function fix
description: The original terbilang() for Indonesian number-to-words had broken logic for 20-99
---

The original code had two `if (n < 100)` branches. The first used wrong index math on the `satuan` array for tens (e.g. n=30 returned "tiga" instead of "tiga puluh"). The second was dead code (unreachable) but had the correct logic.

**Fix:** Use a separate `puluhan` array: `["","","dua puluh","tiga puluh",...]` and return `puluhan[Math.floor(n/10)] + (n%10 !== 0 ? " " + satuan[n%10] : "")`.

**Why:** This affected kuitansi terbilang output — amounts like Rp 2,500,000 would display corrupted text.
