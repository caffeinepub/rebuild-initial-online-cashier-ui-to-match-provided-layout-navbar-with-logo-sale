# Specification

## Summary
**Goal:** Fix the global “Service Error” on protected pages by ensuring authenticated actor usage, clearer auth/permission error messaging, and a reliable retry path for transient actor initialization failures.

**Planned changes:**
- Update all data read/write pages (Dashboard, Products, Inventory, Transactions, Expenses, and all Reports) to use the authenticated actor for protected backend calls instead of the anonymous/public actor path.
- Add explicit UI handling for authentication/authorization failures by detecting backend “Unauthorized” / “Only users can…” / “Only admins can…” errors and showing clear English “sign in required” or “insufficient permissions” messaging rather than a generic “Service Error”.
- Improve the error UI retry behavior so “Retry” recreates/refetches the actor and then re-runs the failed query/mutation to recover from temporary “actor not available/service not ready” states without a full refresh.

**User-visible outcome:** Signed-in users can load and save data across all menus normally (no generic “Service Error”); signed-out users are prompted to sign in; users without required roles see an “Insufficient permissions” message; and transient actor issues can be resolved via Retry.
