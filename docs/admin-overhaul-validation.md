# Admin overhaul — local validation

Implementation follows the approved Mailchimp-informed plan: Appraisal Software terminology, white and jade admin surfaces, separate temporary Getting Started, operational Home, Reports, focused campaign configuration, and the existing appraisal form builder. No dependencies, database migrations, public-page redesigns or report calculations were added.

## Automated checks completed

| Check | Result |
| --- | --- |
| `npm test` | 98 tests pass across 14 files |
| `npm run lint` | No errors; existing unused `searchParams` warning in the login page |
| `npm run typecheck` | Pass |
| `npm run build` | Pass; both new dashboard routes included |
| `node scripts/check-production-safeguards.mjs` | Pass against a disposable local PostgreSQL cluster |
| `git diff --check` | Pass |

The database check applies every existing migration and exercises Annual send guards, timing, rollback, respondent submission, campaign-local forms and revision conflicts, 360 new/legacy draft handling, guarded conversion, finalisation races, anonymous respondent isolation, private grants/RLS, closure requirements and the five-response report threshold. Its privacy tests also verify that an optional question below the threshold is suppressed and that reports do not release reviewer identities, chronology or suppressed comments. It does not connect to the configured workspace database or send real invitations.

New runnable checks cover:

- Saved-state onboarding progress, latest-draft resume, prepared-draft completion and scheduled/launched history after archival.
- Unsent-draft exclusion from Reports, Annual partial-report availability, authoritative 360 eligibility, search/type filtering and unavailable-report links.
- Campaign-specific 360 template validation without affecting Annual drafts sharing that template.
- Directory composition, organisational context, onboarding navigation, focused workspaces, form controls, Annual/360 previews and locked forms.
- Report-library server loading: anonymous report answers never enter the directory output; eligibility failures surface as errors.

The build also reports the installed Supabase package's Node 20 deprecation notice. Runtime/dependency upgrades are outside this design pass.

## Browser composition checks

Actual admin components were rendered with fictional data into isolated static fixtures. These fixtures have no authentication bypass, database access, persistence or invitation sending; their buttons do not exercise server actions.

Reports, Campaigns, People, draft assembly and the form builder were checked at 1440, 768 and 390 CSS pixels using browser automation. Checks cover page/preview hierarchy, long names, density, 28/26px directory titles and 24/22px focused-task titles, 40px controls, table containment and stacked panels. Keyboard focus reaches the mobile navigation trigger with a visible 2px outline. Sampled contrast is 6.45:1 for the primary action and 6.38:1 for muted text on white. Reports includes populated, empty and privacy-unavailable states; People includes visible error feedback.

Safari desktop and Responsive Design Mode were used to inspect report composition at desktop, tablet and mobile widths. The admin select styling was adjusted to eliminate Safari's shorter native controls. A positioned table container prevents an absolutely positioned screen-reader label from causing page-wide horizontal overflow. The existing live respondent surface was retained inside the builder preview.

These are presentation checks, not authenticated end-to-end acceptance. They support comparison with the inspected Mailchimp composition but do not establish parity across every real workspace state.

## Remaining authenticated acceptance checks

An authenticated local Safari session is now available. The polish pass inspected saved workspace data and exercised read-only navigation and previews. A disposable workspace for import/send/save acceptance is still required; existing people, campaigns and settings were not modified for testing.

Before release, complete these checks in a disposable workspace:

1. Import people with valid/invalid rows; verify departments, default managers, permissions and archive handling. Enter import from campaign participants and return to select the imported People records.
2. Configure Annual participants/managers and 360 subjects/reviewers; save/reload; confirm unsaved-change warnings, Finish later and return navigation.
3. Exercise all five Annual question types and the two 360 types, ordering, duplication, required answers, Employee/Manager and anonymous previews, explicit save state, Save and exit, revision conflict errors and locked forms.
4. Send/schedule disposable campaigns through the UI and verify confirmations, saved timing, readiness and server feedback. Use controlled recipient addresses.
5. Inspect Annual partial/complete reports and 360 reports before closure, below the minimum, and with per-question suppression. Backend rules passed the disposable SQL suite; their authenticated UI presentation remains to be exercised.
6. Verify Getting Started hides after scheduling/launch, stays complete after launched campaigns are archived, and remains accessible directly; operational Home retains its normal identity.
7. Exercise Settings tabs and existing `?tab=` links, branding previews, Team permissions, billing actions, Templates/editor, import, search, My Account and upgrade. Check populated/empty/error states, keyboard navigation and mobile navigation with JavaScript enabled.
8. Compare full authenticated Safari screenshots at matching desktop/tablet/mobile viewport sizes with the inspected Mailchimp reference. Complete the whole admin journey before claiming design acceptance.

No production release was performed. The implementation is local and reviewable; full authenticated acceptance remains outstanding.

## Authenticated polish pass

Using the signed-in local app in Safari, verified desktop Home, Campaigns, People, add-person panel, Branding Settings, Annual draft assembly, participant selection, completed Getting Started and the form builder. Tightened page gutters, headings, toolbars, table rows, checklist spacing and editor panels. Removed Campaigns’ duplicated heading/status selector and two redundant builder boundaries. Draft assembly uses a 60% campaign / 40% saved-form preview split and opens on a real saved question.

Actual Safari inspection exposed a focused-shell cascade bug: higher-priority Tailwind display utilities kept the dashboard header/sidebar visible on draft assembly. The focused-only hide rule now overrides those utilities, and the full-width draft was visibly verified after a cache refresh. Normal directories retain their shell.

Safari Responsive Design Mode checks at 768 and 390 CSS pixels confirmed stacked builder panels, wrapped toolbar actions, role previews, mobile Campaigns rows, contained People/Reports tables and working mobile menu navigation. Employee/Manager preview switching and question selection preserve “Changes saved”; no save or invitation action was submitted. Status tabs now wrap on mobile so every filter stays visible. Completed Getting Started links lead to the corresponding directories.

The final polish passes all 98 tests, lint (same pre-existing login warning), typecheck via the production build, production build and diff whitespace checks. Remaining disposable workflow and report-state acceptance above remains outstanding.

## Compact draft and participant grid

The draft header and checklist are shorter. At desktop widths, both Annual and 360 draft panels use the available viewport height with contained scrolling for longer content. Preview spacing is scoped to the admin embed; the live respondent form is unchanged. Safari desktop inspection confirmed the Annual draft, preview question and Back/Continue controls fit in one screen.

Annual participant selection now uses one full-width spreadsheet-style table with separate employee, email, department, campaign manager and review columns. Campaign manager controls sit in each row; the duplicated selected-person sidebar is removed. The summary stays compact below the grid and the Save/Cancel controls remain visible on desktop. Saved archived participants remain visible and removable, while new selection and manager options continue to use active People records.

In authenticated Safari, selecting both available contacts and changing an inline campaign manager updated the review totals without growing the layout. All temporary choices were reverted without saving. Tablet (768px) and mobile (390px) checks confirmed dense rows, wrapped controls and horizontal scrolling contained to the table. A runnable rendering check covers inline manager controls, existing assignments and saved archived participants. All 98 tests, lint, typecheck, production build and whitespace checks pass, subject to the existing warnings recorded above. No workspace records or invitations were changed during these checks.
