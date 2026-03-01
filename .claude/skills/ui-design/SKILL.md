---
name: 'UI Design'
description: 'Activates the BitCorp Aero design system rules for the Bitcorp ERP frontend. Use this skill whenever building, reviewing, or modifying any Angular UI — pages, components, forms, dialogs, or styles.'
---

# UI Design Skill — Bitcorp ERP (Aero Design System)

> **When to activate**: Any prompt involving Angular templates, SCSS, component layout, design tokens, or visual review should trigger this skill.

---

## 1. Design Principles

| Principle              | Meaning                                            |
| :--------------------- | :------------------------------------------------- |
| **Contextual**         | Adapt to the user's device and task context        |
| **Inclusive**          | WCAG AA accessibility is non-negotiable            |
| **Simple & Efficient** | Remove friction; every action needs one clear path |
| **Consistent**         | Identical patterns everywhere — no one-offs        |

---

## 2. Design Foundations

### Colors

> **Never use BitCorp Blue `#00a1de` in the UI.** It is branding-only and fails WCAG AA.

| Role                   | Value     | CSS Token                  |
| :--------------------- | :-------- | :------------------------- |
| Primary text / nav     | `#072b45` | `var(--primary-900)`       |
| Interactive / buttons  | `#0077cd` | `var(--primary-500)`       |
| App background         | `#ebf3f8` | `var(--primary-100)`       |
| Accent (use sparingly) | `#e37222` | `var(--accent-500)`        |
| Info                   | `#006fc9` | `var(--semantic-blue-500)` |

**Rule**: Always use CSS variables (`var(--...)`) from `frontend/src/styles/tokens.css`. **Never hardcode hex values.**

### Typography

- **Typeface**: Universal Sans (Display for headlines, Text for body/labels)
- **Default body size**: `14px / 20px` (`Body S`) — ERP density standard
- **Token**: `var(--type-body-size)`, `var(--type-body-line-height)`

### Spacing Scale (`frontend/src/styles/tokens.css`)

| Token         | Value     |
| :------------ | :-------- |
| `var(--s-4)`  | 4px (XS)  |
| `var(--s-8)`  | 8px (S)   |
| `var(--s-16)` | 16px (M)  |
| `var(--s-24)` | 24px (L)  |
| `var(--s-32)` | 32px (XL) |

**Rule**: Use spacing tokens only. No `px` literals in new code.

### Grid (Desktop 960px+)

- 12 columns, 24px gutters, max content width: 960px
- `var(--radius-sm)` = 4px · `var(--radius-md)` = 8px · `var(--radius-lg)` = 16px

---

## 3. Layout Wrappers — **Mandatory**

> Never scaffold a feature with raw `<div>` wrappers. Use the established shells.

| Page Type               | Shell Component                               | When to Use                           |
| :---------------------- | :-------------------------------------------- | :------------------------------------ |
| Standard list/data page | `<app-page-layout>` + `<app-page-card>`       | Default for all list/overview views   |
| Entity detail view      | `<app-entity-detail-shell>`                   | Complex records with tabs and sidebar |
| Form / transactional    | `<app-form-container>` + `<app-form-section>` | Any create/edit form                  |

**Reference**: Gold Standard for each type lives in the **Equipment module**.

| Page Type | Gold Standard File                                |
| :-------- | :------------------------------------------------ |
| List      | `features/equipment/equipment-list.component.ts`  |
| Detail    | `features/contracts/contract-detail.component.ts` |
| Form      | `features/contracts/contract-form.component.ts`   |

---

## 4. Component Rules — Use Aero, Not Raw HTML

| Raw HTML               | ❌ Don't       | ✅ Use Instead                      |
| :--------------------- | :------------- | :---------------------------------- |
| `<button>`             | any raw button | `<aero-button>`                     |
| `<input>`              | raw input      | `<aero-input>`                      |
| `<select>`             | any `<select>` | `<app-dropdown>`                    |
| `<div class="card">`   | ad-hoc cards   | `<aero-card>` or `<app-page-card>`  |
| `<span class="badge">` | custom badges  | `<aero-badge>`                      |
| `<nav>` in features    | local navbars  | `<app-module-nav>` or `<aero-tabs>` |

