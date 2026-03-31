## ADDED Requirements

### Requirement: Hero section displays project name, tagline, and feature highlights

The landing page SHALL render a full-width hero section at the top of the page containing the project name, a one-sentence tagline, and a row of feature highlight tags.

#### Scenario: Project name is prominently displayed

- **WHEN** a user opens the landing page
- **THEN** the text "Shop Watcher" SHALL be visible as the largest heading (`<h1>`) on the page
- **AND** the heading SHALL use a font size of at least 3rem on desktop

#### Scenario: Tagline communicates the core value proposition

- **WHEN** a user views the hero section
- **THEN** a subtitle SHALL be displayed below the project name
- **AND** the subtitle SHALL convey that the tool monitors e-commerce platforms and sends Discord notifications for new listings

#### Scenario: Feature highlight tags are displayed in a row

- **WHEN** a user views the hero section
- **THEN** at least 4 feature tags SHALL be visible: 蝦皮 Shopee, 露天拍賣 Ruten, Discord 即時通知, and 關鍵字監控
- **AND** each tag SHALL have a colored background (Shopee tag: `#EE4D2D`; Ruten tag: `#0066CC`; others: neutral)

#### Scenario: Hero section CTA button links to installation guide

- **WHEN** a user clicks the "開始使用" (Get Started) button in the hero section
- **THEN** the page SHALL scroll smoothly to the installation guide section
- **AND** the button's `href` SHALL be `#installation`

#### Scenario: Hero section is responsive on mobile

- **WHEN** the page is viewed on a screen width of 375px
- **THEN** the heading font size SHALL reduce to at least 1.875rem
- **AND** the feature tags SHALL wrap to multiple lines without horizontal overflow
