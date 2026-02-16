# Specification

## Summary
**Goal:** Fix the Inventory Report (stock adjustment history) so it can be opened without triggering an authentication error.

**Planned changes:**
- Update the backend `getInventoryReports(filter, daysBack)` query to allow anonymous calls while preserving existing filter (`description`) and timeframe (`daysBack`) behavior.
- Adjust the frontend Reports → Inventory Report view to load using the existing anonymous actor flow and avoid showing authentication-required error states.

**User-visible outcome:** Users can open Reports → Inventory Report and see stock adjustment history (or the normal empty state) without being asked to sign in or encountering an authentication error; temporary backend outages still show the existing connection error UI with Retry.