### Action Hierarchy

- **Primary**: One per view max — the main CTA
- **Secondary**: Alternative/parallel actions
- **Tertiary**: Dismissal / low-priority (`<aero-button variant="tertiary">`)

### Action Placement

- **Full-page layouts**: Primary action **far left** (follows reading flow)
- **Modals/Dialogs**: Primary action **bottom right** (end of task)
- **Vertical stacks**: Primary action **at the top**

### Forms

- **Single-column** preferred for readability and completion rate
- **Multi-column** only for tightly related pairs (e.g., departure/return dates) on large viewports
- **Vertical gap between fields**: `var(--s-24)`
- **Horizontal gap between paired fields**: `var(--s-16)`
- Use `@use 'form-layout'` in component SCSS — never duplicate `.form-grid`, `.section-grid` inline

### Tables vs. Cards/Lists

- **Table (`<aero-table>`)**: Only when comparing complex datasets row-by-row
- **Card/List**: Preferred when users are searching for a single item to act on

### Dialogs / Modals

- Never use `window.confirm` or `alert`
- Use `<app-confirm-dialog>` or Angular CDK Dialog service

---

## 5. Key Do's & Don'ts

| ✅ Do                                   | ❌ Don't                              |
| :-------------------------------------- | :------------------------------------ |
| Use layout wrappers for every page      | Build raw div-based page layouts      |
| Use CSS tokens for all colors & spacing | Hardcode hex / px values              |
| Use `<app-dropdown>` for selects        | Use raw `<select>` tags               |
| Apply `@use 'form-layout'` for forms    | Duplicate `.form-group` styles inline |
| Apply accessibility (ARIA) by default   | Omit labels or keyboard support       |
| Keep one primary action per view        | Add multiple primary CTAs             |
| Use `<aero-table>` only for comparisons | Use tables for simple data lists      |
| Read the gold-standard reference first  | Invent novel patterns from scratch    |

---

## 6. Figma MCP References

### Aero Enterprise Library — Component Specs

```
Button: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=2770-106921
Button Group: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=1755-16916
Card (Advanced): https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=1752-21007
Dropdown: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=110-13999
Input and Select: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=110-14166
Input Container: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=7753-57990
Form Controls (checkbox, radio, toggle): https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=3723-47624
Table: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=1078-14377
Modal: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=1528-15476
Notification: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=1471-13918
Pagination: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=1691-16913
Navigation Bar: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=1519-15584
Side Menu: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=1519-15852
Accordion: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=1559-29396
Breadcrumbs: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=2770-110777
Chip: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=110-14072
Date Picker: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=110-13928
Drawer: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=1726-17365
Tooltip: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=1465-13616
Progress Indicator: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=1914-31771
Stepper: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=656-13848
Overlay: https://www.figma.com/design/2bPqBp9RpQLREaWFxsSkmx/AERO-Enterprise-Library?node-id=7691-55168
```

### Tokens & Colors (Figma)

```
Colors: https://www.figma.com/design/K3fUPIpFiXordBbrJxha96/ALIGN--Development-?node-id=20-443620&m=dev
Typography: https://www.figma.com/design/K3fUPIpFiXordBbrJxha96/ALIGN--Development-?node-id=20-443591&m=dev
```

---

## 7. Detailed References

- [Frontend Philosophy](./philosophy/PHILOSOPHY.md) — Aero mindset, technical commandments
- [Design Foundations](./philosophy/FOUNDATIONS.md) — Full color, type, elevation, grid rules
- [Component Overview](./components/OVERVIEW.md) — Bitcorp component theory & project mapping
- [Component Usage](./components/USAGE.md) — Action placement, form layout, spacing
