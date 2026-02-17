# Specification

## Summary
**Goal:** Update the Product Name dropdown to use the provided 13-name product list and display ~5 visible options with scrolling for the rest.

**Planned changes:**
- Update `frontend/src/constants/productOptions.ts` to export `PRODUCT_NAMES` containing exactly the 13 product names provided (remove any legacy/extra names).
- Update `frontend/src/components/ProductFormModal.tsx` to import and use `PRODUCT_NAMES` for the Product Name `<Select>` options (not dependent on previously-created products).
- Adjust the Product Name dropdown UI in the modal so it shows about 5 items at a time and supports vertical scrolling within the dropdown (fixed max height ~250px with `overflow-y-auto` applied to the dropdown’s scroll container), without modifying `frontend/src/components/ui`.

**User-visible outcome:** In the “Add New Product” modal, the Product Name dropdown lists exactly the 13 provided product names and shows ~5 at once, with smooth in-dropdown scrolling to access the remaining options.
