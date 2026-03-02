# Bitcorp Component Design: Usage Guidelines

This document provides technical rules and patterns for using components in alignment with the Bitcorp Aero Design System.

## 1. Action Alignment & Placement

Alignment depends on the context of the interaction:

- **Full-Page Layouts**: Primary actions are placed on the **far left**. This follows the user's natural reading/input flow.
- **Contained Elements (Modals/Dialogs)**: Primary actions shift to the **bottom right**, signifying the completion of the specific task.
- **Vertical Containers**: Primary actions should be at the top to establish priority.

## 2. Form Layout Patterns

Efficiency in data entry is critical for an ERP:

- **Single-Column Layout**: Preferred for almost all forms to improve readability and completion speed.
- **Multi-Column Exception**: Only use for logically related fields (e.g., a "Start Date" and "End Date" pair) on large viewports.
- **Spacing Hierarchy**:
  - **24px (XL)**: Vertical spacing between distinct groups or fields.
  - **16px (M)**: Horizontal spacing between related fields.

## 3. Component-Specific Rules

### Buttons

- **Contextual Sizing**: Buttons should scale with the container density (Standard vs. Dense).
- **Icon usage**: Use icons to reinforce meaning, but never as a replacement for clear text in primary buttons.

### Cards

- Entire card area should be perceived as a touchpoint if it leads to a detail view.
- Use Level 1 elevation for standard cards.

### Tables vs. Lists

- **Table**: Use when the user MUST compare values across rows (e.g., comparing quotes or equipment specs).
- **List/Card**: Use when the user is searching for a specific item to act upon.

## 4. Spacing Scale Reference

Always use the standardized tokens:

- `var(--s-4)` (XS)
- `var(--s-8)` (S)
- `var(--s-16)` (M)
- `var(--s-24)` (L)
