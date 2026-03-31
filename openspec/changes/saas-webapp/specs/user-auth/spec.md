## ADDED Requirements

### Requirement: User can sign in with Google OAuth

The system SHALL provide a Google OAuth sign-in flow via NextAuth.js v5. A user who signs in for the first time SHALL have a `User` record automatically created in the database.

#### Scenario: First-time Google sign-in creates a user record

- **WHEN** a new user completes Google OAuth consent and is redirected back
- **THEN** a `User` row SHALL be created in the database with `email`, `name`, and `image` from the Google profile
- **AND** the user SHALL be redirected to `/dashboard`

#### Scenario: Returning user sign-in reuses existing record

- **WHEN** an existing user signs in with the same Google account
- **THEN** no duplicate `User` row SHALL be created
- **AND** the user SHALL be redirected to `/dashboard`

#### Scenario: Sign-in page is accessible without authentication

- **WHEN** an unauthenticated user navigates to `/login`
- **THEN** the page SHALL display a "Sign in with Google" button
- **AND** no authentication SHALL be required to view the login page

---

### Requirement: Unauthenticated users are redirected to the login page

The system SHALL redirect any unauthenticated request to a protected route to `/login`.

#### Scenario: Unauthenticated access to dashboard is blocked

- **WHEN** a user who is not signed in navigates to `/dashboard`
- **THEN** the system SHALL redirect to `/login`
- **AND** the original destination URL SHALL be preserved as a `callbackUrl` parameter

#### Scenario: Unauthenticated access to settings is blocked

- **WHEN** a user who is not signed in navigates to `/settings`
- **THEN** the system SHALL redirect to `/login`

---

### Requirement: Authenticated user can sign out

The system SHALL provide a sign-out mechanism that destroys the session and redirects to the login page.

#### Scenario: User signs out successfully

- **WHEN** an authenticated user clicks the sign-out button
- **THEN** the session SHALL be destroyed (JWT cleared)
- **AND** the user SHALL be redirected to `/login`
- **AND** subsequent navigation to `/dashboard` SHALL redirect to `/login`

---

### Requirement: Session is managed via JWT without a database session table

The system SHALL use JWT-based sessions (NextAuth.js `strategy: "jwt"`). No `Session` table SHALL exist in the Prisma schema.

#### Scenario: Session persists across page reloads

- **WHEN** an authenticated user reloads any protected page
- **THEN** the user SHALL remain authenticated without re-login
- **AND** no database query for a session row SHALL occur

#### Scenario: Session expires after the configured max age

- **WHEN** a user's JWT has exceeded the `maxAge` setting (default: 30 days)
- **THEN** the session SHALL be treated as invalid
- **AND** the user SHALL be redirected to `/login`
