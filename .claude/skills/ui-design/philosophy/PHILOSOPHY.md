# Frontend Philosophy: The Bitcorp ERP Approach

This document defines the high-level philosophy and engineering principles for the Bitcorp ERP frontend, aligning with the Bitcorp Aero Design System.

## 1. The "Aero" Mindset

We don't just "build pages"; we implement a design system. Every pixel should feel like a part of a larger, coherent ecosystem.

### Key Philosophies:

1.  **System First, Component Second**: If a design pattern doesn't exist in the Aero System, we evaluate if it _should_ exist before building it.
2.  **Density for Productivity**: As an ERP, we prioritize information density (Body S / 14px) without sacrificing clarity or spacing.
3.  **Predictability Over Novelty**: Users should know exactly how a button, a dropdown, or a table will behave because they behave the same way everywhere.

## 2. Technical Commandments

### I. Use the Wrappers

Never build a raw `<div>` layout for a feature. Use the established shells:

- `<app-page-layout>` for standard views.
- `<app-entity-detail-shell>` for complex records.
- `<app-form-container>` for transactional pages.

### II. Tokens Over Hardcoding

Never use hex codes. Use CSS variables:

- **Colors**: `var(--primary-900)`, `var(--semantic-red-500)`
- **Spacing**: `var(--s-16)`, `var(--s-24)`
- **Radius**: `var(--radius-md)`

### III. Composition Over Inheritance

Build complex UIs by composing small, tested Aero components (`<aero-button>`, `<aero-input>`, `<aero-badge>`). Avoid "God Components" that try to do everything.

## 3. UX Tenets

- **Feedback is Instant**: Every action (Success/Error) must trigger a visual confirmation or a standardized alert.
- **Search is Everywhere**: Powerful, accessible filtering (`<app-filter-bar>`) is a requirement for every data list.
- **Accessibility by Default**: Semantic HTML and correct ARIA states are not optional.

## 4. The "Gold Standard" Reference

When in doubt, look at the **Equipment Module** (`frontend/src/app/features/equipment`). It is the reference implementation for:

- List views with filtering and bulk actions.
- Tabbed detail views with sidebar stats.
- Multi-section reactive forms.
