# Specification

## Summary
**Goal:** Populate the Product Name dropdown in the Product Form modal from backend product data and make the dropdown scrollable for long option lists.

**Planned changes:**
- Update ProductFormModal to derive Product Name dropdown options from the existing React Query products list (actor.listProducts) instead of the hardcoded PRODUCT_NAMES constant.
- Add basic loading and error handling for the backend-backed options (e.g., disable/select state messaging) to prevent crashes.
- Constrain the dropdown list height and enable default vertical scrolling for long Product Name option lists via SelectContent styling/classes.

**User-visible outcome:** In the Product Form modal, the Product Name dropdown shows the current backend product names and becomes a long, scrollable dropdown when many products exist.
