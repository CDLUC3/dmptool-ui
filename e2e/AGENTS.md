# AGENTS.md — e2e tests

These rules apply to the Playwright tests in `e2e/`, and to anything you run against the app while writing them (scratch specs, scripts, manual checks). The root `AGENTS.md` still applies, except where this file says otherwise.

`e2e/` is a separate npm package. Its tests run against the real UI, `dmptool-apollo-server` and `dmptool-auth`, so everything a test does changes real data in that environment.

## Never

- **Never publish a plan.** Publishing registers the plan's DOI with EZID, and the local Apollo and the deployed environments use EZID's staging server, where registered DOIs can't be deleted. So:
  - never click **Publish** in the plan's "Publish: set visibility" dialog,
  - never call the `publishPlan` mutation,
  - never test making a plan public.

  You may open the Publish dialog and check its first step (the checklist), then close it.
- **Never use a `SUPERADMIN` account, or any account other than the test accounts** in `e2e/.env` (`E2E_RESEARCHER_*`, `E2E_ADMIN_*`, `E2E_FUNDERADMIN_*`). The README explains why.
- **Never record a password in a trace.**
  - A spec that types a password must use `test.use(NO_TRACE)` from `tests/helpers/login.ts`.
  - Never pass `--trace on`, because it overrides that.
  - Specs that only need a logged-in user should start from a saved session with `asRole()` instead of logging in.
  - Hooks that call Apollo with `playwright.request.newContext()` should use `storageState: await freshSession(role)`, not `authFile(role)`. A session saved more than 15 minutes earlier has an expired access token, and `freshSession()` refreshes it.
- **Never commit, upload or share** `e2e/.env`, `e2e/playwright/` (saved sessions with login cookies), `test-results/` or `playwright-report/`.
- **Never call live external services from a test.** For example:
  - "Search for projects" queries NIH's award database, so use "Add project manually" instead.
  - Plan downloads need `dmptool-narrative-generator`, which usually isn't running locally.
- **Never create data the tests can't remove.** For example, typing a new name into an organization typeahead, or choosing "Other", creates a new affiliation, and the API can't delete it. Pick an existing organization instead.
- **Never add, remove or upgrade a dependency** in `e2e/package.json` without asking. Pin exact versions, as in the root package.

## Always

- **Create the data each test needs**, and don't rely on seed data or on another spec file's data.
  - Spec files run in parallel, and `template.spec.ts` deletes its templates when it finishes.
  - To create data through Apollo, use the helpers, for example `createPublishedTemplate()` in `tests/helpers/plan.ts`.
- **Remove everything a test creates, even when it fails.**
  - Record each id as soon as the API returns it, and archive them all in `afterAll`.
  - Remove things in dependency order: a template's copies before the template, and projects (which also deletes their plans) before the templates their plans use.
  - Archiving a template with no plans deletes it; one with plans is only unpublished.
- **Give everything a unique name** that includes the browser (`test.info().project.name`), the time and a random part. Apollo rejects a project whose title matches one the user already has.
- **Use the helpers for timing-sensitive steps:**
  - in `tests/helpers/navigation.ts`, `clickAndWaitFor`, `clickWhenHydrated` and `fillWhenHydrated`,
  - in `tests/helpers/template.ts`, `checkAria` for React Aria checkboxes and radios, and `typeInEditor` for TinyMCE editors.

  Don't write your own click retries: a retry that fires after the page has moved on can click the next page's button of the same name and skip a step.
- **Keep each spec's `*.spec.md` up to date.** Every spec file has a plain-English description of the flows it tests next to it (e.g. `template.spec.md`). Update it when you change the spec, and write one for each new spec.
- **Check for leftover data after running tests**, especially after a failed or interrupted run, and archive anything left behind.

## Running the tests

- **Run commands from `e2e/`**, for example `npx playwright test plan.spec.ts --project=chromium`. The UI, Apollo and auth services must be running.
- **Tests run one at a time** (`workers: 1`). Locally they run against the Next.js dev server, which is slow to build pages and can restart itself when it runs low on memory (see the README).
  - While working on a spec, run just that spec, in Chromium.
  - If a run fails with `net::ERR_CONNECTION_RESET` or many timeouts, check the UI container's log for "Server is approaching the used memory threshold" before changing tests.
- **Never start a test run while another one is running.** Runs share the saved sessions in `playwright/.auth/`, and the run that finishes first deletes them.
