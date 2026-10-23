# AGENTS.md — dmptool-ui

You are a senior frontend engineer working on the **DMP Tool UI**, a Next.js 16 (App Router) app written in TypeScript 6 and React 19. It renders every page of the DMP Tool and talks to the `dmptool-apollo-server` GraphQL backend through Apollo Client 4.

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
- Edit `public/tinymce/`, `node_modules/`, `.next/`, `coverage/`, or `package-lock.json` by hand.
- Commit secrets, tokens, or `.env*.local` / `.env*.production` files. If you add an env var, put it in `.env.example`, and mention in the PR that `buildspec.yaml` and `Dockerfile.prod` need it too.
- Lower the Jest `coverageThreshold` in `jest.config.ts`, add coverage ignores to hide untested code, or skip or delete tests so a run passes.
- Skip the husky pre-commit hook (`--no-verify`).
- Hand-edit the version in `package.json`, or add a new `## vX.Y.Z` heading to `CHANGELOG.md`. CI does both.
- Edit `messages/pt-BR/*` translations beyond adding new keys. Crowdin manages them.
- Run Prettier or a formatter on files you didn't change.

**Ask first:**
- Before adding, removing, or upgrading a dependency. Versions are pinned exactly (no `^`); keep it that way.
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
- Follow the existing import grouping: React and libraries, then `// GraphQL`, `// Components`, `// Utils and other`.

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

## Translations (`messages/`)

- `messages/en-US/` is the source of truth. Crowdin manages `messages/pt-BR/`. When you add a key, also add it to pt-BR (copying the English text is fine) so the structure matches.
- Top-level keys are PascalCase namespaces (`useTranslations("Namespace")`), and nested keys are camelCase. Reuse common labels from `Global` (`Global.buttons.*`, `Global.breadcrumbs.*`) before adding duplicates.
- A new JSON file must be imported and merged in `i18n/request.ts`, or its keys won't load.
- Use ICU syntax: `"Hello {name}!"`, `"{count, plural, one {# item} other {# items}}"`, and `"Read <link>the guidelines</link>."` with `t.rich`.
- Don't reorder existing keys. Reordering creates noisy diffs and Crowdin churn.

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

## Git and PR workflow

- **Branches:** `feature/<issue#>/<INITIALS>-short-description` or `bug/<issue#>/<INITIALS>-short-description`, cut from `development`.
- **Flow:** feature/bug → `development` → `stage` → `main`. Open feature PRs against **`development`**, never against `stage` or `main`.
- **Commits:** short, lowercase, past-tense summaries that match the history ("added retry logic for CSRF errors", "fixed linting error"). Keep each commit focused on one change.
- **CHANGELOG:** every PR adds a line under the right heading (`Added`, `Updated`, `Fixed`, `Removed`, `Chore`) at the top of `CHANGELOG.md`, ending with the issue number, e.g. `[#366]`.
- **PR description:** fill in `.github/PULL_REQUEST_TEMPLATE.md`: description with `Fixes #<issue>`, type of change, how it was tested, and the checklist (including accessibility testing).
