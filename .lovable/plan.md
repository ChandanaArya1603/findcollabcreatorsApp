# Campaign actions and logged-in navigation

## Scope
- Make each Find Campaigns card open the existing Apply sheet without also opening Campaign Detail; reuse its live cost, optional proposal fields, boost, balance checks, submission, toast, and query invalidation.
- Hide Wallet cost notes containing `/api/`.
- Keep the five-item bottom navigation visible across logged-in tabs and pushed pages: Home, Search, Pitch, Messages, Wallet. Use one uniform icon/label/dot treatment.
- Route Pitch directly to Discover Startups and move Profile access to a tappable user avatar in the shared top area, using the real profile image when available and an initial otherwise.
- Reserve bottom space on every scrollable page so navigation does not cover content; full-screen sheets continue to overlay it.
- Change Discover Startup cards to an equal-height, two-column phone grid with a one-column fallback below 340px, and give connected Gmail a green success treatment.
- Rename the Home quick action to My Campaigns and retain its existing destination.

## Technical details
- Reuse `ApplySheet` and existing campaign invalidation rather than duplicating pricing or submission logic.
- Centralize avatar/profile navigation and persistent bottom navigation in the authenticated app shell.
- Preserve existing API calls, React Query keys, theme tokens, and all unrelated screen behavior.
- Verify the preview build and inspect the updated logged-in layout at phone width where authentication permits.
