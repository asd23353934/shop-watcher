## MODIFIED Requirements

### Requirement: New item triggers an Email notification via Resend

When new items pass deduplication in a batch, the system SHALL send one Email listing all new items in a single HTML table. Each row in the table SHALL represent one item.

#### Scenario: Batch email lists all new items with seller name

- **WHEN** a batch of N new items passes deduplication and the user has an `emailAddress` configured
- **THEN** exactly one email SHALL be sent to `emailAddress`
- **AND** the email subject SHALL be `[Shop Watcher] 關鍵字「{keyword}」發現 {N} 個新商品`
- **AND** the email body SHALL contain an HTML table with one row per item
- **AND** each row SHALL include: item name (linked to item URL), platform label, price (`NT$ {n:,}` or `價格未知`), and seller name (`未知` if null)
- **AND** if an item has a non-null `image_url`, a thumbnail image SHALL be shown in its row

#### Scenario: Seller name is unknown in batch email

- **WHEN** an item in the batch has a null `seller_name`
- **THEN** the seller cell in that row SHALL display `未知`
