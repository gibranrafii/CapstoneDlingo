# Frontend Desa Dlingo

Browser-local UI prototype based on the nine mockups embedded in `capstone-desa dlingo.docx`. HTML, CSS, and vanilla JavaScript; no build step or backend is required.

## Run locally

From the repository root:

```sh
python3 -m http.server 5500 --bind 127.0.0.1
```

Open **http://127.0.0.1:5500/frontend/**. Serving `frontend/` as the HTTP root also works. Use HTTP rather than opening files directly.

Alternatively, run `npm run dev` from `frontend/` and open **http://127.0.0.1:5500/**. This preview server only serves the frontend directory.

## Demo accounts

All three seeded accounts use the password **`demo12345`**. Login accepts username or email.

| Role | Username | Email |
| --- | --- | --- |
| Farmer (Budi Santoso) | `admin` | `budi@example.com` |
| Administrator | `superadmin` | `admin@dlingo.test` |
| Buyer | `pembeli` | `andi@dlingo.test` |

The farmer's username is `admin` to match the DOCX profile screenshot. All data, sessions, and mutations are local to the browser. The existing `js/api.js` remains separate for later backend integration. This prototype does not call or change the backend.

Product, buyer, caretaker, livestock, user, profile, and order forms update local data. Checkout creates a sample order and updates stock. Cancelling an eligible order restores stock. Bank information is editable; payments and delivery happen outside this prototype. Upload File only previews a locally selected file.

To restore the original reference data, open the browser console and run:

```js
Demo.reset(); location.href = UI.url('login.html');
```

This resets demo accounts, records, sessions, and carts. Initial reference data: 3 products, stock 183, 1 low-stock product (under 10 units), 2 buyers, 4 livestock, 3 caretakers, and no orders.

## Design reference

The blue banners, horizontal navigation, black borders, offset shadows, summary cards, and tables follow the DOCX screenshots. Desktop captures in the document have different sizes; the dashboard and profile images are scaled captures. Mobile layouts and pages not pictured in the document extend the same design.

The frontend remains independent of Express or Laravel. Its demo-store interface is the boundary to replace when connecting a real API.

## Browser checks

From `frontend/`:

```sh
npm ci
npm test
```

Tests use `/usr/bin/chromium` when available. Otherwise run `npx playwright install chromium`, or supply your browser path with `CHROMIUM_PATH=/path/to/chromium npm test`.

The suite starts and stops its own temporary static server. It checks all 17 pages on desktop and mobile, navigation links, local CRUD and persistence, livestock assignments, orders and stock restoration, cart checkout, account flows, and role redirects. Desktop/mobile screenshots are saved to the ignored `test-results/` folder. Tests use isolated browser contexts and leave your normal browser's demo data unchanged.
