# PROSPECTRE atomic design system

This folder is the shared UI reference for the PROSPECTRE interface refactor.
It translates the Liquid Glass kit language into PROSPECTRE-owned `ps-*`
classes and follows Brad Frost's Atomic Design layers.

## Load order

`index.css` is loaded before `app.css`.
`adapters.css` is loaded after `app.css`.

This keeps the system primitives stable while legacy selectors are migrated
progressively.

## Layers

- `tokens.css`: design tokens, theme values, spacing, radii, motion, z-index and
  the Liquid Glass surface model, including runtime palette variables
  `--ps-palette-1..7`.
- `atoms.css`: indivisible primitives such as surface, button, icon button,
  input, chip and text helpers.
- `molecules.css`: small reusable groups such as fields, tab lists, cards,
  badges, switches, skeletons, action rows and meta lists.
- `organisms.css`: PROSPECTRE sections such as panels, editor shells, data
  tables, breadcrumbs and steppers.
- `templates.css`: layout templates for workspace, split and stack flows.
- `pages.css`: concrete page-level compositions used to validate real
  PROSPECTRE content in panels, sheets and responsive states.
- `adapters.css`: temporary bridge from existing app selectors to the `ps-*`
  system. It may target legacy classes, but should consume system tokens and
  component classes.

## Liquid Glass rules

- Keep the kit as inspiration, not as copied source.
- Prefer `--ps-glass-*` tokens over one-off blur, border and shadow values.
- Use `ps-surface` for transparent glass surfaces, then compose with a molecule
  or organism class such as `ps-card`, `ps-panel` or `ps-editor-shell`.
- Preserve readability first: glass effects must not reduce contrast or make
  dense operational panels harder to scan.
- Respect reduced-motion fallbacks for shimmer, hover and spring transitions.

## Atomic rules

- New UI should use `ps-*` classes directly.
- Existing UI can keep semantic or behavioral selectors, but visual styling
  should move toward tokens, primitives and adapters.
- Add tokens only when they represent a reusable decision.
- Add atoms only for primitives that cannot be decomposed further.
- Add molecules for compact controls or repeatable card-like content.
- Add organisms for complete PROSPECTRE sections with internal structure.
- Add pages only when several organisms must be tested together in a real
  layout.

## Current component inventory

Atoms:

- `ps-surface`
- `ps-button`, `ps-button--primary`
- `ps-icon-button`
- `ps-input`
- `ps-chip`
- `ps-text-label`, `ps-text-body`, `ps-text-muted`
- `ps-focus-ring`

Molecules:

- `ps-field`, `ps-field__hint`
- `ps-action-row`
- `ps-tab-list`, `ps-tab`
- `ps-mini-tab`
- `ps-meta-list`, `ps-meta-item`
- `ps-card`, `ps-card__header`, `ps-card__title`, `ps-card__body`
- `ps-badge`, `ps-badge--success`, `ps-badge--warning`, `ps-badge--danger`
- `ps-switch`, `ps-switch__track`, `ps-switch__thumb`
- `ps-skeleton`, `ps-skeleton--text`, `ps-skeleton--heading`,
  `ps-skeleton--circle`, `ps-skeleton-layout`, `ps-skeleton-row`
- `ps-progress`, `ps-progress__spinner`, `ps-progress__track`,
  `ps-progress__bar`
- `ps-dropdown`, `ps-dropdown__menu`, `ps-dropdown__item`
- `ps-avatar-group`, `ps-avatar`

Organisms:

- `ps-panel`, `ps-panel__header`, `ps-panel__title`, `ps-panel__body`
- `ps-editor-shell`, `ps-editor-toolbar`, `ps-editor-surface`
- `ps-data-table`, `ps-data-table-wrap`
- `ps-breadcrumb`, `ps-breadcrumb__item`, `ps-breadcrumb__current`
- `ps-stepper`, `ps-step`, `ps-step__node`
- `ps-accordion`, `ps-accordion__item`, `ps-accordion__trigger`,
  `ps-accordion__body`
- `ps-modal`, `ps-modal__header`, `ps-modal__body`, `ps-modal__footer`
- `ps-toast`, `ps-toast__content`, `ps-toast__icon`,
  `ps-toast__message`, `ps-toast__progress`
- `ps-notification`, `ps-notification__content`,
  `ps-notification__icon`, `ps-notification__body`

Templates and pages:

- `ps-workspace-template`
- `ps-split-template`
- `ps-stack-template`
- `ps-page`, `ps-page__header`, `ps-page__title`, `ps-page__subtitle`
- `ps-page-grid`, `ps-page-grid--dense`, `ps-page-stack`, `ps-page-split`

## Liquid Glass source coverage

The source kit exposes these sections: Glass Cards, Buttons, Navigation & Tabs,
Dropdown, Form Controls, Accordion, Stepper, Data Table, Toast/Snackbar, Badges
& Tags, Notifications, Modal, Skeleton Loader, Chips, Avatar Group,
Breadcrumb and 12 Liquid Animations.

Already absorbed into `ps-*` foundations:

- cards/surfaces, buttons, icon buttons, inputs, badges/chips, switches, tabs,
  breadcrumbs, steppers, data tables, skeleton shimmer and page layouts;
- glass tokens, focus rings, reduced-motion guards, adapter bridges and UI-only
  palette presets/custom colors.

Still to finish as deeper component integrations:

- `ps-select-menu` behaviour and keyboard contracts for custom selects;
- finish keyboard roving/focus refinements for project/menu popovers now marked
  up with `ps-dropdown`;
- use `ps-mini-tab` for collapsed adaptive panels: each mini-tab must expose a
  dedicated drag handle, an identity icon, compact actions and edge-aware
  stacking instead of behaving like a compressed panel header;
- finish the breadcrumb overflow menu interactions for compact headers and
  mini-tabs, using `ps-breadcrumb` structure rather than legacy breadcrumb
  buttons;
- complete migration of the remaining bespoke dialogs to `ps-modal`;
- extend `ps-avatar-group` beyond presence strips to denser profile clusters;
- extend `ps-progress` beyond inline loaders/toasts to richer import/export
  progress controls where duration is measurable;
- complete Liquid Animation utilities with safe reduced-motion defaults.
- extend palette controls outside the profile only when a feature needs a local
  preview; graph/type semantic colors should stay independent by default.

## Migration checklist

1. Reuse existing `ps-*` classes before creating a new selector.
2. Keep behavior hooks (`data-*`, IDs, semantic legacy classes) separate from
   visual classes.
3. Put durable primitives in the appropriate Atomic layer.
4. Put compatibility selectors in `adapters.css`.
5. Avoid new visual rules in `app.css` unless they are truly global runtime
   shell rules.
6. Validate with `npm run check` and, for visible UI changes, `npm run smoke:ui`.
