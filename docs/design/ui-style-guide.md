# Tablé UI Style Guide

**Author:** Yuhao Xu — Product & UX Lead

## Purpose

This guide gives the frontend team a shared visual language for Tablé across web and mobile. It should prevent each page from choosing its own font, colour palette, and component style.

The goal is not to make every screen identical. The goal is to make every screen feel like the same product.

## Product Feel

Tablé should feel like a modern dining-tech product:

> Real-time table access, reachable bookings, and targeted flash deals for restaurants and diners.

The UI should be clean, calm, and operational. It should not feel like a generic food delivery app, and it should not feel like a decorative restaurant website. The product sits between hospitality and real-time logistics.

## Visual Principles

1. Use dark navy as the core brand background.
2. Use cyan as the main product accent.
3. Use warm amber only for offers, alerts, or time-sensitive commercial actions.
4. Use green only for success, live, or available states.
5. Use red only for blocked, failed, or critical states.
6. Prefer clear sans-serif typography over decorative serif typography.
7. Keep data, ETA, timers, table IDs, and money in monospaced or tabular-number styles.
8. Avoid one-off hardcoded colours inside pages. Use shared tokens instead.

## Typography

| Use | Font |
| --- | --- |
| Main UI text | Inter |
| Display headings | Inter or Manrope |
| Numeric data / ETA / timers / table IDs | JetBrains Mono, SF Mono, or system monospace |
| Brand wordmark only | Inter Bold or optional display treatment |

Rules:

- Use `font-sans` for most interface text.
- Use `font-display` for page titles and brand-level headings.
- Use `font-mono` for ETA, countdowns, table IDs, timestamps, and revenue numbers.
- Avoid using serif fonts across normal pages. Serif can make the app feel like a restaurant landing page instead of a product interface.

## Colour Tokens

### Dark Mode

Dark mode should match the approved pitch style: deep navy background, cyan accent, clean white text.

| Token | Hex | Usage |
| --- | --- | --- |
| `table.canvas` | `#0F172A` | Main app background |
| `table.surface` | `#111827` | Panels, cards, nav bars |
| `table.surfaceElevated` | `#172033` | Raised cards and modals |
| `table.border` | `#243044` | Borders and dividers |
| `table.interactive` | `#1E293B` | Inputs, inactive controls |
| `table.text` | `#F8FAFC` | Primary text |
| `table.textMuted` | `#A8B3C7` | Secondary text |
| `table.textSubtle` | `#64748B` | Helper text |
| `table.primary` | `#31D5D5` | Primary brand accent |
| `table.primaryHover` | `#67E8F9` | Hover state for primary actions |
| `table.offer` | `#F59E0B` | Flash deals, commercial actions |
| `table.success` | `#10B981` | Available, live, confirmed |
| `table.warning` | `#F59E0B` | Caution, overdue, pending |
| `table.danger` | `#EF4444` | Failed, blocked, critical |

### Light Mode

Light mode should be clear and dashboard-friendly, especially for operational or administrative screens.

| Token | Hex | Usage |
| --- | --- | --- |
| `table.light.canvas` | `#F8FAFC` | Main page background |
| `table.light.surface` | `#FFFFFF` | Cards and panels |
| `table.light.surfaceElevated` | `#F1F5F9` | Secondary panels |
| `table.light.border` | `#CBD5E1` | Borders and dividers |
| `table.light.interactive` | `#E2E8F0` | Inputs, inactive controls |
| `table.light.text` | `#0F172A` | Primary text |
| `table.light.textMuted` | `#475569` | Secondary text |
| `table.light.textSubtle` | `#64748B` | Helper text |
| `table.light.primary` | `#0891B2` | Main action colour |
| `table.light.primaryHover` | `#0E7490` | Hover state |
| `table.light.offer` | `#D97706` | Flash deals |
| `table.light.success` | `#059669` | Available, live, confirmed |
| `table.light.warning` | `#D97706` | Caution, pending |
| `table.light.danger` | `#DC2626` | Failed, blocked, critical |

