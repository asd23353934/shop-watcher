# github-pages-deployment Specification

## Purpose

TBD - created by archiving change 'landing-page'. Update Purpose after archive.

## Requirements

### Requirement: GitHub Actions workflow automatically deploys docs/ to GitHub Pages on push to main

The repository SHALL include a `.github/workflows/pages.yml` workflow file that triggers on every push to the `main` branch and deploys the `docs/` folder contents to GitHub Pages.

#### Scenario: Workflow triggers on push to main

- **WHEN** a commit is pushed to the `main` branch
- **THEN** the `pages.yml` GitHub Actions workflow SHALL trigger automatically
- **AND** the workflow SHALL use the `actions/deploy-pages` or equivalent action to publish the `docs/` directory

#### Scenario: Workflow does not run on pushes to other branches

- **WHEN** a commit is pushed to any branch other than `main`
- **THEN** the `pages.yml` workflow SHALL NOT trigger


<!-- @trace
source: landing-page
updated: 2026-03-31
code:
  - webapp/app/api/worker/keywords/route.ts
  - webapp/public/file.svg
  - requirements.txt
  - .github/workflows/worker.yml
  - docs/index.html
  - src/scrapers/__init__.py
  - poc/screenshots/shopee.png
  - webapp/next.config.ts
  - .github/workflows/pages.yml
  - src/scrapers/shopee.py
  - webapp/prisma/migrations/20260331075111_init/migration.sql
  - webapp/app/api/settings/route.ts
  - webapp/public/next.svg
  - fly.toml
  - src/database.py
  - src/notifier.py
  - webapp/eslint.config.mjs
  - webapp/public/window.svg
  - webapp/app/layout.tsx
  - webapp/app/favicon.ico
  - webapp/package.json
  - config.example.yaml
  - webapp/README.md
  - webapp/components/KeywordForm.tsx
  - webapp/auth.ts
  - src/api_client.py
  - .github/workflows/ci.yml
  - src/scheduler.py
  - webapp/app/api/worker/notify/route.ts
  - webapp/app/page.tsx
  - webapp/postcss.config.mjs
  - poc/screenshots/ruten.png
  - webapp/app/dashboard/layout.tsx
  - webapp/app/dashboard/page.tsx
  - webapp/lib/worker-auth.ts
  - webapp/lib/prisma.ts
  - webapp/public/globe.svg
  - src/config.py
  - webapp/components/KeywordFormWrapper.tsx
  - run_once.py
  - webapp/middleware.ts
  - webapp/app/api/keywords/route.ts
  - webapp/app/login/page.tsx
  - webapp/components/KeywordList.tsx
  - webapp/prisma/schema.prisma
  - webapp/tsconfig.json
  - webapp/app/api/auth/[...nextauth]/route.ts
  - webapp/public/vercel.svg
  - Dockerfile
  - main.py
  - webapp/lib/discord.ts
  - .env.example
  - webapp/app/globals.css
  - webapp/lib/email.ts
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/components/NotificationForm.tsx
  - webapp/app/settings/page.tsx
  - webapp/prisma/migrations/migration_lock.toml
  - webapp/vercel.json
  - webapp/types/next-auth.d.ts
  - src/scrapers/ruten.py
-->

---
### Requirement: GitHub Pages source is configured to serve from the /docs folder on main branch

The GitHub Pages configuration SHALL use the `main` branch and the `/docs` folder as the publication source, without requiring a separate `gh-pages` branch.

#### Scenario: docs/index.html is served at the GitHub Pages root URL

- **WHEN** a user navigates to `https://{user}.github.io/{repo}/`
- **THEN** the browser SHALL receive and render `docs/index.html`
- **AND** no 404 error SHALL occur

#### Scenario: No gh-pages branch is required

- **WHEN** the repository is set up for GitHub Pages
- **THEN** the source SHALL be `main` branch, `/docs` folder
- **AND** no separate `gh-pages` branch SHALL be needed or created


