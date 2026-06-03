# AasaMedChem Inventory & Order Management System

A high-precision, real-time chemical inventory tracking and order/quotation management system built with Next.js (v16), TailwindCSS (v4), Auth.js (v5), Prisma, and Neon PostgreSQL.

---

## 🌟 Key Features

- **Dual Dashboard View (Role-Based Access Control):**
  - **Admin Panel:** Full Product CRUD, live stock tracking (dual units), and transaction-backed quotation approval workflow.
  - **Seller Portal:** Real-time catalog searching and filtering, dynamic unit conversion calculator, ordering cart, and quotation status history.
- **High-Precision Numeric Engine:** Uses PostgreSQL `Decimal(20,8)` for all rates, stocks, and pricing subtotals to avoid IEEE 754 float inaccuracies.
- **Automatic Unit Conversion:** Supports entering weights in `g` or `kg`, volumes in `mL` or `L`, and count in `item` while keeping database records standardized.
- **Real-Time Stock Deduction:** Stock is checked and atomically deducted in database transactions upon Admin approval of a quotation.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** Next.js 16 (App Router), React 19, TailwindCSS v4
- **Backend:** Next.js Route Handlers (API endpoints) secured with Auth.js (v5 / NextAuth)
- **Database:** Neon-hosted PostgreSQL (managed cloud database)
- **ORM:** Prisma Client
- **Authentication:** Credentials-based JWT strategy with encrypted passwords (bcryptjs)

### High-Level Interaction Workflow

1. **Authentication:** Users log in through `/login`. JWT session callbacks propagate the user's role (`ADMIN` or `SELLER`) to middleware and client contexts.
2. **Product CRUD:** Admin inserts products using display units (e.g. kg). The API converts quantities to base units (e.g. grams) and saves them.
3. **Quotation Placement:** Sellers select items, input quantities in any unit (e.g., L), and see real-time price estimations. Submitting places a `PENDING` order.
4. **Approval & Stock Deduction:** Admin approves the order. A PostgreSQL transaction validates stock levels, updates the order status to `APPROVED`, and decrements the product stock.

---

## 📐 Database Schema

```mermaid
erDiagram
    User {
        String id PK
        String name
        String email UK
        String password
        Role role
        DateTime createdAt
        DateTime updatedAt
    }
    Product {
        String id PK
        String name
        String sku UK
        String description
        ProductDimension dimension
        BaseUnit baseUnit
        Decimal stockQuantity
        Decimal pricePerUnit
        DateTime createdAt
        DateTime updatedAt
    }
    Order {
        String id PK
        String userId FK
        OrderStatus status
        Decimal totalAmount
        DateTime createdAt
    }
    OrderItem {
        String id PK
        String orderId FK
        String productId FK
        Decimal enteredQuantity
        String enteredUnit
        Decimal baseQuantity
        Decimal price
    }
    User ||--o{ Order : places
    Order ||--|{ OrderItem : contains
    Product ||--o{ OrderItem : ordered_in
```

### Table Specifications

#### 1. `User`
- `id` (String, PK, cuid)
- `name` (String)
- `email` (String, Unique)
- `password` (String, BCrypt hash)
- `role` (Role Enum: `ADMIN`, `SELLER`)

#### 2. `Product`
- `id` (String, PK, cuid)
- `name` (String)
- `sku` (String, Unique)
- `description` (String, Nullable)
- `dimension` (ProductDimension Enum: `WEIGHT`, `VOLUME`, `COUNT`)
- `baseUnit` (BaseUnit Enum: `GRAM`, `MILLILITER`, `ITEM`)
- `stockQuantity` (Decimal 20,8) — Stock stored strictly in base unit.
- `pricePerUnit` (Decimal 20,8) — Price stored strictly per base unit.

#### 3. `Order`
- `id` (String, PK, cuid)
- `userId` (String, FK -> User)
- `status` (OrderStatus Enum: `PENDING`, `APPROVED`, `REJECTED`)
- `totalAmount` (Decimal 20,8) — Sum of all item subtotals.

#### 4. `OrderItem`
- `id` (String, PK, cuid)
- `orderId` (String, FK -> Order)
- `productId` (String, FK -> Product)
- `enteredQuantity` (Decimal 20,8) — Quantity in unit requested by seller.
- `enteredUnit` (String) — E.g. "kg", "L", "item".
- `baseQuantity` (Decimal 20,8) — Converted quantity in base unit.
- `price` (Decimal 20,8) — Calculated subtotal for this item.

---

## ⚖️ Unit Storage & Conversion Strategy

To avoid complex run-time calculations and rounding drift, we store all metrics in standardized base units:

| Dimension | Allowed UI Units | Internal Storage Unit | Conversion Factor (1 UI Unit = X Base) |
| :--- | :--- | :--- | :--- |
| **WEIGHT** | Grams (`g`), Kilograms (`kg`) | Grams (`GRAM`) | `1 kg = 1000 g` |
| **VOLUME** | Milliliters (`mL`), Liters (`L`) | Milliliters (`MILLILITER`) | `1 L = 1000 mL` |
| **COUNT** | Items (`item`) | Items (`ITEM`) | `1 item = 1 item` |

### Storage of Prices
Prices are stored as **Price per Base Unit** (i.e. Price per gram, Price per mL, Price per item).
*Example:*
- If a product costs **₹500 per kg**, the database stores **₹0.50 per gram** (`pricePerUnit = 0.50000000`).
- If a seller places a quotation for **250 g**, the cost is simply `250 * 0.5 = ₹125.00`.
- If a seller places a quotation for **2.5 kg**, the system converts it to `2500 g` and calculates `2500 * 0.5 = ₹1,250.00`.

This approach ensures arithmetic is simple, consistent, and executes without floating-point inaccuracies.

---

## 🔑 Demo Login Credentials

The login screen features buttons to **auto-fill** these credentials, but you can also type them manually:

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password123` | Create/Edit Products, View Conversion Stocks, Approve/Reject Orders |
| **Seller** | `seller@example.com` | `password123` | Browse Catalog, Search, Live Conversion Calculator, Request Quotations |

---

## 💻 Local Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (see `.env` for layout):
```env
DATABASE_URL="postgresql://neondb_owner:npg_Amh7NElLFWr4@ep-green-sun-aqt7ypp9.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
AUTH_SECRET="my-super-secret-auth-key"
AUTH_URL="http://localhost:3000"
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run Database Seeding (Optional)
If database is empty, seed the admin and seller accounts:
```bash
npm run seed
```

### 5. Run the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 🚀 Deployment on Vercel

The application is fully compatible with Vercel deployment:

1. **Push code to GitHub.**
2. **Log into Vercel Dashboard** and click **Add New Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** configuration, add:
   - `DATABASE_URL`
   - `AUTH_SECRET` (generate a secure random string)
   - `AUTH_URL` (optional on Vercel as it is automatically detected, but can be set to your deployment URL)
5. Click **Deploy**. Vercel will automatically run Next.js build scripts and host the site.
