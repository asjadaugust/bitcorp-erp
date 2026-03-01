---
trigger: always_on
---

# Aero Design System - Strict UI Guidelines

**CRITICAL INSTRUCTION:** You are acting as an expert Flutter UI Developer. Whenever you create or modify UI components, you MUST strictly adhere to the following Aero Design System constraints. Never invent colors, spacing, or typography. Never use native OS default alerts or pickers.

## 1. Color Palette (Strict Hex Codes)

Do not use default Flutter Material colors (e.g., `Colors.blue`). Always use the exact hex values or their defined `ThemeData` variables.

- **Primary Text:** `#072b45` (primary-900)
- **Interactive Elements (Buttons, Links, Toggles, Active Tabs):** `#0077cd` (primary-500)
- **App/Scaffold Background:** `#ebf3f8` (primary-100)
- **Card Backgrounds:** `#f6f7f8` (grey-100) or `#ffffff` (white)
- **Accent/Destructive Actions:** `#e37222` (accent-500)
- **Informative States/Badges:** `#006fc9` (semantic-blue-500)
- **Input Borders (Default):** `grey-300` (derive from standard grey palette)
- **Modal Overlay:** `#072b45` (primary-900) at 90% opacity.
- **BANNED COLOR:** Never use KLM Blue (`#00a1de`) in the UI.

## 2. Typography

Use `Universal Sans Display` for headings and `Universal Sans` for body text. Fall back to clean, system-equivalent sans-serif fonts if assets are pending.

- **Body Text:** 14px - 16px.
- **Labels/Captions:** 12px.
- Maintain a strict visual hierarchy for H1 > H2 > H3.

## 3. Spacing & Layout

All spacing MUST be a multiple of `4px` (4, 8, 12, 16, 20, 24, 32, 40, etc.).

- **Vertical gap between form fields:** `24px`.
- **Horizontal gap between paired fields:** `16px`.
- **Card Internal Padding:** `16px` or `24px`.
- **List Item Vertical Padding:** `8px` or `12px`.
- **Mobile Layout:** Forms must be strictly single-column. No horizontal scrolling.

## 4. Components & Touch Targets

- **Minimum Touch Target:** All interactive elements (buttons, inputs) MUST have a minimum height/target area of `48x48dp`.
- **Buttons:** \* Primary: Filled `#0077cd`, white text.
  - Secondary: Outlined `#0077cd`, `#0077cd` text.
  - Tertiary: No border/background, `#0077cd` text.
  - Corner Radius: `4px` or `8px`.
- **Inputs:** Must have labels above the field. Focused state must highlight the border in `#0077cd`.
- **Cards:** Subtle shadow/elevation, corner radius `8px`.
- **Alerts/Dialogs:** NEVER use native `window.alert` or `AlertDialog` equivalents. Build custom Flutter modal widgets matching Aero card styling.

## 5. Loading & Empty States

- **Loading:** Always use Shimmer/Skeleton loading states that match the expected content layout. No blank white screens.
- **Empty:** Provide an illustration/icon, descriptive text, and a primary CTA to create the first item.
