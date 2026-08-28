# Public Session Directory Design

## Goal

Replace the home page’s hard-coded session link with a public, mobile-first directory where participants can find a session and proceed to its contribution page.

## Participant journey

The primary home action becomes “Browse sessions” and opens `/sessions`. The directory loads the current public programme, provides a search field, groups sessions by track, and gives every session a clear “Contribute” link to `/session/:slug`.

## API and data

Add a read-only `GET /api/sessions` endpoint returning conferences, tracks, and sessions from the existing hierarchy repository. It exposes programme information only; contributions, jobs, syntheses, and organizer credentials remain private. The existing session-specific endpoint remains unchanged.

## Interface

The directory follows the established Nuxt/Vue styling and editorial visual language. It uses a single column on phones and a wider card grid where space allows. Each card includes the session title, a concise description or speaker excerpt, schedule status, track context, and a prominent “Contribute” action.

With 74 sessions, search is always visible and filters titles and descriptions case-insensitively. Tracks without matching sessions disappear while searching. The page includes useful loading, empty-result, and API-error states.

## Testing

API tests verify that the public endpoint returns the hierarchy without organizer-only data. View-model tests cover grouping, search, and stable contribution links. A page-level check verifies the home action targets `/sessions`. The full test, type-check, build, and live navigation flows must pass before merge.
