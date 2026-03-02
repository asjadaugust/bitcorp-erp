# BitCorp Digital Design Foundation

Derived from the Aero Design System, this document outlines the foundational building blocks for all digital interfaces in the Bitcorp ERP project.

## 1. Design Principles (Aero)

The Aero Design System is built on four core values:

- **Contextual**: Adapt to the user's device and situation to provide the most relevant experience.
- **Inclusive**: Built for everyone. Accessibility is a first-class citizen (WCAG standards).
- **Simple & Efficient**: Help users achieve their goals with minimal friction. Intuitive navigation and clear actions.
- **Consistent**: A unified experience across all digital touchpoints.

## 2. Visual Foundations

### Core Color Palette

> [!IMPORTANT]
> **BitCorp Blue (#00a1de)** is reserved for branding only. It is **not** used for text or interactive elements as it does not meet WCAG AA contrast standards.

| Category       | Token / Value   | Usage                                      |
| :------------- | :-------------- | :----------------------------------------- |
| **Primary**    | `#072b45` (900) | Primary text and dark backgrounds          |
| **Action**     | `#0077cd` (500) | Main interactive elements (buttons, links) |
| **Background** | `#ebf3f8` (100) | App body background                        |
| **Accent**     | `#e37222`       | Visual interest, used sparingly            |

#### Semantic Logic

- **Success**: `#268712` (Green 500)
- **Error**: `#d10031` (Red 500)
- **Information**: `#006fc9` (Blue 500)

### Typography: Universal Sans

We use **Universal Sans** with two specific variants:

- **Display**: Used for headlines and large UI elements (Medium 500 weight).
- **Text**: Used for body copy, labels, and small UI (Regular 400, Medium 500, Bold 700).

**Standard Web Scale:**

- **Body S**: 14px / 20px line-height (Default for ERP density)
- **Body M**: 16px / 24px line-height
- **Headlines**: Range from 20px (XS) to 48px (XXL).

### Elevation (Z-Axis)

The system uses a 5-level elevation system (0-4):

- **Level 0**: Flat (Background)
- **Level 1**: Subtle lift (Default card)
- **Level 2/3**: Interaction states and overlays (Modals, Dropdowns)
- **Note**: Shadows are multi-layered for realism.

### Spacing & Grid

The layout follows a **4px / 8px incremental grid**.

- **XS**: 4px
- **S**: 8px
- **M**: 16px
- **L**: 24px
- **XL**: 32px

**Desktop Grid (960px+):**

- 12 Columns
- 24px Gutters
- Maximum Content Width: 960px (Standard centered container)

## 3. Implementation in Bitcorp ERP

These foundations are implemented via `frontend/src/styles/tokens.css` and `frontend/src/styles.scss`. All new components must reference these CSS variables rather than hardcoding values.
