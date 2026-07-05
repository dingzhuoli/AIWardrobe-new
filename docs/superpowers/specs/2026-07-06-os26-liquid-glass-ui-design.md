# OS 26 Liquid Glass UI Design

## Goal

Apply the selected B direction to AIWardrobe: a full-app OS 26 / Liquid Glass visual refresh that keeps existing data flow and API contracts intact.

## Selected Direction

The chosen direction is complete Liquid Glass. Content stays primary, while navigation, search, filters, modal surfaces, buttons, and high-priority controls become floating glass layers. The UI should feel system-like, bright, adaptive, and tactile without turning every element into glass.

## Scope

- Update global design tokens in `frontend/src/index.css`.
- Add reusable utilities for app background, glass surfaces, glass navigation, cards, buttons, inputs, chips, icon controls, focus states, and reduced motion.
- Refresh `App`, `TabBar`, `FilterBar`, `Upload`, `Settings`, and visible page containers/cards.
- Replace emoji UI affordances with Lucide icons or text-safe glyphs.
- Remove purple decorative blobs and heavy single-hue blue shadows.
- Preserve routes, contexts, API calls, request payloads, i18n keys, and backend behavior.

## Visual Rules

- Use a subtle multi-stop app background with light, blue, cyan, and green undertones.
- Use Liquid Glass mainly for controls and floating surfaces, not every content block.
- Keep clothing imagery on clean translucent panels with stable aspect ratios.
- Use `--accent` for primary actions and active states, with `--accent-soft` and `--accent-2` for supporting states.
- Keep cards at an 8px radius where possible, except OS-like pills, sheets, tab bars, and media containers where rounder geometry is part of the control language.
- Use Lucide icons for controls and empty states.
- Preserve dark mode with darker glass surfaces and readable contrast.

## Component Plan

- `App.jsx`: provide the app background layer and content shell.
- `index.css`: define tokens and reusable utility classes.
- `TabBar.jsx`: use a floating glass bottom tab bar on mobile and centered glass rail on desktop.
- `FilterBar.jsx`: use a glass search field and segmented chips.
- `Upload.jsx`: turn the upload target into a glass drop zone with visible drag state and a glass progress bar.
- `Settings.jsx`: restyle the sheet as a glass panel and remove emoji controls.
- Pages: use the global background and glass/card utilities consistently, keeping existing business logic.

## Testing

- Add a Vitest static contract test that checks for Liquid Glass tokens/classes, floating navigation usage, no emoji UI affordances, and removal of the purple decorative blob.
- Run `npm test`, `npm run lint`, and `npm run build` from `frontend`.
- Optionally run a local preview screenshot check if the dev server can start in this environment.

## Merge Requirement

After verification passes, merge the feature branch into `main` locally and run verification again on `main`.
