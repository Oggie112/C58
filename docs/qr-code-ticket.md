# C58 — Door Scanning / Ticket Verification

## Context

C58 has used Skiddle in the past. Skiddle's booking fees are the reason for moving ticket sales in-house (Sanity + SumUp + Supabase + Brevo, per [`sale-architecture.md`](sale-architecture.md) and the [Ticketing Roadmap](roadmaps/ticketing.md)). Skiddle offers a free scanning app, RapidScan, supporting up to 80,000 tickets — worth checking whether it (or a similar platform's scanner) could be used standalone for door verification even without using the rest of that platform.

## Findings: Skiddle RapidScan

- RapidScan is Skiddle's own barcode scanning app — well-built for what it is: works offline per-device once an event is loaded, syncs redemptions across multiple devices/entrances when connectivity returns, can filter a device to scan only certain ticket types (e.g. a VIP-only entrance).
- It validates tickets that were **generated and issued through Skiddle's own "Promotion Centre"** — i.e. tickets sold via Skiddle's checkout, with Skiddle's own barcode format.
- No evidence of an API for feeding externally-generated ticket codes (from our own DB) into RapidScan for validation. Skiddle's separate public API is for event listing/search data, not ticket issuance/scanning.
- **Conclusion**: using RapidScan means routing sales through Skiddle's platform itself (their fees, their checkout), not just borrowing the scanner. Doesn't fit — it's the same problem the whole milestone is trying to move away from.

## Findings: TicketLeap and similar (Ticketebo, EC/EventCartel, Ticketshop Scanner)

Checked TicketLeap specifically, plus a handful of comparable small-event ticketing platforms with "free scanning apps." All follow the **same structural pattern as Skiddle**: the free scanner only validates tickets issued through that platform's own checkout/box office. It's the front-end of their box office, not a standalone verification service.

- TicketLeap: sources conflict on whether it even has a usable API (one says yes/restricted, one says no) — moot either way, since the scanning app itself isn't built to validate arbitrary external ticket codes.
- Same lock-in pattern held across every comparable platform checked.

**Conclusion**: this is structural to the category, not specific to Skiddle. No turnkey platform's "free scanner app" is usable as a bolt-on verification layer for tickets issued outside their system.

## Decision: build the scanner in-house

Not a "third-party app" — a small, fully in-house web page using an open-source scanning library (`html5-qrcode` or similar) as a dependency, not a service. Consistent with the rest of the stack (own DB, own auth, own email).

**What it actually is:**
- A single staff-only route (e.g. `c58.uk/scan`) in the same codebase as the rest of the site — not a separate app, no App Store deployment.
- Works in any phone's browser via camera permission.
- `html5-qrcode` decodes the camera feed into the ticket code string — the entire "scanning" mechanism, a few lines of setup.
- On decode, calls the existing scan-validation endpoint (atomic check-and-flip against the `tickets` table: `valid` → `used`, reject if already `used` or `voided`).

## Staff access: two shared codes, one dedicated device

No user accounts — matches the low-friction auth model used everywhere else in this project. Two codes, not one:

- **Staff code** — shared with anyone working the door. Any device logged in with it behaves the same: live scanning only, straight to the server, every time. It has no offline capability at all.
- **Admin code** — works on exactly **one dedicated physical device**, chosen and handed to whoever's running the door at the start of the night (not a personal phone, not a role any staff phone can assume). While the venue's online, an admin-code device is indistinguishable from a staff-code device — the code only matters the moment connectivity drops (see Offline handling, below).

**Enforced two ways, not one:**
- **Software**: the server tracks a single active admin session. A new admin-code login invalidates or rejects any other concurrent one — the offline-write capability physically cannot exist on two devices at once, regardless of who's holding the code.
- **Training**: the admin code is only ever given to the person running the door, on the one device kept for that purpose.

The reason for both: this design's entire safety guarantee for an outage depends on exactly one device writing locally at a time. Relying on staff discipline alone under pressure is exactly the kind of thing that slips on a busy night — the software enforcement makes the guarantee real rather than assumed.

## Feedback layer

- **Vibrate** (`navigator.vibrate`) as the primary per-scan signal — this is a nightclub/events door, ambient music will bury a phone speaker beep.
- **Full-screen colour flash** — green + tick for valid, red/buzz for invalid or already-used — so staff read the result at a glance under pressure, no text to parse.
- Optional: show ticket tier on success (useful if e.g. VIP uses a different entrance), running scanned-count on device.

## Offline handling

Connectivity at C58's venues is good — this isn't designed against frequent outages, but a rare one shouldn't mean the door stops working, and it shouldn't quietly reopen the double-admission risk the whole feature exists to close.

- **Regular (staff-code) devices**, on losing connection: stop scanning immediately, show "NO CONNECTION — hand off to admin device." No local write path exists on these devices — nothing to build here beyond detecting the failure and displaying it clearly.
- **The admin device**, on losing connection: switches into local-cache-and-queue mode. Its local cache of ticket codes/status is kept continuously synced while it's online (not a one-off pull at door-open), so it's as current as possible the instant connectivity drops. Scanning continues exactly as normal for staff — same camera, vibrate, tick — but each accepted scan flips the local cache and queues the write instead of hitting the server directly.
- Because the admin device is the only device permitted to write during an outage — enforced server-side, not just by training — every queued flip is safe by construction. There's only ever one writer, so there's nothing to conflict with and nothing to reconcile by hand later.
- **No phone/no QR shown, but online**: a name/email search box on the same `/scan` page, hitting the same live atomic endpoint as a camera scan. Zero extra risk — it's still the single server source of truth, just a different input method. This is the everyday fallback for "forgot my phone," not an outage measure.
- **No phone/no QR shown, during an outage**: routed through the admin device — same local-write path as a scan, just name/email search against its cached list instead of a camera decode.
- **On reconnect**: the admin device drains its queue to the server, in order — every flip lands cleanly, since it was the sole writer throughout. Regular devices then refresh their local valid/used state from the server *before* resuming live scanning, so none of them briefly show a code as valid that the admin device already used during the outage.

What this deliberately avoids: full multi-device offline sync with post-hoc conflict detection. That was considered and dropped — reconciling a conflict after two offline devices both accept the same code doesn't actually help, because both people are already inside by the time it's detected. Restricting writes to one device during an outage prevents the conflict from being possible at all, for less engineering than detecting and flagging it after the fact would have taken.

## Door verification flow (end to end)

1. `ticket_code` generated per admission at purchase time, stored in the `tickets` table.
2. QR encoding just that code (opaque string, no embedded meaning) — embedded in the confirmation email.
3. **Normal operation**: camera scan (or name/email search) → server-side atomic check-and-flip → accept/reject via vibrate + colour flash. The server coordinates every device; devices never need to coordinate with each other.
4. **Outage**: regular devices stop and hand off; the admin device keeps scanning, writing to its local queue instead of the server — see Offline handling above.
5. **Reconnect**: admin device drains its queue; regular devices resync their local cache; normal multi-device operation resumes.

## Why barcode/QR over name-only lookup

Name-only checks can't stop two people claiming the same name; a scanned code that's already flagged `used` is unambiguous. QR/barcode is also just faster and reads as more professional at the door — was the original motivation for exploring this at all.
