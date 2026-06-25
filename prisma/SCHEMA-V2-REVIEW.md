# PersonalFi Schema v2 — Principal Architect Review

**Date:** 2026-06-18  
**Status:** `pnpm exec prisma validate` ✅ passes  
**Prisma generate:** ⚠️ `EPERM` on Windows query-engine DLL (file lock — stop dev server and re-run)

---

## Executive summary

The v2 Prisma schema correctly models the seven core MongoDB collections (Account, AccountGroup, Institution, Fund + embedded FundAllocation, Category + embedded MatchRule) and wires them into existing finance flows (FinanceTransaction, Event, Budget, RecurringTemplate, ATMWithdrawal, GiftTracking). Relations are valid for MongoDB (no implicit M2M). Legacy `PaymentSource`, `CategoryNode`, `SinkingFund`, and `BudgetLine` are removed — **~55 source files** still reference old names and will fail `tsc` until migrated.

**Monetary unit:** User spec originally said "INR paisa"; project rule and schema comments use **Float INR rupees** — consistent with existing `decimal.js` / service code. Do not store paisa.

---

## Field mapping (legacy → v2)

### PaymentSource → Account

| Legacy (`PaymentSource`) | v2 (`Account`) | Notes |
|---|---|---|
| `id` | `id` | |
| `userId` | `userId` | |
| — | `groupId` | **New** — required; net-worth bucket via AccountGroup |
| `bank` (string) | `institutionId` | **New** — FK to global Institution catalog |
| `name` | `name` | |
| — | `code` | **New** — auto `HDFC-SAV-01`, unique per user |
| `type` | `type` | Expanded `AccountType` enum (bank/CC/investment/loan/wallet taxonomy) |
| — | `subtype` | **New** — NRE, salary, SIP, etc. |
| `currentBalance` | `balance` | Renamed |
| — | `openingBalance` | **New** |
| — | `currency` | **New** — default INR; multi-currency ready |
| `balanceUpdatedAt` | `balanceAsOf` | Renamed |
| `accountNumberLast4` | `accountNumber` | UI still shows last 4 |
| — | `ifscCode`, `upiId` | **New** |
| `creditLimit` | `creditLimit` | |
| — | `billingCycle`, `interestRate`, `minimumPayment` | **New** CC fields |
| — | investment block | **New** — `investedAmount`, `currentValue`, `xirr`, `category80C`, etc. |
| — | loan block | **New** — `principalAmount`, `emi`, `remainingEmis` |
| — | `fundAllocations[]` | **New** — embedded FundAllocation |
| — | `linkedAccountIds[]` | **New** |
| `isActive` | `status` + `archivedAt` | `ACTIVE`/`INACTIVE`/`CLOSED`/`FROZEN` + soft-delete timestamp |
| `rewardPoints`, `pointValueINR` | — | **Gap** — model as `POINTS_WALLET` Account or add fields later |
| `expiryDate` | — | Move to gift-card Account subtype metadata if needed |
| — | `isPrimary`, `isExcludeNetWorth`, `isHidden` | **New** |
| `createdAt` | `createdAt`, `updatedAt`, `openedOn`, `archivedAt` | |

### CategoryNode → Category

| Legacy (`CategoryNode`) | v2 (`Category`) | Notes |
|---|---|---|
| `id` | `id` | |
| `userId` | `userId?` | Optional for system defaults |
| `label` | `name` | Renamed |
| — | `slug` | **New** — unique per user |
| `parentCategoryId` | `parentId` | Self-referential hierarchy |
| `depth` | `level` | 0=group, 1=category, 2=subcategory |
| `sectionId` | `path` | Replaced by materialized path `expense/food/groceries` |
| `type` | `type` | `CategoryFlowType` enum |
| `plannedAmount` | `monthlyBudget` | Default budget on node |
| `budgetType` | — | Lives on Transaction / RecurringTemplate `budgetType` |
| — | `budgetRollover` | **New** |
| — | `matchRules[]` | **New** — embedded MatchRule (replaces MerchantAlias over time) |
| — | `linkedFundId`, `linkedEventId` | **New** — cross-entity shortcuts |
| `sortOrder` | `order` | Renamed |
| `isActive` | `isActive` + `archivedAt` | Soft-delete |
| — | `isSystem` | **New** — seed templates |

