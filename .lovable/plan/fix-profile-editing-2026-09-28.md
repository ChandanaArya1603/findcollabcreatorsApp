# Fix profile editing

## What will change
- Replace the free-text Location field with Country, State, and City selectors that load the same real lists used during registration and save their IDs.
- Replace free-text Categories with selectable category chips, enforce the five-category limit, preselect existing categories, and save the selected IDs.
- Make Social Accounts save through its dedicated service and normalize URL/handle prefills.
- Make My Commercials editable using the same platform rows, rates, remarks, barter option, and content-writing rate already available in profile completion.
- Make Past Projects editable: add and remove projects through the existing project services, with immediate refreshes.
- Add a project-logo picker and preview to each new project entry. Persisting the logo will only be connected once the backend field or upload endpoint is known; the current project API only documents brand name and collaboration link.
- Give each tab its own Save action and clear success/error messages rather than sending unrelated fields through one general save request.

## Technical details
- Reuse `/countries`, `/states`, `/cities`, `/categories`, `/update_categories`, `/update_social_accounts`, `/update_commercials`, `/add_project`, and `/delete_project`.
- Keep `/media_kit` as the shared prefill source and refresh profile/completion data after successful writes.
- Fix the existing button-reference warning while touching the edit screen.
- Verify the affected flows and ensure the preview build remains clean.

## Backend detail needed for project logos
Please provide the accepted logo field name and whether `/add_project` accepts the image file, or share the separate project-logo upload endpoint. The app will not invent an unsupported request shape.
