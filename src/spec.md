# Specification

## Summary
**Goal:** Remove Internet Identity/login requirements and make the app use a single shared global dataset accessible to everyone, while applying a consistent non-blue/purple visual theme.

**Planned changes:**
- Update backend authorization so all core data (products, inventory, sales/transactions, reports, cash transactions, and other existing records) is readable/writable by any anonymous caller, with no admin/user gating or secret token initialization required.
- Switch frontend data access to use an anonymous actor only by migrating relevant hooks off `useActor()` to an anonymous/public actor source, and remove any dependency on URL secret initialization for normal operation.
- Remove Internet Identity sign-in gating from UI pages by eliminating `SignInRequiredState` and any “sign in required” conditional rendering, keeping standard loading/error states.
- Apply a single cohesive UI theme across all pages and dialogs with consistent colors/typography/spacing, using a primary accent color that is not blue/purple.

**User-visible outcome:** The app works fully without signing in; anyone on any device sees and can update the same shared products, inventory, transactions, and reports, with a consistent themed UI across all screens.
