# 🏎️ MerchStore-1

A premium e-commerce platform specializing in merchandise and vehicle parts. The application is built using a modern full-stack architecture with a Next.js frontend, an Express/TypeScript backend, and a relational database managed via Prisma ORM.

---

## 🌟 Key Features

- **Dual Catalog**: Supports both merchandise and automotive/vehicle parts (`part` and `merch` types).
- **Vehicle Compatibility Engine**: Link parts to specific vehicle makes, models, years, body types, and engine variants.
- **Relational Schema**: Managed via Prisma with models for Categories (self-referencing parent/child hierarchy), Brands, Products, Attributes, Cart, Orders, Payments, Shipments, Reviews, and Wishlists.
- **Modern User Experience**: A polished responsive frontend powered by React 19, Next.js 16, Tailwind CSS, Lucide icons, and modern animations.
- **Payment & Tracking**: Out-of-the-box support for billing and shipment workflows.

---

## 📁 Repository Structure

```text
MerchStore-1/
├── backend/                  # Express REST API (TypeScript)
│   ├── prisma/               # Database schema and migrations
│   │   └── schema.prisma     # Prisma database schema definition
│   ├── src/
│   │   ├── config/           # Database and application configs
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Express middlewares (auth, validation, etc.)
│   │   ├── routes/           # API routes (e.g. products)
│   │   ├── services/         # Business logic layer
│   │   └── server.ts         # Server entry point
│   ├── tsconfig.json         # TypeScript configuration
│   └── package.json          # Backend dependencies and scripts
│
├── frontend/                 # Next.js App Router Application
│   ├── src/
│   │   ├── app/              # App router pages (Home, Products, Admin, About, Contact)
│   │   ├── components/       # Reusable React components (Navbar, Hero, Showcase, etc.)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Client utilities and state configs
│   │   └── utils/            # Helper functions
│   ├── tailwind.config.ts    # Tailwind CSS configuration
│   ├── tsconfig.json         # TypeScript configuration
│   └── package.json          # Frontend dependencies and scripts
│
└── README.md                 # Project documentation
```

---

## 🛠️ Setup & Installation

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **PostgreSQL** database instance running locally or hosted

---

### 1. Database & Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables. Create a `.env` file inside `backend/` and provide your database URL and server port:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://<username>:<password>@localhost:5432/merchstore?schema=public"
   ```

4. Run Prisma database migrations to apply the schema:
   ```bash
   npx prisma migrate dev --name init
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run on [http://localhost:5000](http://localhost:5000).

---

### 2. Frontend Setup

1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables. Create a `.env.local` file inside `frontend/` and add backend api url:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to view the web application.

---

## 🛢️ Database Schema Overview

The backend uses **Prisma** with a PostgreSQL driver. Core models defined in the [schema.prisma](file:///c:/Users/ADMIN/Documents/GitHub/MerchStore-1/backend/prisma/schema.prisma) file include:
- **User / Address**: Account details, roles (`customer`/`admin`), and billing/shipping addresses.
- **Product**: Main catalog entry supporting SKUs, prices, stock levels, type definitions, and relations.
- **ProductImage**: Rich multi-image support with display orders and primary tags.
- **ProductAttribute**: Dynamic key-value pairs for technical specifications.
- **Category / Brand**: Self-referencing parent/child category tree and manufacturer details.
- **Vehicle / ProductVehicle**: Mapping parts to specific make, model, year range, body style, and engine for compatibility checking.
- **Cart / CartItem**: Shopping cart management.
- **Order / OrderItem**: Order tracking, snapshots of prices, and statuses.
- **Payment / Shipment**: Integration tracks for transactions (gateway, status) and logistics (carrier, tracking number).
- **Review / Wishlist / Coupon**: Engagement features for coupon codes, user ratings, and saved items.
