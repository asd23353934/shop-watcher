## ADDED Requirements

### Requirement: Feature section displays three capability cards

The landing page SHALL render a feature section with exactly 3 cards laid out in a responsive grid, each describing one core capability of Shop Watcher.

#### Scenario: Three feature cards are rendered

- **WHEN** a user scrolls to the feature section
- **THEN** exactly 3 cards SHALL be visible with the following titles:
  1. 多平台監控 — 同時監控蝦皮與露天拍賣
  2. Discord 即時通知 — 發現新商品立即 Ping 指定用戶
  3. 靈活設定 — 關鍵字、價格範圍、掃描間隔自由配置

#### Scenario: Each card contains an icon, title, and description

- **WHEN** a user views a feature card
- **THEN** the card SHALL contain an icon (SVG or emoji), a bold title, and a 2–3 sentence description
- **AND** the description for the notification card SHALL mention that different keywords can mention different Discord users (`discord_user_id`)

#### Scenario: Feature grid is responsive

- **WHEN** the page is viewed on a screen width ≥ 768px
- **THEN** the 3 cards SHALL be displayed in a single row (3-column grid)
- **WHEN** the page is viewed on a screen width < 768px
- **THEN** the cards SHALL stack vertically in a single column

#### Scenario: Feature section has a visible section heading

- **WHEN** a user views the feature section
- **THEN** a section heading (`<h2>`) with text "核心功能" SHALL be displayed above the cards