## Semantic Usage

### Primary Actions

Use cyan for actions that move the user forward:

- Sign in
- Confirm booking
- Send offer
- Go live
- Save changes

Example:

```jsx
<button className="bg-table-primary text-table-canvas hover:bg-table-primaryHover">
  Confirm Booking
</button>
```

### Flash Deal Actions

Use amber only when the action is explicitly a deal, discount, incentive, or urgent commercial campaign.

Example:

```jsx
<button className="bg-table-offer text-black hover:brightness-110">
  Send Flash Deal
</button>
```

### Availability States

| State | Token |
| --- | --- |
| Available / live / confirmed | `table.success` |
| Reserved / pending / warning | `table.warning` |
| Blocked / failed / offline | `table.danger` |
| Inactive / disabled | `table.textSubtle` |

### ETA and Timers

ETA and countdowns should be visually clear and use monospaced numbers.

```jsx
<span className="font-mono tabular-nums text-table-primary">
  ETA 12
</span>
```

## Component Rules

### App Background

Use `table.canvas` for dark mode. Do not hardcode `#000000` or `#0A0A0A` on app containers.

```jsx
<div className="bg-table-canvas text-table-text">
  ...
</div>
```

### Cards and Panels

Use `table.surface` or `table.surfaceElevated`.

```jsx
<section className="bg-table-surface border border-table-border rounded-2xl">
  ...
</section>
```

### Inputs

Inputs should use the shared interactive colour and cyan focus state.

```jsx
<input className="bg-table-interactive border border-table-border text-table-text focus:border-table-primary focus:ring-table-primary/30" />
```

### Navigation

Active nav items use cyan. Inactive nav items use muted text.

```jsx
isActive ? 'text-table-primary' : 'text-table-textMuted hover:text-table-text'
```

## C-side and B-side Differences

### C-side diner experience

C-side screens should feel simple, quick, and action-first:

- Strong emphasis on discovery, ETA, table availability, and booking.
- Fewer panels.
- Clear call-to-action buttons.
- Mobile should be especially direct and low-friction.

### B-side merchant experience

B-side screens can be denser and more operational:

- More metrics, tables, and dashboard panels.
- Clear status tags.
- Strong use of live, available, reserved, warning, and campaign states.
- Still use the same font and colour tokens.

## Tailwind Token Example

Use these names in Tailwind rather than hardcoded colours:

```js
colors: {
  table: {
    canvas: '#0F172A',
    surface: '#111827',
    surfaceElevated: '#172033',
    border: '#243044',
    interactive: '#1E293B',
    text: '#F8FAFC',
    textMuted: '#A8B3C7',
    textSubtle: '#64748B',
    primary: '#31D5D5',
    primaryHover: '#67E8F9',
    offer: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
  }
}
```

## Migration Guidance

Recommended cleanup order:

1. Replace page-level `#0A0A0A`, `#000000`, and `zinc-*` backgrounds with `table.canvas`, `table.surface`, and `table.surfaceElevated`.
2. Replace `amber-*` used as normal brand colour with `table.primary`.
3. Keep amber only for offer/deal-related actions.
4. Replace `#00f2fe` with `table.primary`.
5. Replace mobile default iOS blue `#007AFF` with the light or dark mode primary token.
6. Keep success/warning/error colours semantic rather than decorative.

## Message for Frontend Team

Suggested Discord message:

```text
I reviewed the current web/mobile UI and the pitch/mockup style. To keep the app consistent, I added a UI style guide and suggested shared design tokens.

The main direction is: dark navy base, cyan primary accent, clean sans-serif typography, amber only for flash deals or warnings, and green/red only for semantic states.

This should help us avoid each page choosing its own colours and fonts. Frontend can start by using the Tailwind table-* tokens instead of hardcoded colours.
```
