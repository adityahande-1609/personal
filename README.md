# Rentwise — Rental Management Platform

A full-stack rental marketplace and management platform connecting tenants, owners and administrators.

## Current status

Phase 1 foundation is implemented on `feat/rental-platform-phase1`:
- React + TypeScript + Vite frontend
- Responsive marketplace homepage
- Property search page with URL-driven filters
- Property detail page
- Login/register UI
- Express API shell with Helmet, CORS and rate limiting
- PostgreSQL/Prisma relational schema foundation
- Environment template

The marketplace fixtures currently exist only as development data. They are not the production data source. The next phases replace them with Prisma-backed API queries.

## Stack

React, TypeScript, Vite, React Router, Node.js, Express, PostgreSQL and Prisma.

## Local setup

Requirements: Node.js 20+ and PostgreSQL 15+.

```bash
npm install
cp .env.example .env
cd backend && npx prisma generate && cd ..
npm run dev
```

Frontend: http://localhost:5173  
API health: http://localhost:4000/api/health

## Architecture

`frontend → REST API → Express services → Prisma → PostgreSQL`

Sensitive documents will use private storage keys/references rather than public blobs, with authorization enforced by the API.

## Roles

- TENANT — discovery, favourites, enquiries, visits and agreements
- OWNER — listings, enquiries, visits and agreements
- ADMIN — moderation, users, reports and platform operations

## Roadmap

1. UI foundation
2. Frontend functionality
3. Backend/database integration
4. Authentication and RBAC
5. Property management and uploads
6. Enquiries, visits and notifications
7. Rental agreement workflow and PDF generation
8. Admin, verification, reporting, audit and security hardening

Generated agreement documents will never be represented as automatically legally executed or registered documents.
