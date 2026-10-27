# AGENTS.md — dmptool-ui

You are a senior frontend engineer working on the **DMP Tool UI**, a Next.js 16 (App Router) app written in TypeScript 6 and React 19. It renders every page of the DMP Tool and talks to the `dmptool-apollo-server` GraphQL backend through Apollo Client 4. It also talks directly to `dmptool-auth` for authentication and `dmptool-narrative-generator` for downloads.

These rules apply to every change in this repo.

## Commands

Node **22** (see `.nvmrc`) and **npm**. Don't use yarn or pnpm, and don't create another lockfile.

| Task | Command |
| --- | --- |
| Install deps | `npm ci` |
| Dev server (http://localhost:3000) | `npm run dev` |
| Lint | `npm run lint` |
| Type-check | `npm run type-check` |
| Unit tests + coverage | `npm test` |
| Run a single test file | `npx jest path/to/__tests__/file.spec.tsx --coverage=false` |
| Regenerate GraphQL types | `npm run generate` (needs the backend at `NEXT_PUBLIC_GRAPHQL_SERVER_ENDPOINT`) |
| Production build | `npm run build` |
| E2E tests (headless) | `npm run cypress:run` (needs the app running) |
| Vulnerability scan | `npm run trivy-high` (blocking), `npm run trivy-med` (report only) |

## Boundaries

**Never:**
- Edit anything in `generated/`. Change the `.graphql` files and run `npm run generate` instead.
- Edit `public/tinymce/` by hand. It's a committed copy of the TinyMCE editor (currently 7.8.0) that the browser loads from `/tinymce/tinymce.min.js`. The `tinymce` npm package only provides types, so bumping it doesn't upgrade the editor. To upgrade, replace the whole folder with the build from `node_modules/tinymce`, and only when asked.
- Commit secrets, tokens, or `.env*.local` / `.env*.production` files. If you add an env var, put it in `.env.example`, and mention in the PR that `buildspec.yaml` and `Dockerfile.prod` need it too.
- Lower the Jest `coverageThreshold` in `jest.config.ts`, add coverage ignores to hide untested code, or skip or delete tests so a run passes.
- Skip the husky pre-commit hook (`--no-verify`).
- Hand-edit the version in `package.json`, or add a new `## vX.Y.Z` heading to `CHANGELOG.md`. CI does both.
- Run Prettier or a formatter on files you didn't change.

**Ask first:**
- Before adding, removing, or upgrading a dependency. Pin exact versions with `npm install --save-exact <package>@<version>`, because plain `npm install <package>` adds a `^`. `package-lock.json` changes only as a result of `npm install`; never edit it by hand.
- Before changing `proxy.ts`, auth or CSRF code (`context/AuthContext.tsx`, `context/CsrfContext.tsx`, `utils/authHelper.ts`, `utils/authLink.ts`, `utils/server/serverAuthHelper.ts`, `lib/server/auth.ts`, `app/api/`), `next.config.mjs`, Dockerfiles, `buildspec.yaml`, or `.github/workflows/`.

## Code style

`.prettierrc` and `eslint.config.js` are the source of truth for formatting and lint rules. These conventions aren't enforced by tooling:

- Next.js middleware lives in `proxy.ts`, not `middleware.ts`.
- Log with `logECS` from `@/utils/index`. Don't leave `console.log` in committed code.
- Import through the `@/` alias (`@/components/...`, `@/utils/...`), not long relative paths.
- Navigate with the locale-aware helpers from `@/i18n/routing` (`Link`, `useRouter`, `redirect`, `usePathname`), **never** with the versions from `next/link` or `next/navigation`, which drop the locale. `useParams`, `useSearchParams`, and `notFound` from `next/navigation` are fine. Build paths with `routePath()` from `@/utils/routes`.
- Every user-facing string comes from `useTranslations()`. Don't hard-code English in JSX.
- Use the generated `*Document` types with Apollo hooks. Don't write inline `gql` strings.
- Render user or HTML content with `components/SafeHtml` or the helpers in `utils/sanitize.tsx`, never with raw `dangerouslySetInnerHTML`.

```tsx
'use client'

import { useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";

// GraphQL
import { MeDocument } from "@/generated/graphql";

// Components
import PageHeader from "@/components/PageHeader";

// Utils and other
import { useRouter } from "@/i18n/routing";
import { routePath } from "@/utils/index";
import styles from "./example.module.scss";

const ExamplePage: React.FC = () => {
  const t = useTranslations("ExamplePage");
  const Global = useTranslations("Global");
  const router = useRouter();
  const { data } = useQuery(MeDocument);

  return (
    <div className={styles.wrapper}>
      <PageHeader title={t("title", { name: data?.me?.givenName })} />
      <Button onPress={() => router.push(routePath("projects.index"))}>
        {Global("buttons.next")}
      </Button>
    </div>
  );
};

export default ExamplePage;
```

## Pages, routes, and data fetching (`app/`)

- `app/[locale]/` holds the main app, wrapped by the shared header, footer, and providers. Its pages **require login**, except the public auth and info pages (`login`, `signup`, `contact`, `email`, `styleguide`).
- `app/(embed)/[locale]/` exists only for the **public DMP landing page** (`(embed)/[locale]/dmps/[...slug]`), which renders with no header or footer and doesn't require login. The route group doesn't appear in the URL. Don't put other pages here unless asked.
- The folder doesn't decide whether a page needs login; `proxy.ts` does. Paths listed in `excludedPaths` skip authentication, and everything else redirects to `/login`. A new public page needs an `excludedPaths` entry, and that change needs approval (see Boundaries).
- To add a page:
  1. Create `app/[locale]/<path>/page.tsx` with a colocated `<name>.module.scss` and `__tests__/page.spec.tsx`.
  2. Register the route in `utils/routes.ts` and link to it with `routePath()`.
  3. Follow the existing dynamic segment names (`[projectId]`, `[dmpid]`, `[templateId]`).
- **Don't add new server actions.** We're moving away from them: since the Apollo Client v4 upgrade, they cause warnings that the server-side state is out of sync with the client. Send GraphQL requests from the client with `useQuery` / `useMutation` from `@apollo/client/react` and the generated `*Document`.
  - The existing actions are legacy: those in `app/actions/` and in the `actions/` folders next to pages and components (e.g. `projects/[projectId]/collaboration/actions/`). If your task changes code that calls one, switch that call to a client-side `useMutation` and mention it in the PR. Don't migrate unrelated actions in the same PR.

## Components (`components/`)

- Give each component its own PascalCase folder containing `index.tsx` (a default export plus exported prop types), `<Name>.module.scss`, and `__tests__/index.spec.tsx`.
- Search for an existing component before writing a new one. Form controls are in `components/Form` (`FormInput`, `FormSelect`, `FormTextArea`, `CheckboxGroup`, `TransitionLink`, …), and layout is in `components/Container` (`ContentContainer`, `LayoutWithPanel`, `SidebarPanel`). Other shared pieces include `Modal`, `ErrorMessages`, `PageHeader`, `Loading`, `SkeletonListLoading`, and `SafeHtml`.
- Build interactive elements on React Aria Components so keyboard and screen-reader support come for free. Don't make clickable `div`s. If a React Aria element takes an `href`, wrap it in `AriaRouterProvider` so links keep the locale.
- If clicking a link or button can be slow (it navigates to another page, saves, or searches), use `TransitionLink` or `TransitionButton` from `@/components/Form`. They show the top progress bar and a busy state, and they block repeat clicks. `TransitionLink` is a drop-in replacement for `Link`. `TransitionButton`'s `onPress` is async and receives `startTransition`; call `router.push` inside it so the busy state lasts until the new page loads:

  ```tsx
  <TransitionButton
    onPress={async ({ startTransition }) => {
      await saveProject();
      startTransition(() => {
        router.push(routePath("projects.show", { projectId }));
      });
    }}
    loadingLabel={Global("buttons.saving")}
  >
    {Global("buttons.save")}
  </TransitionButton>
  ```
- Use the tokens in `styles/variables.scss` instead of literal spacing, color, or breakpoint values.
- Update the demo in `app/[locale]/styleguide/` when a shared component's API or appearance changes.
- `components/PlanAuthoring/` is a self-contained module with its own model (`model.ts`), data source (`planAuthoringDataSource.ts`), and mocks. Extend those rather than calling Apollo from its subcomponents.

## GraphQL (`graphql/`)

- The schema lives in the backend (`dmptool-apollo-server`). This folder holds only the operations the UI sends. Don't invent fields: if one is missing, the backend has to change first.
- Put files in `queries/<domain>.query.graphql` or `mutations/<domain>.mutation.graphql`. Add new operations to the existing domain file when there is one.
- Name operations in PascalCase with a verb (`AddAffiliation`). Codegen turns that into `AddAffiliationDocument`.
- Mutations should select the `errors { ... }` object so the UI can show field-level errors.
- After any change, run `npm run generate` and commit the regenerated `generated/` files with the `.graphql` change. Then run `npm run type-check`, because schema changes often break callers.

## Keeping data fresh (Apollo cache)

The cache is the `InMemoryCache` in `lib/graphql/apollo-wrapper.tsx`. Queries default to `cache-first`, and objects are normalized by `__typename` + `id`. After a mutation, Apollo updates only the cached objects the mutation returns (matched by `id`) and only the fields it selects. Use the lightest option that works:

1. **Edited an existing object:** have the mutation return the object's `id` and every field the screens display. The cache then updates on its own.
2. **Created or deleted something, or changed a list, count, or status shown elsewhere:** pass `refetchQueries: [SomeListDocument]` to `useMutation`. Add `awaitRefetchQueries: true` if you navigate away right after.
3. **A page must show the latest data on every visit** (for example data edited on another page or by another user): use `fetchPolicy: "cache-and-network"`. Use `"network-only"` only when showing stale data even briefly would be wrong.

Don't add `fetchPolicy: "network-only"` everywhere as a fix for stale data. Server actions write on the server and bypass the client cache, so stale data after a server-action call is expected. Converting the call to `useMutation` is the fix.

**Cache warnings** ("Cache data may be lost when replacing the … field"): fix them with a type policy, not a fetch policy.
- Add the type to `TYPES_WITH_ERRORS`, or its list field to `EXTRA_FIELDS`, in `lib/graphql/errorTypePolicies.ts`. That makes `errors` and the listed fields replace instead of merge.
- Lists that the server always returns complete get `merge: false`, as in `displayLogicTypePolicies.ts`.
- Types whose `id` isn't globally unique get `keyFields: false`, as in `guidanceTypePolicies.ts`.

## Error handling

Errors reach the UI in two ways, and you have to handle both:

- **Thrown errors** (network failures and top-level GraphQL errors) come out of `useQuery`'s `error` or a `try/catch` around a mutation. Pass them to `handleApolloError(err, "Component.action")` from `@/utils/index`. It logs the error and ignores aborted requests: if `wasRealError` is `false`, do nothing. `handleApolloErrors` and `handleGraphQLErrors` in `utils/gqlErrorHandler.ts` are unused legacy code, so don't copy them.
- **Validation errors in the response** come back as data, not as exceptions. Mutations return an `errors` object (e.g. `data.updateProject.errors`), so check it after every mutation even when nothing was thrown.

Where to show each kind of error:

| Kind | Show it with |
| --- | --- |
| Errors that block the page or form (`errors.general`, failed loads, failed saves) | Collect them in `useState<string[]>` and render them with `<ErrorMessages errors={errors} ref={errorRef} />` at the top of the page. It scrolls into view on its own |
| A specific field (`errors.title`, etc.) | Pass `isInvalid` and `errorMessage` to the `components/Form` control (`FormInput`, `FormTextArea`, `FormSelect`). For plain React Aria fields, use `<FieldError>` |
| Short, non-blocking feedback (saved, info, a warning, a failed background action) | `const toastState = useToast()` from `@/context/ToastContext`, then `toastState.add(t("…"), { type: "success" })`. Types are `success`, `info`, `warn`, and `error` |

Show translated messages (`t("messages.errors.…")`), not raw backend or exception text, unless the backend message is meant for users (e.g. `errors.general`).

## Auth

- Tokens are issued by the separate `dmptool-auth` service (RS256). This app only verifies them, using the auth service's JWKS keys (`lib/server/auth.ts`). Never sign tokens here or add a shared JWT secret.
- Tokens are in http-only cookies, so client code can't read them. Get auth state from `useAuthContext()` or `/api/check-auth`.
- Role checks in the UI (e.g. `useIsOrgAdmin`) only control what's shown. Permissions must be enforced by the backend.
- **GraphQL requests handle token refresh and CSRF automatically.** The `errorLink` in `lib/graphql/graphqlHelper.ts` refreshes the access token and retries on `UNAUTHENTICATED` or a 401, and gets a new CSRF token and retries on `Invalid CSRF token`. Don't add your own refresh or CSRF handling around `useQuery` / `useMutation`.
- **Direct `fetch()` calls to the auth service don't get that for you.** These are calls to `NEXT_PUBLIC_AUTH_ENDPOINT`, like password changes, SSO, and sign-out. Get a token with `getCsrfToken()` from `useCsrf()` and send it as the `X-CSRF-TOKEN` header with `credentials: "include"`. CSRF tokens are single-use, so on a 403, retry once with a fresh token. Copy the pattern in `app/[locale]/account/update-password/page.tsx`.

## Translations (`messages/`)

- `messages/en-US/` is the source of truth. Whenever you add or change an en-US string, add or update the Brazilian Portuguese translation in `messages/pt-BR/` in the same change, under the same key path. Don't leave English text in pt-BR. Note in the PR which pt-BR strings you translated, so a reviewer can check them.
- Top-level keys are PascalCase namespaces (`useTranslations("Namespace")`), and nested keys are camelCase. Reuse common labels from `Global` (`Global.buttons.*`, `Global.breadcrumbs.*`) before adding duplicates.
- A new JSON file must be imported and merged in `i18n/request.ts`, or its keys won't load.
- Use ICU syntax: `"Hello {name}!"`, `"{count, plural, one {# item} other {# items}}"`, and `"Read <link>the guidelines</link>."` with `t.rich`.
- Don't reorder existing keys. Reordering creates noisy diffs.

## Testing and verification

Before you call a task done, run these and make sure they pass (they're the same checks as `.husky/pre-commit`):

```bash
npm run lint
npm run type-check
npm test            # fails if coverage drops below the thresholds in jest.config.ts
```

- Put unit tests in a `__tests__/` folder next to the code, named `*.spec.tsx` or `*.spec.ts`.
- Every new component or page needs tests, including a `jest-axe` accessibility check:
  ```tsx
  import { axe, toHaveNoViolations } from "jest-axe";
  expect.extend(toHaveNoViolations);

  it("should pass axe accessibility test", async () => {
    const { container } = render(<MyComponent />);
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
  ```
- Mock `@/i18n/routing` and the Apollo hooks with `jest.mock`. Legacy server actions are mocked by path (e.g. `jest.mock("@/app/actions/upsertRelatedWorkAction", ...)`). If a component needs the auth, CSRF, intl, or toast providers, render it with `utils/test-utils.tsx`.
- If `npm run trivy-high` can't run because Trivy isn't installed locally, say so. Don't treat it as passed.

## Accessibility tests
- Use react aria or existing components using react-aria
- One <h1> per page, no skipped heading levels.
- Every server-side page sets a unique, translated title via generateMetadata, and every client-side page sets a page title using <PageHeader /> or <PageHeaderWithTitleChange />
- Every input has a visible label. Placeholder text is not a label.
- Images need translated alt; decorative images use alt="".
- Never convey meaning by colour alone. Use colour tokens, which are contrast-checked; don't use ad-hoc hex values.
- After async actions (save, search, filter), announce the result with a toast or an aria-live region.
- Respect prefers-reduced-motion for any animation.
- Don't add ARIA roles to elements React Aria Components already handles.

## Proof of Work
Never claim something works without evidence. "Should work", "looks correct" and "tests pass" without output are not acceptable.

- When you finish a task, end with a Verification block:

-- Each command you ran, its exit code, and the last lines of its output (lint, type-check, test, plus any single test file).
-- For bug fixes: the test you wrote that failed before the fix and passes after. Show both runs.
-- For UI changes: the route you checked and what you observed, including keyboard behaviour.
-- Anything you could not run or verify, listed explicitly as NOT VERIFIED, with the reason.
-- If a check fails, report the failure. Don't summarize around it.

## Dependencies & external repositories

This app depends on services and shared packages in other CDLUC3 repos. When you need to check or verify an integration, read the source in those repos instead of guessing.

**Use the local checkout first.** If the repo is checked out next to this one (e.g. `../dmptool-auth`), read the files in that working tree as they are, on whatever branch is checked out there, including uncommitted changes. That's usually the backend work paired with this UI change. Don't switch branches, pull, stash, or edit anything there. Run `git -C ../<repo> branch --show-current` and name the branch you checked in your summary.

* **GraphQL API:** [dmptool-apollo-server](https://github.com/CDLUC3/dmptool-apollo-server)
  * Read it to check the schema, resolvers, field names, nullability, and the shape of the `errors` object a mutation returns, or to confirm a field exists before adding it to a `.graphql` operation.
* **Authentication service:** [dmptool-auth](https://github.com/CDLUC3/dmptool-auth)
  * Read it to check the access, refresh, and pending SSO token structures and claims, the cookie names, the JWKS endpoint, CSRF handling, and the sign-in, sign-out, refresh, password, and SSO workflows behind `NEXT_PUBLIC_AUTH_ENDPOINT`.
* **Narrative generator:** [dmptool-narrative-generator](https://github.com/CDLUC3/dmptool-narrative-generator)
  * Read it to check the request parameters, supported output formats, and responses used by the plan download (`app/api/download-narrative/route.ts`, `NEXT_PUBLIC_NARRATIVE_ENDPOINT`, `NARRATIVE_SERVICE_URL`).
* **Shared types:** [dmptool-types](https://github.com/CDLUC3/dmptool-types)
  * Published to npm as `@dmptool/types`. It holds the TypeScript types, Zod schemas, and JSON schemas for DMP templates and maDMP records: every question type (`QuestionFormatsEnum`, `AnyQuestion`, `BooleanQuestionSchema`, …), its matching answer type, and `CURRENT_SCHEMA_VERSION`. The UI uses them to build, render, and validate questions and answers.


## Git and PR workflow

- **Branches:** `feature/<issue#>/<INITIALS>-short-description` or `bug/<issue#>/<INITIALS>-short-description`, cut from `development`.
- **Flow:** feature/bug → `development` → `stage` → `main`. Open feature PRs against **`development`**, never against `stage` or `main`.
- **Commits:** short, lowercase, past-tense summaries that match the history ("added retry logic for CSRF errors", "fixed linting error"). Keep each commit focused on one change.
- **CHANGELOG:** every PR adds a line under the right heading (`Added`, `Updated`, `Fixed`, `Removed`, `Chore`) at the top of `CHANGELOG.md`, ending with the issue number, e.g. `[#366]`.
- **PR description:** fill in `.github/PULL_REQUEST_TEMPLATE.md`: description with `Fixes #<issue>`, type of change, how it was tested, and the checklist (including accessibility testing).
