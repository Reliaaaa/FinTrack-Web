---
name: Precision Slate Fintech
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#00174b'
  on-tertiary-container: '#497cff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  background-main: '#F8FAFC'
  surface-card: '#FFFFFF'
  border-default: '#E2E8F0'
  text-primary: '#0F172A'
  text-secondary: '#475569'
  text-muted: '#94A3B8'
  income-text: '#059669'
  income-bg: '#ECFDF5'
  expense-text: '#E11D48'
  expense-bg: '#FFF1F2'
  transfer-text: '#2563EB'
  transfer-bg: '#EFF6FF'
  warning-text: '#D97706'
  warning-bg: '#FFFBEB'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  kpi-metric:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  currency-tabular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

The design system establishes a high-precision, utilitarian personal finance SaaS aesthetic engineered for clarity, trust, and executive control. The visual language blends the razor-sharp informational density of tools like Linear with the refined, authoritative minimalism of Stripe Dashboard. 

Targeted at modern Indonesian professionals, digital natives, and household managers, the interface communicates absolute financial fidelity. Interactions should evoke composure, analytical competence, and certainty. The aesthetic abandons visual clutter, heavy drop shadows, and ornamental gradients in favor of structural clarity, crisp geometric hierarchy, disciplined borders, and calibrated chromatic indicators.

## Colors

The palette revolves around deep slate foundations (`#0F172A`) offset by an emerald green accent (`#10B981`), symbolizing financial health, discipline, and sustained growth. 

Semantic financial indicators are paired with dedicated high-legibility background tints:
- **Income (Pemasukan):** `#059669` text on `#ECFDF5` container.
- **Expense (Pengeluaran):** `#E11D48` text on `#FFF1F2` container.
- **Transfers & System States:** `#2563EB` text on `#EFF6FF` container.
- **Budget Thresholds & Warnings (>80% limit):** `#D97706` text on `#FFFBEB` container.

Backgrounds utilize `#F8FAFC` to reduce glare during prolonged data auditing, while white `#FFFFFF` cards establish clean visual segmentation via crisp `#E2E8F0` structural boundaries.

## Typography

Typography balances geometric identity for section headings (`Plus Jakarta Sans`) with neutral legibility for analytical figures (`Inter`). 

All financial representations, ledger lines, balance tables, and KPI metrics strictly require `font-variant-numeric: tabular-nums` (Tailwind `tabular-nums`). This guarantees Indonesian Rupiah (`Rp`) figures align precisely along the decimal and column axes, eliminating horizontal jitter during live filtering and balance updates.

## Layout & Spacing

The workspace enforces a fixed-fluid hybrid structure:
- **Desktop (`>= 1024px`):** Fixed left navigation rail at `260px` width paired with a fluid main canvas restricted to a `1440px` maximum viewport. Inner content distributes across a 12-column grid utilizing `20px` to `24px` gutters (`gutter-desktop`).
- **Header:** Sticky top banner fixed at `64px` height across desktop views.
- **Mobile (`< 768px`):** The left sidebar unmounts, replaced by a bottom tab bar (`64px` height) with a persistent centered floating input action. Canvas margins narrow to `16px` (`margin`).

Standard spatial steps align to an 8pt system, using `space-xs` (4px) and `space-sm` (8px) for internal button and control offsets, and `space-md` (16px) to `space-lg` (24px) for data card padding.

## Elevation & Depth

This system avoids blurred, heavy drop shadows to preserve rapid scanning and a technical aesthetic. Visual hierarchy relies on **low-contrast outlines** and subtle layered tones:

- **Surface Base:** Flat `#F8FAFC` foundation.
- **Container Level:** Pure white `#FFFFFF` surface bordered by a clean `1px solid #E2E8F0` rule.
- **Elevated Modals & Flyouts:** Dialogs use `0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)` paired with an active backdrop filter (`backdrop-blur-sm` over `rgba(15, 23, 42, 0.4)`).
- **Interactive State Elevation:** Interactive cards do not rise physically on hover; they shift border contrast to `#CBD5E1` and display a subtle ring focus (`0 0 0 1px #CBD5E1`).

## Shapes

The geometric rule follows a two-tier roundedness standard:
- **Cards, Panels, and Dialog Windows:** `12px` border radius (`rounded-lg`).
- **Interactive Controls (Buttons, Inputs, Selectors, Tabs):** `8px` border radius (`rounded-md`).
- **Status Badges, Category Chips, and Avatars:** Fully rounded pill shapes (`rounded-full`).

No sharp 0px corners are permitted, ensuring the interface feels modern without losing its architectural discipline.

## Components

### Buttons
- **Primary:** Background `#0F172A`, text `#FFFFFF`, radius `8px`, font weight 600. Subtle hover transition to `#1E293B`.
- **Secondary / Outline:** Background transparent, border `1px solid #E2E8F0`, text `#0F172A`. Hover background `#F8FAFC`.
- **Ghost:** Transparent background, text `#475569`, hover background `#F1F5F9`.
- **Accent CTA:** Background `#10B981`, text `#FFFFFF`. Used for high-impact actions like "+ Catat Transaksi".

### Input Fields & Controls
- Height: `40px` for standard inputs; `48px` for primary currency inputs.
- Border: `1px solid #E2E8F0`, rounded `8px`, background `#FFFFFF`.
- Focus State: Border color transitions to `#0F172A` with a clean `2px` focus ring tinted `#0F172A/10`.
- Monetary Input: Left-aligned static prefix `Rp` in `#94A3B8`, with numeric entry set to `font-variant-numeric: tabular-nums`.

### Status Badges & Chips
- Structure: Height `24px`, horizontal padding `8px`, radius `9999px` (pill), font size `11px` bold uppercase or `12px` medium sentence case.
- Income: `#ECFDF5` background with `#059669` text and icons.
- Expense: `#FFF1F2` background with `#E11D48` text and icons.
- Transfer / Account: `#EFF6FF` background with `#2563EB` text.
- Warning Threshold: `#FFFBEB` background with `#D97706` text.

### Data Cards & KPI Blocks
- Background `#FFFFFF`, border `1px solid #E2E8F0`, radius `12px`, padding `20px` to `24px`.
- Metrics display label on top (`13px`, `#64748B`), large numeric indicator in the center (`28px`, bold, `#0F172A`, tabular numbers), and micro-indicator badge at the footer.

### Ledger Data Tables
- Row height: `52px`, bordered by bottom border `1px solid #F1F5F9`.
- Headers: Background `#F8FAFC`, uppercase `11px` tracking-wide text `#64748B`.
- Row Hover: Background transitions softly to `#F8FAFC`.
- Currency Column: Right-aligned tabular numeric values prefixed with signifiers (`+Rp` in green, `-Rp` in red).