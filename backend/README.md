# PlantCare API

The API stores accounts, persistent login sessions, the plant catalog, guest carts, and orders in MongoDB. Passwords use Node.js `scrypt`; HttpOnly session and cart cookies contain random tokens whose hashes are stored in MongoDB.

## Configure and run

1. Install MongoDB locally or create a MongoDB Atlas database.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` to the database connection string. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `backend/.env` to provision the initial administrator (password must be 12–128 characters). Set `STRIPE_SECRET_KEY` in this private backend environment file to your Stripe test or live secret key; never put it in either frontend or a checked-in example. Set `FRONTEND_URL` to the customer storefront's base URL when it is not `http://localhost:5173`. The example intentionally leaves admin credentials blank; credentials in `.env.example` are not used. Do not put credentials in the example file; keep `.env` private because `.gitignore` excludes it. Both frontends use Vite's `/api` proxy in development.
3. From this directory, run `npm install`, then `npm start` (or `npm run dev` while developing).
4. From `frontend/plant-care`, run `npm run dev`. Vite proxies `/api` requests to the backend on port 5000.
5. From `frontend/plant-care-admin`, run `npm install` and `npm run dev`. Open `http://localhost:5174` for the separate administrator portal. The customer navbar's Admin button opens that page; set `VITE_ADMIN_URL` to its deployed URL when building the customer frontend. Local admin origins are allowed in non-production mode; in production, add the deployed admin origin to `FRONTEND_ORIGIN`.

The backend intentionally refuses to start without a MongoDB connection string. It loads `backend/.env` independent of the current working directory; configured admin values in that file take precedence over stale inherited `ADMIN_*` process variables. The initial built-in plant catalog is inserted into MongoDB on first start. Public signup always creates a customer and cannot assign the administrator role, even if a role is submitted in the request. Administrator credentials are provisioned from the backend environment on startup: the account is created or updated with the configured name, normalized email, scrypt password hash, and administrator role. Without admin credentials, no initial admin account is provisioned. Admin login uses a separate HttpOnly admin session cookie, and customer sessions cannot access admin APIs or mutate the product catalog.

## Endpoints

- `POST /api/auth/signup` registers a name, email, and password. Passwords must be 8–128 characters.
- `POST /api/auth/login` checks the registered email and password and sets a persistent HttpOnly session cookie.
- `GET /api/auth/me` returns the current account when its session is valid.
- `POST /api/auth/logout` revokes the customer database session and clears the customer cookie.
- `POST /api/admin/auth/login`, `GET /api/admin/auth/me`, and `POST /api/admin/auth/logout` manage a separate administrator session cookie.
- `GET /api/admin/dashboard` returns product, category-section, registered customer, and order counts from the database. The admin Categories section currently uses the product catalog as its data source, so its count matches the product list. Customer statistics and the Users endpoint exclude administrator, example-domain, and test/debug accounts. Revenue and sales locations exclude cancelled and failed orders. The `/api/admin/products`, `/api/admin/categories`, `/api/admin/users`, and `/api/admin/orders` routes provide admin-only catalog and account management. The orders route returns every stored order, and mutations require the same valid administrator session.
- `GET /api/products` and `GET /api/products/:id` return the MongoDB plant catalog.
- `POST /api/products`, `PUT /api/products/:id`, and `DELETE /api/products/:id` require a valid administrator session. Admin catalog management is provided by `/api/admin/products`.
- `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/:productId`, and `DELETE /api/cart/items/:productId` store a guest cart against an HttpOnly browser cookie.
- `POST /api/checkout` validates delivery details and current stock, calculates prices on the server, stores a Cash on Delivery order, and clears the cart.
- The storefront submits COD selections to `POST /api/checkout`; this creates a Pending-payment order, updates stock, and clears the cart.
- The storefront submits Card selections to `POST /api/checkout/session`. The backend creates a card-only Stripe Checkout Session using the server-calculated INR total. `POST /api/checkout/complete` retrieves that session using the backend secret key, verifies its completion, paid status, currency, amount, draft, and card payment method, and only then saves a Paid order and clears the cart. Failed, cancelled, or otherwise unconfirmed payments are never saved as Paid orders.
- Checkout requires a signed-in storefront account.
- `GET /api/orders/:reference` retrieves an order only from the browser cart cookie that created it.

Stripe Checkout uses INR and accepts Card only. Use Stripe test keys and test payment methods during development. Cash on Delivery remains available without Stripe configuration. Stripe Link can still appear within card payments when it is enabled in the Stripe account. To remove Link authentication from hosted Checkout, disable Link under Wallets in Stripe Dashboard payment method settings for each payment method configuration. The application continues to accept regular card payments, including any bank or 3D Secure authentication required by Stripe.
