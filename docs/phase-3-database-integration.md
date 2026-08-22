# Phase 3 — Database Integration

## Scope

Phase 3 connects the existing React marketplace to the Express/Prisma backend and prepares the project for PostgreSQL-backed runtime data.

## Runtime architecture

```text
React frontend
      |
      v
REST API (/api)
      |
      v
Express
      |
      v
Prisma Client
      |
      v
PostgreSQL
```

## Local PostgreSQL status

PostgreSQL is intentionally not required for the initial Phase 3 code/integration work. A live PostgreSQL instance is required before database migrations, seed execution, and end-to-end persistence can be verified locally.

## Verification checklist

- [x] Dedicated Prisma database module exists.
- [x] Property API supports validated search/filter parameters.
- [x] Frontend property requests use the API service layer.
- [ ] Local PostgreSQL connection verified.
- [ ] Prisma migrations applied against PostgreSQL.
- [ ] Development seed applied against PostgreSQL.
- [ ] End-to-end property CRUD verified against PostgreSQL.
- [ ] Frontend favourites verified against persisted data.

## Important rule

Do not mark Phase 3 complete until the unchecked database-runtime items have been executed successfully. The absence of a local PostgreSQL installation must never be represented as a successful database test.
