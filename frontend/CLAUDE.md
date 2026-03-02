# Frontend CLAUDE.md

This file extends the root `CLAUDE.md` with Angular/frontend-specific guidance.
It is auto-loaded by Claude Code when editing files in the `frontend/` directory.

---

## Frontend Architecture

```
frontend/src/app/
├── core/
│   ├── design-system/   # Aero Design System wrappers
│   ├── guards/          # Route guards
│   ├── interceptors/    # HTTP interceptors (auth, error)
│   ├── services/        # Singleton services (auth, etc.)
│   └── models/          # TypeScript interfaces
├── shared/
│   └── components/      # Reusable components (PageCard, AeroCard, FilterBar, etc.)
└── features/            # Feature modules (equipment, operators, projects, …)
```

**Key shared components**:

- `app-page-card` — standard card container with `title`, `subtitle`, `[header-actions]`, `[footer]` slots; use `[noPadding]="true"` for tables
- `aero-card`, `aero-table`, `filter-bar`, `stats-grid`, `actions-container`, `export-dropdown`

**Angular patterns**:

- Standalone components (no NgModule)
- Signals and OnPush change detection where feasible
- Lazy-loaded feature routes

---

## HTTP Interceptor — Critical Rule

`apiResponseInterceptor` in `frontend/src/main.ts` **automatically unwraps** `{ success: true, data: X }` → `X`.

**Frontend services MUST use `this.http.get<T>(url)` directly — NEVER `.pipe(map(res => res.data))`.**

```typescript
// ✅ Correct — interceptor unwraps automatically
getEquipment(): Observable<Equipment[]> {
  return this.http.get<Equipment[]>('/api/equipment');
}

// ❌ Wrong — double-unwrap breaks response
getEquipment(): Observable<Equipment[]> {
  return this.http.get<any>('/api/equipment').pipe(map(res => res.data));
}
```

**Exceptions** (interceptor does NOT unwrap these):

- Paginated responses (have `pagination` field) — service handles manually
- Auth endpoints (`/auth/login`, `/auth/me`) — skipped by interceptor

---

## Design System: Aero (KLM-based)

The UI is modeled on the **AFR-KLM Aero Design System**.

Key CSS variables: `--primary-900`, `--grey-200`, `--grey-700`, `--radius-md`, `--s-{8,16,24}`.

Use design system component classes consistently — do not invent ad-hoc styles that diverge from the Aero aesthetic.

Import from `@app/core/design-system`:

```typescript
import {
  AeroButtonComponent,
  AeroInputComponent,
  AeroDropdownComponent,
  AeroBadgeComponent,
} from '@app/core/design-system';
```

---

## UI Generation & Consistency Rules

Whenever you are asked to generate, modify, or review Frontend UI code (Angular), you MUST strictly adhere to the following rules. Failure to do so will break the application's design system.

### 1. Context Gathering (MANDATORY FIRST STEP)

Before writing any HTML or SCSS for a new module or component, you must first read and analyze a "Gold Standard" reference module to ensure your layout matches.

- If building a List/Data page: Read `frontend/src/app/features/equipment/equipment-list.component.ts`
- If building a Detail page: Read `frontend/src/app/features/contracts/contract-detail.component.ts`
- If building a Form: Read `frontend/src/app/features/contracts/contract-form.component.ts`

### 2. Layout Wrappers

NEVER build a raw `<div>` layout for a page. You must use the established layout shells:

- **Standard Pages**: `<app-page-layout>` + `<app-page-card>` for content area
- **Detail/Entity Pages**: `<app-entity-detail-shell>`
- **Forms**: `<app-form-container>` + `<app-form-section>`

Note: Layout shells (`app-page-layout`, `app-page-card`, `app-entity-detail-shell`, `app-form-container`, `app-form-section`, `app-filter-bar`, `app-stats-grid`, `app-actions-container`) are NOT part of the AERO design system — they are structural wrappers. Keep using them as-is.

### 3. AERO Design System Components

Do NOT use raw HTML elements for interactive UI.

| Raw HTML               | Deprecated Component   | AERO Replacement                    |
| ---------------------- | ---------------------- | ----------------------------------- |
| `<button>`             | `<app-button>`         | `<aero-button>`                     |
| `<input>`              | —                      | `<aero-input>`                      |
| `<select>`             | `<app-dropdown>`       | `<aero-dropdown>`                   |
| `<div class="card">`   | —                      | `<aero-card>` or `<app-page-card>`  |
| `<span class="badge">` | —                      | `<aero-badge>`                      |
| `<div class="alert">`  | `<app-alert>`          | `<aero-notification>`               |
| `<nav>` in features    | —                      | `<aero-tabs>` or `<app-module-nav>` |
| `window.confirm()`     | `<app-confirm-dialog>` | `<aero-modal>`                      |

**Button variants**: `primary` / `secondary` / `tertiary` / `text` (NOT danger/success/ghost)
**Button sizes**: `small` / `regular` / `large` (NOT sm/md/lg)

### 4. Navigation & Headers

No local nav bars. All top-level navigation is handled by `<app-main-nav>`. For secondary navigation, use `<aero-tabs>` or `<app-module-nav>`.

### 5. Styling & Colors

- **No hardcoded colors**: Use CSS variables from `frontend/src/styles/tokens.css`
- **Spacing**: Use design tokens `var(--s-4)`, `var(--s-8)`, `var(--s-16)`, `var(--s-24)`, `var(--s-32)`
- **Colors**: `var(--primary-500)` for interactive, `var(--primary-900)` for text, `var(--semantic-red-500)` for errors

### 6. Verification Step

Before finalizing your code, ask yourself: Did I use `aero-*` components? Is this page wrapped in a layout shell? Did I accidentally create a new navigation bar?

---

## Gold Standard References

When building a new page, read the matching reference file FIRST:

| Page Type             | Reference File                                                       | Key Components                                                                                           |
| --------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| List                  | `features/equipment/equipment-list.component.ts`                     | `<app-page-layout>`, `<app-page-card>`, `<aero-table>`, `<app-filter-bar>`, `<aero-button>`              |
| Detail                | `features/contracts/contract-detail.component.ts`                    | `<app-entity-detail-shell>`, `@use 'detail-layout'`, `<app-entity-detail-sidebar-card>`, `<aero-button>` |
| Form                  | `features/contracts/contract-form.component.ts`                      | `<app-form-container>`, `<app-form-section>`, `@use 'form-layout'`, `<aero-dropdown>`                    |
| Notification (Inline) | `shared/components/validation-errors/validation-errors.component.ts` | AERO Inline Error: `--aero-notify-*` tokens, BEM `.notification__*` classes                              |
| Notification (Alert)  | `core/design-system/notification/aero-notification.component.ts`     | `<aero-notification>`: 4 types (error/warning/success/info), AERO tokens                                 |

---

## Form Page Rules

- **Outer wrapper**: Always `<app-form-container>` (provides header, cancel/save buttons, white card)
- **Sections**: Always `<app-form-section title="..." icon="..." [columns]="2">` — NEVER raw `.form-section` divs
- **Styles**: `@use 'form-layout'` in component styles — NEVER duplicate `.form-grid`, `.section-grid`, `.form-group` CSS inline
- **Inputs**: `<aero-input>` for text/number/date, `<aero-dropdown>` for selects, raw `<textarea class="form-control">` for multi-line text
- **Shared SCSS**: `frontend/src/styles/_form-layout.scss` provides `.form-grid`, `.section-grid`, `.form-group`, `.form-control`, `.error-msg`, `.checkbox-group`, `.file-upload-*`
