# Didier's Choice - Butcher Management System

Full-stack butcher stock, sales, invoice and reporting system for Didier's Choice.

**Stack**
- Frontend: React 18 + Vite + Bootstrap 5 + React Router + Axios
- Backend: Node.js + Express.js
- Database: MySQL 8
- Auth: JWT + bcrypt (role-based: `admin`, `sales`)
- Reports: PDF (pdfkit) + Excel (exceljs)

## Butcher Features

- Meat categories such as beef, goat, chicken, pork, fish, processed meat, offal and bones
- Decimal stock quantities for weight-based sales such as `1.25 kg`
- Units: `kg`, `g`, `piece`, and `pack`
- Meat-specific product fields: animal type, cut type, storage type, storage location, batch number, slaughter date, expiry date, and barcode
- Stock in, waste/stock out, and adjustment movements
- Sales receipts with discounts, tax, amount paid, balance due, and customer credit support
- Dashboard alerts for low stock and meat expiring within 3 days
- Excel inventory report with batch, storage and expiry details

## 1. Database setup

```bash
mysql -u root -p < backend/sql/schema.sql
```

This creates the `dab_inventory` database, all tables, and butcher seed data.
No default login user is created. Open the app and create the first account;
that first account automatically becomes the administrator.

## 2. Backend

```bash
cd backend
cp .env.example .env       # edit DB creds + JWT_SECRET
npm install
npm run dev                # http://localhost:5000
```

## 3. Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

The frontend expects the API at `http://localhost:5000/api` (configurable in `frontend/.env`).

## Roles

| Role  | Capabilities |
|-------|--------------|
| admin | Users, categories, suppliers, meat stock, inventory movements, sales, reports |
| sales | Record sales, view meat stock, print receipts, view own sales history |
