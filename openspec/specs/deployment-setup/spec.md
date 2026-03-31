# deployment-setup Specification

## Purpose

TBD - created by archiving change 'keyword-shop-watcher'. Update Purpose after archive.

## Requirements

### Requirement: Application runs in a Docker container based on the official Playwright Python image

The system SHALL include a `Dockerfile` that produces a runnable container image based on the Playwright Python official image.

#### Scenario: Docker image builds without errors

- **WHEN** `docker build -t shop-watcher .` is run from the project root
- **THEN** the build SHALL complete without errors
- **AND** the resulting image SHALL be based on `mcr.microsoft.com/playwright/python:v1.44.0-focal`

#### Scenario: Container starts the watcher on launch

- **WHEN** `docker run shop-watcher` is executed
- **THEN** `python main.py` SHALL be the container entrypoint
- **AND** the container MUST read `WORKER_SECRET` and `NEXT_PUBLIC_API_URL` from environment variables

#### Scenario: No persistent volume is declared

- **WHEN** the container starts
- **THEN** no `/data` directory or Docker VOLUME SHALL be declared
- **AND** the container SHALL be fully stateless with no local file persistence required


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: .env file configures the three required environment variables

The system SHALL include a `.env.example` file listing the three environment variables required by the Worker.

#### Scenario: .env.example contains all required variables

- **WHEN** a developer inspects `.env.example`
- **THEN** it SHALL contain exactly these three entries:
  - `WORKER_SECRET=` — shared secret with the Next.js API
  - `NEXT_PUBLIC_API_URL=` — base URL of the Next.js API (e.g. `https://xxx.vercel.app`)
  - `CHECK_INTERVAL=300` — scan interval in seconds (default 300)

#### Scenario: .env is excluded from version control

- **WHEN** a developer clones the repository
- **THEN** `.env` SHALL be listed in `.gitignore`
- **AND** no actual secrets SHALL be committed to the repository


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: GitHub Actions CI pipeline runs lint on every push

The system SHALL include `.github/workflows/ci.yml` that runs on every push to `main`.

#### Scenario: CI pipeline runs on push to main

- **WHEN** a commit is pushed to the `main` branch
- **THEN** the GitHub Actions workflow SHALL trigger automatically

#### Scenario: CI pipeline installs dependencies and runs lint

- **WHEN** the CI pipeline runs
- **THEN** it SHALL install Python dependencies via `pip install -r requirements.txt`
- **AND** it SHALL run `python -m flake8 src/ main.py` or equivalent linter


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: GitHub Actions CD pipeline deploys to Fly.io on main branch

The system SHALL include a deploy job in the CI pipeline that deploys the Docker image to Fly.io after lint passes.

#### Scenario: Deploy job runs after CI passes

- **WHEN** the CI lint job succeeds on the `main` branch
- **THEN** the deploy job SHALL run `flyctl deploy --remote-only`
- **AND** it MUST use `FLY_API_TOKEN` from GitHub Actions secrets

#### Scenario: Fly.io secrets are not committed to the repository

- **WHEN** a developer clones the repository
- **THEN** no API tokens or webhook URLs SHALL be present in any committed file
- **AND** `WORKER_SECRET` and `NEXT_PUBLIC_API_URL` SHALL be set as Fly.io secrets via `fly secrets set`


<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->

---
### Requirement: fly.toml configures the Fly.io deployment without a volume mount

The system SHALL include a `fly.toml` that defines the app name, region, and process configuration without a persistent volume.

#### Scenario: fly.toml defines the app process

- **WHEN** `fly deploy` reads `fly.toml`
- **THEN** the `[processes]` section SHALL define `app = "python main.py"`
- **AND** no `[mounts]` section SHALL be present (stateless Worker, no SQLite)

#### Scenario: Fly.io secrets are set for the Worker

- **WHEN** setting up the Fly.io deployment
- **THEN** `fly secrets set WORKER_SECRET=... NEXT_PUBLIC_API_URL=...` SHALL be the documented setup command

<!-- @trace
source: keyword-shop-watcher
updated: 2026-03-31
code:
  - .env.example
  - src/scrapers/shopee.py
  - src/scrapers/__init__.py
  - config.example.yaml
  - src/database.py
  - src/scheduler.py
  - fly.toml
  - Dockerfile
  - requirements.txt
  - src/api_client.py
  - poc/screenshots/ruten.png
  - src/scrapers/ruten.py
  - .github/workflows/ci.yml
  - src/config.py
  - src/notifier.py
  - poc/screenshots/shopee.png
  - main.py
-->