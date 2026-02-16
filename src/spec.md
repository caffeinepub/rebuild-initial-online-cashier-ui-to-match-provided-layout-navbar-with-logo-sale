# Specification

## Summary
**Goal:** Update the Product form to use fixed dropdown options for Category, Size, and Product Name, and add a numeric HPP field that is stored in the backend.

**Planned changes:**
- Update shared product option constants so Category is exactly: Teh, Kopi, Matcha, Coklat, Lemon; and Size is exactly: Kecil, Besar, Jumbo.
- Change the Product Name field in ProductFormModal from free-text to a required dropdown with the specified fixed list of product names.
- Ensure selecting a Product Name does not auto-fill or modify Category or Size; both remain required and manually selectable.
- Add a required HPP numeric input (type="number", min 0, no currency formatting) to the Product form and submit it as a number.
- Extend the backend Product record to store HPP (Nat) and accept it in addProduct; add a conditional migration (backend/migration.mo only if needed) to default existing stored products’ HPP to 0.

**User-visible outcome:** In the Product form, users can pick Category, Size, and Product Name from fixed dropdowns, manually choose Category/Size regardless of Product Name, and enter a numeric HPP value that is saved with each product.
