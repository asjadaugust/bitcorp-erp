# Design: ESLint Plugin `eslint-plugin-bitcorp` — Spanish Naming Convention Rules

**Date:** 2026-02-24
**Status:** Approved — proceeding to implementation

---

## Problem

CLAUDE.md mandates two naming conventions that are currently only documented, not enforced:

| File type                    | Convention          | Example        |
| ---------------------------- | ------------------- | -------------- |
| `*.dto.ts`                   | Spanish, snake_case | `fecha_inicio` |
| `*.model.ts` / `*.entity.ts` | Spanish, camelCase  | `fechaInicio`  |

Without automated enforcement, developers routinely mix camelCase into DTOs and English words into both layers, causing API contract drift and inconsistency.

---

## Approach: Local ESLint Plugin (Approach B)

A self-contained local plugin at `backend/eslint-rules/` with two rules and one word-corpus generator. No external npm dependencies.

---

## Directory Layout

```
backend/eslint-rules/
├── package.json                          # name: "eslint-plugin-bitcorp"
├── index.js                              # Plugin entry — exports { rules }
├── rules/
│   ├── dto-spanish-snake-case.js         # Rule 1: *.dto.ts files
│   └── entity-spanish-camel-case.js      # Rule 2: *.model.ts / *.entity.ts files
├── scripts/
│   └── generate-word-list.js             # Extracts corpus from ORM model files
└── data/
    └── domain-words.json                 # Generated — all valid word segments
```

---

## Rule 1: `bitcorp/dto-spanish-snake-case`

**Applies to:** Files matching `*.dto.ts`
**AST nodes:** `PropertyDefinition`, `TSPropertySignature`

### Two-phase validation

| Phase | Check                                                       | Auto-fixable                          | Error message                                                                              |
| ----- | ----------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1     | Regex `/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/` — strict snake_case | Yes — converts camelCase → snake_case | `'DTO property names must be in snake_case'`                                               |
| 2     | Every `_`-split segment ∈ `domainWords` ∪ `allowlist`       | No — can't auto-translate             | `'DTO properties must use valid Spanish words in snake_case. Non-domain segments: [x, y]'` |

Phase 1 runs first; if it fails the property is skipped for Phase 2 (fixing casing is the prerequisite for checking words).

### Configuration

```json
"bitcorp/dto-spanish-snake-case": ["error", {
  "allowlist": ["email", "token"]
}]
```

---

## Rule 2: `bitcorp/entity-spanish-camel-case`

**Applies to:** Files matching `*.model.ts`, `*.entity.ts`
**AST nodes:** `PropertyDefinition`, `TSPropertySignature`

### Two-phase validation

| Phase | Check                                                                  | Auto-fixable                          | Error message                                                                                |
| ----- | ---------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1     | Regex `/^[a-z][a-z]*([A-Z][a-z0-9]+)*$/` — strict camelCase            | Yes — converts snake_case → camelCase | `'Entity property names must be in camelCase'`                                               |
| 2     | Every segment (split on capital letters) ∈ `domainWords` ∪ `allowlist` | No                                    | `'Entity properties must use valid Spanish words in camelCase. Non-domain segments: [x, y]'` |

---

## Word Corpus: `data/domain-words.json`

**Source:** All `name:` values in `@Column()`, `@JoinColumn()`, `@CreateDateColumn()`, `@UpdateDateColumn()` decorators across every file in `backend/src/models/` and `backend/src/entities/`.

**Generation script:** `eslint-rules/scripts/generate-word-list.js`

- Scans model/entity files with a regex on decorator `name:` values
- Splits each column name by `_`
- Deduplicates and sorts
- Writes `data/domain-words.json`

**When to regenerate:** After adding new columns to any model. Add to `package.json`:

```json
"generate:eslint-words": "node eslint-rules/scripts/generate-word-list.js"
```

The generated file is committed to source control so linting works without running the generator.

---

## Auto-fix Behaviour

```ts
// Input — camelCase violation (Phase 1, auto-fixable):
fechaInicio: string;
// → Fixed to:
fecha_inicio: string;

// Input — snake_case but non-domain word (Phase 2, NOT auto-fixable):
start_date: string;
// → Error: 'Non-domain segments: start, date' — developer renames manually

// Input — valid, passes both phases:
fecha_inicio: string; // ✅
```

---

## ESLint Integration

### `backend/.eslintrc.json` (updated)

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  "plugins": ["@typescript-eslint", "bitcorp"],
  "env": { "node": true, "es2022": true },
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "bitcorp/dto-spanish-snake-case": ["error", { "allowlist": [] }],
    "bitcorp/entity-spanish-camel-case": ["warn", { "allowlist": [] }]
  }
}
```

### `backend/package.json` (add to devDependencies and scripts)

```json
{
  "devDependencies": {
    "eslint-plugin-bitcorp": "file:./eslint-rules"
  },
  "scripts": {
    "generate:eslint-words": "node eslint-rules/scripts/generate-word-list.js"
  }
}
```

---

## Passing and Failing Examples

### Passing (DTO)

```ts
// equipment.dto.ts
export interface EquipmentDetailDto {
  id: number;
  codigo_equipo: string;
  fecha_fabricacion: string;
  estado: string;
  tipo_proveedor: string;
}
```

### Failing (DTO) — camelCase → auto-fix available

```ts
// equipment.dto.ts
export interface EquipmentDetailDto {
  fechaFabricacion: string; // ❌ must be fecha_fabricacion (auto-fix)
}
```

### Failing (DTO) — English words → no auto-fix

```ts
// equipment.dto.ts
export interface EquipmentDetailDto {
  start_date: string; // ❌ 'start', 'date' not in domain corpus
}
```

### Passing (Entity)

```ts
// equipment.model.ts
@Column({ name: 'fecha_fabricacion' })
fechaFabricacion: Date;
```

### Failing (Entity) — snake_case → auto-fix available

```ts
// equipment.model.ts
fecha_fabricacion: Date; // ❌ must be fechaFabricacion (auto-fix)
```

---

## Performance Considerations

- `domain-words.json` is loaded once per lint run and stored in a `Set` (`O(1)` lookup)
- File name check (`endsWith`) short-circuits the rule before any AST traversal
- Generation script runs in < 1s on the current model corpus