### SinkingFund → Fund

| Legacy (`SinkingFund`) | v2 (`Fund`) | Notes |
|---|---|---|
| `id` | `id` | |
| `userId` | `userId` | |
| `name` | `name` | |
| `purpose` | `purpose` | `FundPurpose` enum |
| `targetAmount` | `targetAmount` | |
| `targetDate` | — | Use `milestones[]` or future Goal model |
| `currentBalance` | — | **NOT STORED** — compute from `sources` × Account balances |
| `monthlyContribution` | — | Derive from RecurringTemplate or FundAllocation |
| `priorityLevel` | `FundAllocation.priority` | Moved to allocation |
| `longTerm` | `purpose` / `targetMonths` | |
| `institution` | — | Use Account → Institution |
| `linkedAccount` | `sources[]` | FundAllocation embed |
| `category` | `categoryId` | Required FK (not in user Fund interface; kept from legacy) |
| `milestones` | `milestones[]` | Embedded type preserved |
| — | `goalId` | Future Goal collection |
| — | `archivedAt` | Soft-delete per global rule |

### FinanceTransaction (field changes)

| Legacy | v2 | Notes |
|---|---|---|
| `paymentSourceId` | `accountId` | Rename everywhere in code/API |
| `subcategoryId` | — | **Removed** — use leaf `categoryId` (level 2) |
| `categoryId` | `categoryId` | Leaf category preferred |
| `paymentSource` relation | `account` | |

### BudgetLine → Budget

| Legacy | v2 | Notes |
|---|---|---|
| `BudgetLine` model | `Budget` model | `plannedAmount` per category per period |
| section/kind/tag enums | — | Simplified; section via Category.path/level |

### New collections

- **AccountGroup** — user-owned asset/liability buckets for net worth (`type`, `slug`, `order`)
- **Institution** — global catalog (no `userId`); banks, AMCs, brokers, wallets

### Embedded types

- **FundAllocation** — on both `Account.fundAllocations` and `Fund.sources` (per user spec); service must keep in sync or treat `Fund.sources` as canonical
- **MatchRule** — on `Category.matchRules`; `MerchantAlias` retained for migration

---

## Architect decisions & schema additions

### Accepted from user spec (unchanged)

- Soft-delete via `archivedAt` on Account, Category, Fund
- `Fund.currentAmount` computed only (not in schema)
- Institution global (no userId)
- Category `userId` optional for system defaults
- Bidirectional FundAllocation embed (Account + Fund)
- Named relations for MongoDB: `FundPrimaryCategory`, `CategoryLinkedFund`, `CategoryLinkedEvent`, `EventLinkedFund`

### Intentional deviations

| Item | Decision |
|---|---|
| INR paisa in spec | **Float rupees** at rest — matches codebase |
| `institutionId` optional on Account | Cash/custom accounts may lack institution |
| `categoryId` required on Fund | Preserves SinkingFund→Category link for budget attribution |
| `linkedFundId` / `linkedEventId` on Category | Reverse nav + budget shortcuts (not in Category interface) |
| `updatedAt` on AccountGroup, Institution | Standard audit |
| `FinanceTransaction.currency` | Per-tx currency for future FX |

### Additions made in this review

| Change | Why |
|---|---|
| `@@index([userId, archivedAt])` on Account, Category, Fund | Fast "active only" list queries |
| `@@unique([userId, slug])` on Category | Prevent duplicate slugs per user |
| `@@index([isSystem])` on Category | Seed / template lookups |
| `MerchantAlias` → `Category` FK relation | Referential integrity |
| `BudgetOverride` → `Category` FK + index | Integrity + join performance |
| `@@index([key])`, `@@index([userId])` on FeatureFlag | Flag resolution queries |

### Documented gaps / follow-ups (not in schema yet)

