# Categories CRUD — Principal Architect Review

**Date:** 2026-06-18  
**Status:** Full CRUD operational on v2 `Category` model

---

## CRUD matrix

| Operation | Route | Method | Status |
|-----------|-------|--------|--------|
| **Create** | `/api/v1/categories` | POST | ✅ |
| **Read (tree)** | `/api/v1/categories` | GET | ✅ Full tree + `monthlySpend` rollup |
| **Read (one)** | `/api/v1/categories/:id` | GET | ✅ Subtree rooted at node |
| **Update** | `/api/v1/categories/:id` | PUT | ✅ Name/icon/color/budget/matchRules; path recalc |
| **Reorder/Reparent** | `/api/v1/categories/reorder` | PATCH | ✅ Batch `[{ id, parentId, order }]` |
| **Delete** | `/api/v1/categories/:id` | DELETE | ✅ Soft-archive (`archivedAt`); 409 if txs linked |
| **Stats** | `/api/v1/categories/:id/stats` | GET | ✅ Trend, variance, top transactions |

All routes: JWT auth, `{ ok, data, meta, error }` envelope, `?includeArchived=true` for archived nodes.

---

## Schema changes (this review)

| Change | Rationale |
|--------|-----------|
| `@@unique([userId, path])` | Materialized path must be unique per owner; prevents duplicate hierarchy keys |
| `@@index([isSystem, slug])` | Fast lookup of system template categories (`userId: null`) |

Existing fields validated against spec:

- 3-level hierarchy: `level` 0/1/2, `parentId`, `path` ⚡
- `matchRules[]` embedded `MatchRule`
- `monthlyBudget`, `budgetRollover`
- `archivedAt` soft-delete (never hard-delete when txs exist)
- `userId?` for system defaults + `isSystem` flag

---

## Architect decisions

1. **Soft-delete only** — DELETE sets `archivedAt` + `isActive: false` on subtree; no hard delete. Aligns with global financial-record policy.

2. **System categories read-only** — Users can read system templates and create children under them; mutate/delete returns 403.

3. **Path/slug cascade** — Renaming a node regenerates slug and recalculates `path` for entire subtree. Reorder/reparent updates `level`, `type`, `path`.

4. **Delete guard** — 409 `CATEGORY_HAS_TRANSACTIONS` if any node in subtree has linked `FinanceTransaction`. User must reassign txs first (future `PATCH /categories/:id/reassign`).

5. **`@@unique([userId, slug])` + null userId** — System catalog rows use `userId: null`; slug uniqueness enforced among system rows via application + `isSystem, slug` index. Consider seed script with globally unique system slugs.

6. **Computed spend** — `monthlySpend` not stored; aggregated from `FinanceTransaction` for current budget period. Parent nodes roll up child spend in API response.

---

## Gaps / follow-ups

- **Reassign endpoint** — `PATCH /categories/:id/reassign` `{ toCategoryId }` for bulk tx migration before delete
- **Seed script** — System category templates (`isSystem: true`, `userId: null`) for expense/income/investment trees
- **Legacy `CategoryNode`** — `categories.repository` migrated; update `transaction-options.ts`, `budget-engine`, `NestedCategoryPicker` to v2 API
- **`prisma generate`** — Run after schema index changes (Windows DLL lock if dev server running)

---

## Test coverage

```
src/modules/categories/lib/category-tree.test.ts   — 4 tests
src/modules/categories/categories.service.test.ts — 7 tests
```

Run: `pnpm test -- src/modules/categories`
