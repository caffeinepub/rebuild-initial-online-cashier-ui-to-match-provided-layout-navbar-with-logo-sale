# Specification

## Summary
**Goal:** Prevent Version 20 “Failed to load dashboard/products/inventory” issues by making actor initialization and access-control initialization non-blocking and resilient to missing/invalid admin tokens.

**Planned changes:**
- Update `frontend/src/hooks/useActor.ts` so `_initializeAccessControlWithSecret(adminToken)` failures never block or fail actor creation; log errors to console and continue with a usable authenticated (or anonymous) actor.
- Adjust `backend/main.mo` so `_initializeAccessControlWithSecret` is safe to call with empty/invalid secrets, never traps, and does not prevent subsequent calls to `fetchDashboardSummary`, `listProducts`, or `listInventoryItems`.
- Improve frontend handling for “Actor not available” initialization failures so they surface as technical loading errors (not authentication-required), preserve existing English failure messages, and always provide a working Retry that re-attempts actor init and the failed query.

**User-visible outcome:** Authenticated users can load Dashboard/Products/Inventory even when the admin token is missing/invalid or access-control initialization fails; errors show the correct technical loading state with a Retry that works once initialization succeeds.
