# Bitcorp Component Design: Overview

The Bitcorp (Aero) component philosophy focuses on a soft, approachable, and highly structured user experience. Every element is designed with a specific role in the user's momentum.

## 1. Core Component Philosophy

- **Aesthetic Tone**: All components utilize a **4px corner radius**. This creates a "soft and friendly" feel while maintaining a professional structure.
- **User Momentum**: Form flows are designed to build progression. We place easier fields first to encourage completion.
- **Action Hierarchy**:
  1.  **Primary**: The main goal of the view.
  2.  **Secondary**: Alternative paths or major secondary actions.
  3.  **Tertiary**: Low-emphasis actions (e.g., "Cancel", "Go Back").

## 2. Shared Components in Bitcorp ERP

These philosophies map to our existing shared components:

| Bitcorp Component | Aero Design Influence                             |
| :---------------- | :------------------------------------------------ |
| **aero-button**   | Implements the 3-tier hierarchy and 4px radius.   |
| **aero-card**     | Acts as an actionable container / entry point.    |
| **aero-input**    | Focused on clear labels and vertical readability. |
| **aero-table**    | Reserved for complex data comparison only.        |
| **app-dropdown**  | Standardized search/select with clear feedback.   |

## 3. General "Do's and Don'ts"

- **DO** prioritize vertical flows in forms.
- **DO** use tertiary buttons for dismissal actions.
- **DON'T** use tables for simple lists (use cards instead).
- **DON'T** mix multiple primary actions in the same view.