| Gap | Recommendation |
|---|---|
| `rewardPoints` / `pointValueINR` from PaymentSource | `POINTS_WALLET` Account or extension fields |
| Optimistic locking (`version`) | Add when concurrent balance updates matter |
| `createdBy` / `updatedBy` audit | Add if multi-user household accounts ship |
| `Goal` model for `Fund.goalId` | Phase 2 |
| System category slug uniqueness (`userId: null`) | Enforce in seed service (Prisma unique allows duplicate nulls) |
| FundAllocation dual-write consistency | Service rule: `Fund.sources` canonical; sync Account view on write |
| Data migration script | One-time ETL: PaymentSource→Account+Group, CategoryNode→Category, SinkingFund→Fund |
| API versioning | `/api/v1/payment-sources` → `/api/v1/accounts` (alias period) |
| `budget` module uses removed `BudgetLine` | Migrate to `Budget` model |

---

## Relation diagram

```mermaid
erDiagram
  User ||--o{ AccountGroup : owns
  User ||--o{ Account : owns
  User ||--o{ Category : owns
  User ||--o{ Fund : owns
  User ||--o{ FinanceTransaction : owns
  User ||--o{ Event : owns
  User ||--o{ Budget : owns

  Institution ||--o{ Account : catalogs
  AccountGroup ||--o{ Account : groups

  Account ||--o{ FinanceTransaction : "accountId"
  Account ||--o{ FinanceTransaction : "toAccountId"
  Account ||--o{ ATMWithdrawal : source_buffer_wallet

  Category ||--o{ Category : parent
  Category ||--o{ FinanceTransaction : categoryId
  Category ||--o{ Budget : categoryId
  Category ||--o{ Event : categoryId
  Category ||--o{ Fund : "FundPrimaryCategory"
  Category ||--o| Fund : "CategoryLinkedFund"
  Category ||--o| Event : "CategoryLinkedEvent"

  Fund ||--o{ Category : linkedCategories
  Fund ||--o{ Event : linkedEvents

  Event ||--o{ FinanceTransaction : eventId

  FinanceTransaction }o--o| MerchantAlias : merchantId
  FinanceTransaction ||--o| GiftTracking : 1-1
  FinanceTransaction ||--o| ATMWithdrawal : 1-1
  FinanceTransaction ||--o{ Attachment : attachments

  Account {
    ObjectId id
    Float balance
    FundAllocation[] fundAllocations
  }

  Fund {
    ObjectId id
    Float targetAmount
    FundAllocation[] sources
  }

  Category {
    ObjectId id
    int level
    string path
    MatchRule[] matchRules
  }
```

### Data-flow cross-check

| Flow | Path | Status |
|---|---|---|
| Transaction posting | `FinanceTransaction.accountId` → `Account` | ✅ `paymentSourceId` renamed in schema; code pending |
| Transfer | `accountId` + `toAccountId` → two Accounts | ✅ |
| Fund balance | `Fund.sources[]` × `Account.balance` → computed `currentAmount` | ✅ not stored |
| Virtual buckets | `Account.fundAllocations[]` mirrors splits | ⚠️ dual embed — sync in service |
| Category pick | 3-level tree via `parentId`, `level`, `path` | ✅ replaces sectionId/depth |
| Budget spent | Sum txs by `categoryId` + period; `Budget.plannedAmount` | ✅ spent computed |
| Event actual | Sum linked `transactionIds` | ✅ `estimatedAmount` stored; actual computed |
| Category ↔ Fund | `Category.linkedFundId` ↔ `Fund.linkedCategories` | ✅ named relation |
| Category ↔ Event | `Category.linkedEventId` ↔ `Event.linkedByCategories` | ✅ named relation |
| Event ↔ Fund | `Event.linkedFundId` ↔ `Fund.linkedEvents` | ✅ |
| Net worth | `AccountGroup.type` × sum `Account.balance` where `!isExcludeNetWorth` | ✅ new model |
| ATM withdrawal | 3 Account FKs (source, buffer, wallet) | ✅ |
| Auto-categorise | `Category.matchRules` (+ legacy `MerchantAlias`) | ✅ |
| Soft delete | `archivedAt IS NULL` filter on Account/Category/Fund | ✅ indexed |

---

## Migration checklist (code)

### Phase 1 — Repositories & Prisma calls

