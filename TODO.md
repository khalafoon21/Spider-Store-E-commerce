# TODO - Missing Features Implementation

- [ ] Backend: Product management APIs
  - [ ] Add product model methods for update/delete/list with category filtering
  - [ ] Add controller handlers: getMyProducts, updateProduct, deleteProduct
  - [ ] Add router endpoints for admin product management

- [ ] Backend: Categories support for storefront filtering
  - [ ] Add categories listing endpoint
  - [ ] Add products filtering by category id in API/model

- [ ] Backend: Profile update support
  - [ ] Add user model methods for profile/password update
  - [ ] Add `PUT /api/profile` controller + route

- [ ] Frontend Admin
  - [ ] Update add-product page to use file upload input (FormData)
  - [ ] Add manage-products page (list/edit/delete)
  - [ ] Add manage-products link in admin sidebar

- [ ] Frontend Store
  - [ ] Add categories filter UI in homepage
  - [ ] Wire category filter with products API

- [ ] Frontend Profile
  - [ ] Add order details toggle (show order items)
  - [ ] Add profile settings form (default shipping address + password)

- [ ] Validation
  - [ ] Run quick sanity checks for routes and main frontend flows
  - [ ] Final implementation report
