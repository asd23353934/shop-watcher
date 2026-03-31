## ADDED Requirements

### Requirement: GitHub Actions workflow automatically deploys docs/ to GitHub Pages on push to main

The repository SHALL include a `.github/workflows/pages.yml` workflow file that triggers on every push to the `main` branch and deploys the `docs/` folder contents to GitHub Pages.

#### Scenario: Workflow triggers on push to main

- **WHEN** a commit is pushed to the `main` branch
- **THEN** the `pages.yml` GitHub Actions workflow SHALL trigger automatically
- **AND** the workflow SHALL use the `actions/deploy-pages` or equivalent action to publish the `docs/` directory

#### Scenario: Workflow does not run on pushes to other branches

- **WHEN** a commit is pushed to any branch other than `main`
- **THEN** the `pages.yml` workflow SHALL NOT trigger

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

---

### Requirement: docs/index.html uses only relative paths for assets

The `docs/index.html` file SHALL use only relative paths or CDN URLs for all external resources, so the page renders correctly regardless of repository name or GitHub Pages URL prefix.

#### Scenario: Page renders correctly when repo is renamed

- **WHEN** the GitHub repository is renamed and the GitHub Pages URL prefix changes
- **THEN** all CDN-loaded resources (Tailwind CSS, highlight.js) SHALL still load correctly because they use absolute CDN URLs
- **AND** no internal asset links SHALL break because no local assets outside `docs/` are referenced

---

### Requirement: GitHub Pages deployment completes within 2 minutes of a push to main

The deployment pipeline SHALL be fast enough that a visitor can see the updated page within 2 minutes of a commit being pushed to `main`.

#### Scenario: Page update is visible within 2 minutes after push

- **WHEN** a new commit is pushed to `main` with a change to `docs/index.html`
- **THEN** the updated page SHALL be live at the GitHub Pages URL within 2 minutes
- **AND** the GitHub Actions workflow run SHALL show a green checkmark in the repository's Actions tab