- [ ] `src/modules/payment-sources/*` → new `src/modules/accounts/*` (or alias)
- [ ] `prisma.paymentSource` → `prisma.account` (+ join `group`, `institution`)
- [ ] `paymentSourceId` → `accountId` in transactions, recurring-templates, filters
- [ ] `prisma.categoryNode` → `prisma.category`; `label`→`name`, `depth`→`level`, `parentCategoryId`→`parentId`
- [ ] `prisma.sinkingFund` → `prisma.fund`; remove `updateBalance` on fund (computed)
- [ ] `prisma.budgetLine` → `prisma.budget`
- [ ] `src/lib/data/transaction-options.ts` — all three loaders
- [ ] `src/modules/budget-engine/budget-engine.repository.ts`
- [ ] `src/modules/budget/budget.repository.ts`
- [ ] TX includes: remove `subcategory`, `paymentSource`; add `account`

### Phase 2 — API & contracts

- [ ] `/api/v1/payment-sources` → `/api/v1/accounts` (deprecation header on old route)
- [ ] `/api/v1/sinking-funds` → `/api/v1/funds`
- [ ] OpenAPI + Zod schemas for Account, AccountGroup, Institution, Fund, Category
- [ ] `CreateTransactionSchema.paymentSourceId` → `accountId`

### Phase 3 — UI & state

- [ ] `src/types/finance.ts` — `PaymentSourceOption` → `AccountOption`
- [ ] `queryKeys.paymentSources` → `queryKeys.accounts`
- [ ] Transaction forms & filter bar (`TransactionFilterBar`, `useTransactionFilters`)
- [ ] `NestedCategoryPicker.CategoryNode` — rename UI type (not Prisma model)
- [ ] Sinking funds dashboard → funds dashboard

### Phase 4 — Data & seed

- [ ] Migration script (Mongo aggregation or Node ETL)
- [ ] Default AccountGroups per user (Cash, Bank, Investments, Credit, Loans)
- [ ] Institution seed catalog (HDFC, SBI, ICICI, …)
- [ ] System Category templates (`userId: null`, `isSystem: true`)

### Phase 5 — Cleanup

- [ ] Remove `payment-sources` and `sinking-funds` modules after alias period
- [ ] Deprecate `MerchantAlias` once matchRules cover flows

---

## Files/modules affected (grep)

**Direct Prisma legacy usage (must change):**

| File | Legacy refs |
|---|---|
| `src/lib/data/transaction-options.ts` | paymentSource, categoryNode, sinkingFund |
| `src/modules/payment-sources/payment-sources.repository.ts` | PaymentSource model |
| `src/modules/sinking-funds/sinking-funds.repository.ts` | sinkingFund model |
| `src/modules/categories/categories.repository.ts` | CategoryNode model |
| `src/modules/budget-engine/budget-engine.repository.ts` | categoryNode |
| `src/modules/budget/budget.repository.ts` | budgetLine |
| `src/modules/transactions/transactions.repository.ts` | paymentSourceId, subcategory, label |
| `src/modules/transactions/transactions.service.ts` | paymentSource connect |
| `src/modules/recurring-templates/recurring-templates.service.ts` | paymentSource |

**API routes:** `app/api/v1/payment-sources`, `app/api/v1/sinking-funds`

**UI/hooks (~30 files):** transaction forms, filter bar, dialog loaders, `types/finance.ts`, `queryKeys.ts`, `useTransactionFilters.ts`

**Tests (mocked — pass today, need rewrite):** `payment-sources.service.test.ts`, `sinking-funds.service.test.ts`

**Unrelated type errors:** `.next/types` route context, layout `RouteImpl` — pre-existing

---

## Test results

| Suite | Result |
|---|---|
| `prisma validate` | ✅ Pass |
| `prisma generate` | ⚠️ EPERM (Windows DLL lock) |
| Unit tests (schema-independent) | ✅ 22/22 pass |
| Service tests (mocked repos) | ✅ 27/27 pass |
| `pnpm typecheck` | ❌ ~40 errors — all legacy Prisma model/field names |

**Typecheck failure is expected** until repository migration. No runtime DB tests run (schema not pushed).

---

## Re-validation 2026-06-10

