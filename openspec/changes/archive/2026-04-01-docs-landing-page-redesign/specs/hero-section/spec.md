## MODIFIED Requirements

### Requirement: Hero section displays project name, tagline, and feature highlights

The landing page SHALL render a hero section using a two-column layout on desktop (`lg` breakpoint): left column contains the headline text, tagline, platform badges, and CTA button; right column contains a Discord notification mockup window.

#### Scenario: Project name is prominently displayed

- **WHEN** a user opens the landing page
- **THEN** the text "Shop Watcher" SHALL be visible as the largest heading (`<h1>`) on the page
- **AND** the heading SHALL use a font size of at least 3rem on desktop
- **AND** part of the heading text SHALL render with an indigo-to-cyan gradient (`bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent`)

#### Scenario: Tagline communicates the core value proposition

- **WHEN** a user views the hero section
- **THEN** a subtitle SHALL be displayed below the project name
- **AND** the subtitle SHALL convey that the tool monitors e-commerce platforms and sends Discord notifications for new listings

#### Scenario: Feature highlight tags are displayed as styled badges

- **WHEN** a user views the hero section
- **THEN** exactly 3 platform/integration badges SHALL be visible: 蝦皮, 露天, Discord
- **AND** the 蝦皮 badge SHALL display a filled circle using the Shopee brand color (`#EE4D2D`)
- **AND** the 露天 badge SHALL display a filled circle using the Ruten brand color (`#0066CC`)
- **AND** the Discord badge SHALL display the Discord SVG logo in the Discord brand color (`#5865F2`)
- **AND** each badge SHALL have a subtle border that highlights on hover in the respective brand color

#### Scenario: Hero section CTA button links to the login page

- **WHEN** a user clicks the "免費開始使用" button in the hero section
- **THEN** the browser SHALL navigate to `https://shop-watcher.vercel.app/login`

#### Scenario: Hero section is responsive on mobile

- **WHEN** the page is viewed on a screen width below the `lg` breakpoint (< 1024px)
- **THEN** the layout SHALL collapse to a single centered column
- **AND** the Discord mockup SHALL appear below the text content
- **AND** the heading font size SHALL reduce to at least 2.25rem

## ADDED Requirements

### Requirement: Hero section displays a system status badge

The landing page SHALL display a status badge in the hero section indicating that the monitoring system is actively running.

#### Scenario: Status badge is visible with ping animation

- **WHEN** a user opens the landing page
- **THEN** a badge with the text "系統穩定監控中 v1.0" SHALL be displayed above the `<h1>` heading
- **AND** the badge SHALL contain an animated ping indicator (CSS `animate-ping` on a surrounding element)
- **AND** the badge SHALL use an indigo color scheme (`bg-indigo-500/10 border-indigo-500/20 text-indigo-400`)

### Requirement: Hero section right column displays a Discord notification mockup

The landing page SHALL render a Discord-styled notification window in the right column of the hero section to visually demonstrate the product's output.

#### Scenario: Discord mockup window is rendered

- **WHEN** a user views the hero section on desktop
- **THEN** a mockup window styled to resemble Discord SHALL be visible in the right column
- **AND** the window SHALL include a macOS-style title bar with three colored circles (red, yellow, green) and the channel name "# 最新上架通知"
- **AND** the message body SHALL contain a bot avatar, sender name "Shop Watcher Bot" with a "BOT" badge, a timestamp, a notification message, and an embed block

#### Scenario: Discord mockup embed shows item details

- **WHEN** a user views the Discord mockup
- **THEN** the embed block SHALL display: a Shopee platform label, a sample product title, a price in NT$, and the price range filter settings
- **AND** the embed SHALL have a left border in the Shopee brand color (`#EE4D2D`)

#### Scenario: Discord mockup animates with float effect

- **WHEN** the page loads
- **THEN** the mockup container SHALL continuously animate with a floating up-and-down motion using the `animate-float` keyframe (translateY 0 → -10px → 0, period 6s)
