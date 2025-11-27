# Repository Guidelines

## Project Structure & Module Organization
- Liquid theme layout lives in `layout/` (theme and alternate base templates) with page-level definitions in `templates/` (JSON and Liquid templates).
- Section blocks reside in `sections/`, while reusable partials are in `snippets/`; treat sections as entry points and snippets as helpers.
- Static assets (CSS, JS, images, fonts, SVG) are in `assets/` (for example `theme.css.liquid`, `global.js`, `mockup-composite.js`); favor updating existing bundles rather than introducing new ones unless scoped.
- Store settings and schema live in `config/settings_schema.json` and store-specific data in `config/settings_data.json`; avoid committing private or store-bound values when possible.
- Locale strings live in `locales/` (per-language JSON); add keys with consistent casing and keep unused keys trimmed.

## Build, Test, and Development Commands
- `shopify theme serve` — run a local dev server with hot reload; use `--store <store-domain>` if not configured.
- `shopify theme push --unpublished` — deploy changes to a draft theme for review; include `--ignore` patterns if excluding local files.
- `shopify theme pull` — sync down remote changes before starting work to reduce merge conflicts.

## Coding Style & Naming Conventions
- Liquid: 2-space indentation; prefer `{% render 'snippet' %}` over `include`; keep logic in snippets and keep sections mostly declarative.
- CSS: keep to existing patterns in `theme.css.liquid` and component CSS files; use class-based selectors, BEM-ish naming (e.g., `.header__logo`, `.product-card--compact`), and avoid inline styles.
- JavaScript: plain ES5/ES6 in `assets/*.js`; prefer small helpers over global mutations, and keep data attributes (`data-*`) as the interface to Liquid output.
- Filenames use kebab-case; keep section names aligned with their template intent (e.g., `featured-products.liquid` for section blocks).

## Testing Guidelines
- No automated test suite; rely on theme preview. Use `shopify theme serve` and exercise: homepage, product page variants/media, collection filtering, cart drawer, predictive search, and any new section you add.
- For translations, switch locales in preview and confirm new strings render; avoid hardcoded text when a locale key exists.
- When adding settings, verify defaults in the Theme Editor and that blocks/sections can be added/removed without liquid errors.

## Commit & Pull Request Guidelines
- Commits: keep messages short and imperative (e.g., “Add product mockup compositing feature”); group related Liquid/CSS/JS changes together.
- PRs: include a brief summary of affected templates/sections, before/after screenshots or theme preview links for visual changes, and note any new settings or locale keys. Link to tickets/issues where applicable.

## Security & Configuration Tips
- Do not commit credentials or store-specific secrets; scrub `config/settings_data.json` if it contains sensitive values.
- Avoid shipping unused assets; remove dead CSS/JS and locale keys during related work to keep the theme lean.
