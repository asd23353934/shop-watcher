## ADDED Requirements

### Requirement: Landing page includes Open Graph meta tags

The landing page (`docs/index.html`) SHALL include the following Open Graph meta tags in the `<head>` section:
- `og:type` set to `website`
- `og:title` set to the product name and tagline
- `og:description` set to a concise description of the service (max 160 characters)
- `og:url` set to the canonical GitHub Pages URL
- `og:locale` set to `zh_TW`
- `og:site_name` set to `Shop Watcher`

#### Scenario: Link shared on Discord

- **WHEN** a user shares the Landing Page URL in a Discord message
- **THEN** Discord SHALL display an embed card with title, description, and site name from the OG tags

#### Scenario: Link shared on LINE

- **WHEN** a user shares the Landing Page URL in a LINE chat
- **THEN** LINE SHALL display a preview card with the og:title and og:description


<!-- @trace
source: seo-improvement
updated: 2026-04-13
code:
  - webapp/app/sitemap.ts
  - webapp/app/layout.tsx
  - webapp/app/robots.ts
  - docs/index.html
-->

### Requirement: Landing page includes Twitter Card meta tags

The landing page SHALL include Twitter Card meta tags:
- `twitter:card` set to `summary`
- `twitter:title` matching `og:title`
- `twitter:description` matching `og:description`

#### Scenario: Link shared on Twitter / X

- **WHEN** a user shares the Landing Page URL on Twitter/X
- **THEN** the platform SHALL render a summary card with title and description


<!-- @trace
source: seo-improvement
updated: 2026-04-13
code:
  - webapp/app/sitemap.ts
  - webapp/app/layout.tsx
  - webapp/app/robots.ts
  - docs/index.html
-->

### Requirement: Landing page includes canonical URL

The landing page SHALL include a `<link rel="canonical">` element pointing to the primary GitHub Pages URL.

#### Scenario: Canonical tag present in document head

- **WHEN** a search engine crawler fetches `docs/index.html`
- **THEN** the crawler SHALL find exactly one `<link rel="canonical" href="https://asd23353934.github.io/shop-watcher/">` in the `<head>`


<!-- @trace
source: seo-improvement
updated: 2026-04-13
code:
  - webapp/app/sitemap.ts
  - webapp/app/layout.tsx
  - webapp/app/robots.ts
  - docs/index.html
-->

### Requirement: Landing page includes JSON-LD structured data

The landing page SHALL include a `<script type="application/ld+json">` block in the `<head>` containing a `@graph` with:
1. A `SoftwareApplication` entity with `name`, `description`, `applicationCategory` (`"UtilitiesApplication"`), `operatingSystem` (`"Web"`), `url`, `offers` (free tier)
2. An `Organization` entity with `name`, `url`

#### Scenario: Search engine reads structured data

- **WHEN** Google's structured data testing tool fetches the landing page
- **THEN** it SHALL detect a valid `SoftwareApplication` schema without errors

#### Scenario: Organization entity present

- **WHEN** the JSON-LD is parsed
- **THEN** the `@graph` array SHALL contain exactly two objects: one with `@type: "SoftwareApplication"` and one with `@type: "Organization"`

## Requirements


<!-- @trace
source: seo-improvement
updated: 2026-04-13
code:
  - webapp/app/sitemap.ts
  - webapp/app/layout.tsx
  - webapp/app/robots.ts
  - docs/index.html
-->

### Requirement: Landing page includes Open Graph meta tags

The landing page (`docs/index.html`) SHALL include the following Open Graph meta tags in the `<head>` section:
- `og:type` set to `website`
- `og:title` set to the product name and tagline
- `og:description` set to a concise description of the service (max 160 characters)
- `og:url` set to the canonical GitHub Pages URL
- `og:locale` set to `zh_TW`
- `og:site_name` set to `Shop Watcher`

#### Scenario: Link shared on Discord

- **WHEN** a user shares the Landing Page URL in a Discord message
- **THEN** Discord SHALL display an embed card with title, description, and site name from the OG tags

#### Scenario: Link shared on LINE

- **WHEN** a user shares the Landing Page URL in a LINE chat
- **THEN** LINE SHALL display a preview card with the og:title and og:description

---
### Requirement: Landing page includes Twitter Card meta tags

The landing page SHALL include Twitter Card meta tags:
- `twitter:card` set to `summary`
- `twitter:title` matching `og:title`
- `twitter:description` matching `og:description`

#### Scenario: Link shared on Twitter / X

- **WHEN** a user shares the Landing Page URL on Twitter/X
- **THEN** the platform SHALL render a summary card with title and description

---
### Requirement: Landing page includes canonical URL

The landing page SHALL include a `<link rel="canonical">` element pointing to the primary GitHub Pages URL.

#### Scenario: Canonical tag present in document head

- **WHEN** a search engine crawler fetches `docs/index.html`
- **THEN** the crawler SHALL find exactly one `<link rel="canonical" href="https://asd23353934.github.io/shop-watcher/">` in the `<head>`

---
### Requirement: Landing page includes JSON-LD structured data

The landing page SHALL include a `<script type="application/ld+json">` block in the `<head>` containing a `@graph` with:
1. A `SoftwareApplication` entity with `name`, `description`, `applicationCategory` (`"UtilitiesApplication"`), `operatingSystem` (`"Web"`), `url`, `offers` (free tier)
2. An `Organization` entity with `name`, `url`

#### Scenario: Search engine reads structured data

- **WHEN** Google's structured data testing tool fetches the landing page
- **THEN** it SHALL detect a valid `SoftwareApplication` schema without errors

#### Scenario: Organization entity present

- **WHEN** the JSON-LD is parsed
- **THEN** the `@graph` array SHALL contain exactly two objects: one with `@type: "SoftwareApplication"` and one with `@type: "Organization"`