<!-- @trace
source: landing-page
updated: 2026-03-31
code:
  - webapp/app/api/worker/keywords/route.ts
  - webapp/public/file.svg
  - requirements.txt
  - .github/workflows/worker.yml
  - docs/index.html
  - src/scrapers/__init__.py
  - poc/screenshots/shopee.png
  - webapp/next.config.ts
  - .github/workflows/pages.yml
  - src/scrapers/shopee.py
  - webapp/prisma/migrations/20260331075111_init/migration.sql
  - webapp/app/api/settings/route.ts
  - webapp/public/next.svg
  - fly.toml
  - src/database.py
  - src/notifier.py
  - webapp/eslint.config.mjs
  - webapp/public/window.svg
  - webapp/app/layout.tsx
  - webapp/app/favicon.ico
  - webapp/package.json
  - config.example.yaml
  - webapp/README.md
  - webapp/components/KeywordForm.tsx
  - webapp/auth.ts
  - src/api_client.py
  - .github/workflows/ci.yml
  - src/scheduler.py
  - webapp/app/api/worker/notify/route.ts
  - webapp/app/page.tsx
  - webapp/postcss.config.mjs
  - poc/screenshots/ruten.png
  - webapp/app/dashboard/layout.tsx
  - webapp/app/dashboard/page.tsx
  - webapp/lib/worker-auth.ts
  - webapp/lib/prisma.ts
  - webapp/public/globe.svg
  - src/config.py
  - webapp/components/KeywordFormWrapper.tsx
  - run_once.py
  - webapp/middleware.ts
  - webapp/app/api/keywords/route.ts
  - webapp/app/login/page.tsx
  - webapp/components/KeywordList.tsx
  - webapp/prisma/schema.prisma
  - webapp/tsconfig.json
  - webapp/app/api/auth/[...nextauth]/route.ts
  - webapp/public/vercel.svg
  - Dockerfile
  - main.py
  - webapp/lib/discord.ts
  - .env.example
  - webapp/app/globals.css
  - webapp/lib/email.ts
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/components/NotificationForm.tsx
  - webapp/app/settings/page.tsx
  - webapp/prisma/migrations/migration_lock.toml
  - webapp/vercel.json
  - webapp/types/next-auth.d.ts
  - src/scrapers/ruten.py
-->

---
### Requirement: docs/index.html uses only relative paths for assets

The `docs/index.html` file SHALL use only relative paths or CDN URLs for all external resources, so the page renders correctly regardless of repository name or GitHub Pages URL prefix.

#### Scenario: Page renders correctly when repo is renamed

- **WHEN** the GitHub repository is renamed and the GitHub Pages URL prefix changes
- **THEN** all CDN-loaded resources (Tailwind CSS, highlight.js) SHALL still load correctly because they use absolute CDN URLs
- **AND** no internal asset links SHALL break because no local assets outside `docs/` are referenced


<!-- @trace
source: landing-page
updated: 2026-03-31
code:
  - webapp/app/api/worker/keywords/route.ts
  - webapp/public/file.svg
  - requirements.txt
  - .github/workflows/worker.yml
  - docs/index.html
  - src/scrapers/__init__.py
  - poc/screenshots/shopee.png
  - webapp/next.config.ts
  - .github/workflows/pages.yml
  - src/scrapers/shopee.py
  - webapp/prisma/migrations/20260331075111_init/migration.sql
  - webapp/app/api/settings/route.ts
  - webapp/public/next.svg
  - fly.toml
  - src/database.py
  - src/notifier.py
  - webapp/eslint.config.mjs
  - webapp/public/window.svg
  - webapp/app/layout.tsx
  - webapp/app/favicon.ico
  - webapp/package.json
  - config.example.yaml
  - webapp/README.md
  - webapp/components/KeywordForm.tsx
  - webapp/auth.ts
  - src/api_client.py
  - .github/workflows/ci.yml
  - src/scheduler.py
  - webapp/app/api/worker/notify/route.ts
  - webapp/app/page.tsx
  - webapp/postcss.config.mjs
  - poc/screenshots/ruten.png
  - webapp/app/dashboard/layout.tsx
  - webapp/app/dashboard/page.tsx
  - webapp/lib/worker-auth.ts
  - webapp/lib/prisma.ts
  - webapp/public/globe.svg
  - src/config.py
  - webapp/components/KeywordFormWrapper.tsx
  - run_once.py
  - webapp/middleware.ts
  - webapp/app/api/keywords/route.ts
  - webapp/app/login/page.tsx
  - webapp/components/KeywordList.tsx
  - webapp/prisma/schema.prisma
  - webapp/tsconfig.json
  - webapp/app/api/auth/[...nextauth]/route.ts
  - webapp/public/vercel.svg
  - Dockerfile
  - main.py
  - webapp/lib/discord.ts
  - .env.example
  - webapp/app/globals.css
  - webapp/lib/email.ts
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/components/NotificationForm.tsx
  - webapp/app/settings/page.tsx
  - webapp/prisma/migrations/migration_lock.toml
  - webapp/vercel.json
  - webapp/types/next-auth.d.ts
  - src/scrapers/ruten.py