**Automated:** `prisma/schema-v2.validation.test.ts` (120 assertions) — ✅ all pass  
**Prisma validate:** ✅ pass  
**Prisma generate:** ⚠️ EPERM on Windows `query_engine-windows.dll.node` (file lock — stop dev server and re-run)  
**Focused unit tests:** ✅ 25/25 pass (payment-sources, sinking-funds, transactions.service, useTransactionFilters)

**Schema edits this pass:** none — spec-compliant as-is.

### Pass/fail matrix (field-by-field)

Legend: ✅ present & correct · ➕ intentional extension · ⏭ computed/not stored · — N/A

#### Account

| Field | Status | Notes |
|---|---|---|
| `_id` | ✅ | `id` + `@map("_id")` |
| `userId` ⚡ | ✅ | required, `@@index([userId])` |
| `groupId` ⚡ | ✅ | required FK |
| `institutionId` | ✅ | optional |
| `name` ★ | ✅ | required |
| `code` ⚡ | ✅ | `@@unique([userId, code])` |
| `type` ★ | ✅ | `AccountType` enum |
| `subtype` | ✅ | optional String |
| `balance` ★ | ✅ | Float INR rupees |
| `openingBalance` ★ | ✅ | Float INR rupees |
| `currency` | ✅ | default INR |
| `balanceAsOf` | ✅ | |
| `accountNumber` | ✅ | |
| `ifscCode` | ✅ | |
| `upiId` | ✅ | |
| `creditLimit` | ✅ | |
| `billingCycle{startDay,dueDay}` | ✅ | `BillingCycle` type |
| `interestRate` | ✅ | |
| `minimumPayment` | ✅ | |
| `investedAmount` | ✅ | |
| `currentValue` | ✅ | |
| `absoluteReturn` | ✅ | |
| `xirr` | ✅ | |
| `maturityDate` | ✅ | |
| `lockInMonths` | ✅ | |
| `expectedReturn` | ✅ | |
| `category80C` | ✅ | |
| `principalAmount` | ✅ | |
| `emi` | ✅ | |
| `remainingEmis` | ✅ | |
| `interestPaidTotal` | ✅ | |
| `fundAllocations[]` | ✅ | `FundAllocation[]` embed |
| `linkedAccountIds[]` | ✅ | `String[] @db.ObjectId` |
| `status` | ✅ | `AccountStatus` enum |
| `isPrimary` | ✅ | |
| `isExcludeNetWorth` | ✅ | |
| `isHidden` | ✅ | |
| `color` | ✅ | |
| `icon` | ✅ | |
| `note` | ✅ | |
| `tags[]` | ✅ | |
| `openedOn` | ✅ | |
| `archivedAt` | ✅ | soft-delete |
| `createdAt` | ✅ | |
| `updatedAt` | ➕ | extension |

#### AccountGroup

| Field | Status | Notes |
|---|---|---|
| `_id` | ✅ | |
| `userId` ⚡ | ✅ | `@@index([userId])` |
| `name` | ✅ | |
| `type` asset\|liability | ✅ | `AccountGroupType` ASSET \| LIABILITY |
| `slug` | ✅ | `@@unique([userId, slug])` |
| `order` | ✅ | |
| `icon` | ✅ | |
| `color` | ✅ | |
| `isDefault` | ✅ | |
| `isCollapsed` | ✅ | |
| `createdAt` | ✅ | |
| `updatedAt` | ➕ | extension |

#### Institution

| Field | Status | Notes |
|---|---|---|
| `_id` | ✅ | |
| `name` | ✅ | |
| `shortName` | ✅ | `@@unique([shortName])` |
| `type` | ✅ | `InstitutionType` enum |
| `logoUrl` | ✅ | |
| `color` | ✅ | |
| `ifscPattern` | ✅ | |
| `isActive` | ✅ | |
| `isVerified` | ✅ | |
| `createdAt` | ➕ | extension |
| `updatedAt` | ➕ | extension |

#### Fund

