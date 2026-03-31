## ADDED Requirements

### Requirement: Installation guide section displays numbered setup steps

The landing page SHALL render an installation guide section with a clear numbered sequence of steps that a new user must follow to get Shop Watcher running. The section SHALL be reachable via the `#installation` anchor link from the hero CTA button.

#### Scenario: Installation section has a visible section heading with anchor

- **WHEN** a user scrolls to or clicks the CTA link in the hero section
- **THEN** a section heading (`<h2>`) with text "快速上手" or "安裝教學" SHALL be visible
- **AND** the section element SHALL have `id="installation"` so the anchor link works

#### Scenario: Four numbered steps are displayed in order

- **WHEN** a user views the installation guide section
- **THEN** exactly 4 numbered steps SHALL be displayed in the following order:
  1. **安裝依賴** — `pip install -r requirements.txt`
  2. **安裝 Playwright** — `playwright install --with-deps chromium`
  3. **設定環境變數** — 複製 `.env.example` 為 `.env`，填入 `WORKER_SECRET` 與 `NEXT_PUBLIC_API_URL`
  4. **啟動 Worker** — `python main.py`
- **AND** each step SHALL display a step number, a bold title, and a brief description

---

### Requirement: Installation guide displays syntax-highlighted code blocks

The landing page SHALL use highlight.js v11 CDN to apply syntax highlighting to all `<pre><code>` blocks in the installation section.

#### Scenario: Shell commands are syntax highlighted

- **WHEN** the page loads and `hljs.highlightAll()` is called
- **THEN** all `<pre><code class="language-bash">` blocks in the installation section SHALL be rendered with the `github-dark` highlight.js theme
- **AND** the background of code blocks SHALL contrast visibly with the surrounding page background

#### Scenario: highlight.js CDN unavailable degrades gracefully

- **WHEN** the highlight.js CDN cannot be loaded
- **THEN** code blocks SHALL still be readable as plain preformatted text
- **AND** no JavaScript errors SHALL break the rest of the page

---

### Requirement: Installation guide includes environment variable reference table

The landing page SHALL display a table listing all required and optional environment variables for the Worker, with columns for variable name, whether it is required, default value, and description.

#### Scenario: Environment variable table lists all Worker variables

- **WHEN** a user views the environment variable reference section
- **THEN** the table SHALL contain at minimum the following rows:
  - `WORKER_SECRET` — Required — (none) — 與 Next.js API 共享的驗證密鑰
  - `NEXT_PUBLIC_API_URL` — Required — (none) — Next.js API base URL（e.g. https://xxx.vercel.app）
  - `CHECK_INTERVAL` — Optional — `300` — 掃描間隔秒數
- **AND** each row SHALL display the variable name in a monospace font

---

### Requirement: Installation guide includes Docker deployment instructions

The landing page SHALL include a Docker section showing how to run the Worker using the official Playwright Docker image.

#### Scenario: Docker run command is shown with syntax highlighting

- **WHEN** a user views the Docker section
- **THEN** a `<pre><code class="language-bash">` block SHALL display the `docker build` and `docker run` commands using the `mcr.microsoft.com/playwright/python` image
- **AND** the commands SHALL reference environment variable injection via `-e WORKER_SECRET=... -e NEXT_PUBLIC_API_URL=...`

---

### Requirement: Installation guide includes Fly.io cloud deployment instructions

The landing page SHALL include a Fly.io section showing the commands to deploy the Worker to Fly.io.

#### Scenario: Fly.io deployment steps are shown in order

- **WHEN** a user views the Fly.io deployment section
- **THEN** a code block SHALL show the sequence: `fly launch`, `fly secrets set WORKER_SECRET=... NEXT_PUBLIC_API_URL=...`, `fly deploy`
- **AND** a note SHALL explain that no persistent volume is needed (stateless Worker)