-->

---
### Requirement: GitHub Pages deployment completes within 2 minutes of a push to main

The deployment pipeline SHALL be fast enough that a visitor can see the updated page within 2 minutes of a commit being pushed to `main`.

#### Scenario: Page update is visible within 2 minutes after push

- **WHEN** a new commit is pushed to `main` with a change to `docs/index.html`
- **THEN** the updated page SHALL be live at the GitHub Pages URL within 2 minutes
- **AND** the GitHub Actions workflow run SHALL show a green checkmark in the repository's Actions tab

<!-- @trace
source: landing-page
updated: 2026-03-31
code:
  - webapp/app/api/worker/keywords/route.ts
  - webapp/public/file.svg
  - requirements.txt
  - .github/workflows/worker.yml
  - docs/index.html
  - src/scrapers/__init__.py
  - poc/screenshots/shopee.png
  - webapp/next.config.ts
  - .github/workflows/pages.yml
  - src/scrapers/shopee.py
  - webapp/prisma/migrations/20260331075111_init/migration.sql
  - webapp/app/api/settings/route.ts
  - webapp/public/next.svg
  - fly.toml
  - src/database.py
  - src/notifier.py
  - webapp/eslint.config.mjs
  - webapp/public/window.svg
  - webapp/app/layout.tsx
  - webapp/app/favicon.ico
  - webapp/package.json
  - config.example.yaml
  - webapp/README.md
  - webapp/components/KeywordForm.tsx
  - webapp/auth.ts
  - src/api_client.py
  - .github/workflows/ci.yml
  - src/scheduler.py
  - webapp/app/api/worker/notify/route.ts
  - webapp/app/page.tsx
  - webapp/postcss.config.mjs
  - poc/screenshots/ruten.png
  - webapp/app/dashboard/layout.tsx
  - webapp/app/dashboard/page.tsx
  - webapp/lib/worker-auth.ts
  - webapp/lib/prisma.ts
  - webapp/public/globe.svg
  - src/config.py
  - webapp/components/KeywordFormWrapper.tsx
  - run_once.py
  - webapp/middleware.ts
  - webapp/app/api/keywords/route.ts
  - webapp/app/login/page.tsx
  - webapp/components/KeywordList.tsx
  - webapp/prisma/schema.prisma
  - webapp/tsconfig.json
  - webapp/app/api/auth/[...nextauth]/route.ts
  - webapp/public/vercel.svg
  - Dockerfile
  - main.py
  - webapp/lib/discord.ts
  - .env.example
  - webapp/app/globals.css
  - webapp/lib/email.ts
  - webapp/app/api/keywords/[id]/route.ts
  - webapp/components/NotificationForm.tsx
  - webapp/app/settings/page.tsx
  - webapp/prisma/migrations/migration_lock.toml
  - webapp/vercel.json
  - webapp/types/next-auth.d.ts
  - src/scrapers/ruten.py
-->