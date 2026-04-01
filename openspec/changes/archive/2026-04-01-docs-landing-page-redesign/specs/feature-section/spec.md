## MODIFIED Requirements

### Requirement: Feature section displays three capability cards

The landing page SHALL render a feature section with exactly 3 cards laid out in a responsive grid, each describing one core capability of Shop Watcher.

#### Scenario: Three feature cards are rendered with updated titles

- **WHEN** a user scrolls to the feature section
- **THEN** exactly 3 cards SHALL be visible with the following titles:
  1. 多平台即時掃描
  2. Discord 推送通知
  3. 精準條件過濾

#### Scenario: Each card contains an SVG icon, title, and description

- **WHEN** a user views a feature card
- **THEN** the card SHALL contain an SVG icon in a styled icon container, a bold title, and a description paragraph
- **AND** the SVG icon container SHALL use a color scheme matching the card's accent color (indigo for card 1, discord purple for card 2, cyan for card 3)

#### Scenario: Feature grid is responsive

- **WHEN** the page is viewed on a screen width ≥ 768px
- **THEN** the 3 cards SHALL be displayed in a single row (3-column grid)
- **WHEN** the page is viewed on a screen width < 768px
- **THEN** the cards SHALL stack vertically in a single column

#### Scenario: Feature section has a visible section heading

- **WHEN** a user views the feature section
- **THEN** a section heading (`<h2>`) with text "為什麼選擇 Shop Watcher？" SHALL be displayed above the cards

## ADDED Requirements

### Requirement: Feature cards respond to hover with visual feedback

Each feature card SHALL provide interactive hover effects to improve perceived interactivity.

#### Scenario: Card lifts on hover

- **WHEN** a user hovers over a feature card
- **THEN** the card SHALL translate upward by 4px (`hover:-translate-y-1`)
- **AND** the card's border color SHALL transition to `indigo-500/50`
- **AND** a soft indigo glow shadow SHALL appear beneath the card

#### Scenario: Decorative corner arc scales on hover

- **WHEN** a user hovers over a feature card
- **THEN** a decorative quarter-circle element in the top-right corner of the card SHALL scale up (`group-hover:scale-110`)
- **AND** each card's decorative arc SHALL use the card's accent color (indigo, discord purple, or cyan)
