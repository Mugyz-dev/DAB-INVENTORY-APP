# DAB Enterprise Ltd — Inventory & Sales Management System

Full-stack assessment project (RQF Level 5).

**Stack**
- Frontend: React 18 + Vite + Bootstrap 5 + React Router + Axios
- Backend: Node.js + Express.js
- Database: MySQL 8
- Auth: JWT + bcrypt (role-based: `admin`, `sales`)
- Reports: PDF (pdfkit) + Excel (exceljs)

## Project structure

```
dab/
├── backend/        Node + Express REST API
│   ├── src/
│   └── sql/schema.sql
├── frontend/       React (Vite) SPA
└── docs/           SRS + System Design
```

## 1. Database setup

```bash
mysql -u root -p < backend/sql/schema.sql
```

This creates the `dab_inventory` database, all tables, and seeds a default admin:
- email: `admin@dab.local`
- password: `Admin@123`

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
| admin | Users, categories, suppliers, products, inventory, sales, reports |
| sales | Record sales, view products, print invoices, view own sales history |

## Modules
Categories · Suppliers · Products · Inventory (stock in/out) · Sales (with invoice) · Dashboard · Reports (PDF/Excel)

## Deliverables
- `docs/SRS.md` — Software Requirement Specification
- `docs/SystemDesign.md` — Use Case, Activity, Sequence, Class, ERD (Mermaid)
- Source code (this repository)
