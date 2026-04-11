# TODO - Frontend Errors Fixes

- [x] Fix critical issues in `frontend/index.html`:
  - [x] Add null-safe handling for `searchInput`
  - [x] Move from `window.onload` to `addEventListener('load', ...)`
- [x] Fix critical issues in `frontend/pages/orders/checkout.html`:
  - [x] Tighten checkout success condition
  - [x] Move from `window.onload` to `addEventListener('load', ...)`
- [x] Fix critical issues in `frontend/pages/products/product.html`:
  - [x] Prevent cart quantity from exceeding stock
  - [x] Move from `window.onload` to `addEventListener('load', ...)`
- [ ] Fix critical issue in `frontend/pages/profile/profile.html`:
  - [ ] Avoid mutating orders array with direct `reverse()`
  - [ ] Move from `window.onload` to `addEventListener('load', ...)`
- [ ] Add basic HTML-escape utility in key frontend pages where `innerHTML` uses API data
- [ ] Run static validation pass over changed frontend files
- [ ] Produce final fixed-issues report
