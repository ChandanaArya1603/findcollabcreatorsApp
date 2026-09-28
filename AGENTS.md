# Project architecture rules

- Keep logged-in primary navigation and profile access in the authenticated app shell so they remain available across tabs and pushed screens.
- Profile completion lives in useProfileCompletion (server /profile_completion first, /media_kit fallback) so the Home card and auto-opened wizard share one source.
- Keep changes scoped to what was asked; never guess server response shapes — ask the user for real samples.