| Field | Status | Notes |
|---|---|---|
| `_id` | ✅ | |
| `userId` ⚡ | ✅ | `@@index([userId])` |
| `name` | ✅ | |
| `purpose` | ✅ | `FundPurpose` enum |
| `targetAmount` | ✅ | |
| `targetMonths` | ✅ | |
| `currentAmount` | ⏭ | computed — not stored |
| `sources[]` | ✅ | `FundAllocation[]` embed |
| `goalId` | ✅ | optional |
| `color` | ✅ | |
| `icon` | ✅ | |
| `order` | ✅ | |
| `createdAt` | ✅ | |
| `categoryId` | ➕ | required FK (legacy SinkingFund link) |
| `archivedAt` | ➕ | soft-delete |
| `updatedAt` | ➕ | extension |
| `milestones[]` | ➕ | extension (legacy preserved) |

#### FundAllocation (embedded)

| Field | Status | Notes |
|---|---|---|
| `fundId` | ✅ | `@db.ObjectId` |
| `accountId` | ✅ | `@db.ObjectId` |
| `type` percentage\|fixed | ✅ | `PERCENTAGE` \| `FIXED` |
| `value` | ✅ | |
| `priority` | ✅ | default 0 |

#### Category

| Field | Status | Notes |
|---|---|---|
| `_id` | ✅ | |
| `userId` (null=system) | ✅ | optional `String?` |
| `name` | ✅ | |
| `slug` | ✅ | `@@unique([userId, slug])` |
| `parentId` | ✅ | self-ref |
| `level` 0\|1\|2 | ✅ | Int |
| `path` ⚡ | ✅ | `@@index([userId, path])` |
| `type` | ✅ | `CategoryFlowType` |
| `monthlyBudget` | ✅ | |
| `budgetRollover` | ✅ | |
| `matchRules[]` | ✅ | `MatchRule[]` embed |
| `color` | ✅ | |
| `icon` | ✅ | |
| `order` | ✅ | |
| `isSystem` | ✅ | |
| `isActive` | ✅ | |
| `createdAt` | ✅ | |
| `linkedFundId` | ➕ | extension |
| `linkedEventId` | ➕ | extension |
| `archivedAt` | ➕ | soft-delete |
| `updatedAt` | ➕ | extension |

#### MatchRule (embedded)

| Field | Status | Notes |
|---|---|---|
| `field` | ✅ | `MatchRuleField` enum |
| `operator` | ✅ | `MatchRuleOperator` enum |
| `value` | ✅ | Json |
| `priority` | ✅ | default 0 |

#### Required indexes (⚡)

| Index | Status |
|---|---|
| `Account.userId` | ✅ `@@index([userId])` |
| `Account.userId + code` unique | ✅ `@@unique([userId, code])` |
| `Fund.userId` | ✅ `@@index([userId])` |
| `AccountGroup.userId` | ✅ `@@index([userId])` |
| `Category.userId + path` | ✅ `@@index([userId, path])` |

#### Enums

| Enum | Spec values | Status |
|---|---|---|
| `AccountGroupType` | asset, liability | ✅ ASSET, LIABILITY |
| `FundAllocationType` | percentage, fixed | ✅ PERCENTAGE, FIXED |
| `CategoryFlowType` | income, expense, investment, transfer | ✅ all four |

#### Legacy model guard

| Model | Status |
|---|---|
| `PaymentSource` | ✅ absent |
| `CategoryNode` | ✅ absent |
| `SinkingFund` | ✅ absent |

### Known gaps (unchanged)

| Gap | Status |
|---|---|
| INR paisa in user spec | ➕ Float rupees (project convention) |
| `rewardPoints` / `pointValueINR` | ❌ not in v2 — use `POINTS_WALLET` Account |
| `Fund.currentAmount` | ⏭ service-computed |
| `prisma generate` EPERM | ⚠️ Windows DLL lock |
| Code migration (~55 files) | ❌ pending — typecheck still fails |

---

## Validation checklist

- [x] Seven core collections present
- [x] No duplicate Prisma models for same concept
- [x] MongoDB-compatible relations (explicit FKs, no implicit M2M)
- [x] Soft-delete on financial records
- [x] Computed amounts not stored (Fund balance, budget spent)
- [x] Institution global
- [x] Category hierarchy 3-level with path index
- [x] Transaction → Account wiring
- [x] Event/Fund/Category link relations named and valid
- [ ] `prisma generate` — retry after stopping dev server
- [ ] `prisma db push` — staging only, after migration script
- [ ] Code migration — see checklist above
