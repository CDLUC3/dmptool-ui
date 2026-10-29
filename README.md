# dmsp_frontend_prototype app
![Next.js](https://img.shields.io/badge/Next.js-v14.2.25-blue)
![Node.js](https://img.shields.io/badge/Node.js-v22.1.0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Running the App](#running-the-app)
    - [Building for Production](#building-for-production)
    - [Docker Setup](#docker-setup)
- [Localization](#localization)
- [Checking for vulnerabilities](#scans)
- [Environment variables](#environment-variables)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Testing](#testing)
- [API Routes](#api-routes)
- [Working with GraphQL](#working-with-graphql)
- [Automated Versioning](#automated-versioning)
- [Contributing](#contributing)
- [Contributors](#contributors)
- [License](#license)

## Introduction
The dmsp_frontend_app is a web application built using NextJS React framework and TypeScript. The app serves up all the pages for the DMP Tool, and uses Apollo GraphQL Client to make requests to the backend server.

The app is a hybrid framework using both frontend and backend logic. The app includes some API endpoints for dealing with authentication - namely for creating an http-only auth cookie, and for checking auth state, and deleting the auth cookie. It also uses middleware to control access to pages based on authentication and roles.

### Graphql Queries and Mutations
This app is using graphql-codegen to generate types from graphql queries and mutations. Please place your queries in the `graphql` directory and name the file like `graphql/<name>.<query|mutation>.graphql` per the `codegen.ts` config file.
This will generate the `generated/graphql.ts` file, and you can use the generated functions or documents to make the graphql requests.

Once the schema has been added, you will need to run `npm run generate` this kicks off a script that builds out Typescript Types for the new schema and queries. The schema is dependent on the graphql server running at `dmsp_backend_prototype` in order to successfully generate.

This app was bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Features
- **App Router:** Leverages the new App Router for improved routing and page structure.
- **API Routes:** Custom API routes for handling authentication using JWT tokens.
- **Apollo Client:** Uses Apollo Client to make GraphQL requests to the backend
- **SCSS/CSS Modules:** Uses Sass along with CSS Modules for styling.
- **Unit Testing:** Uses Jest with React Testing Library
- **Accessibility Testing:** Uses jest-axe package
- **UI Components:** React Aria Components library used with custom components
- **Authentication:** Auth tokens from backend stored in cookie. Token is passed via headers in requests to backend

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) v22.1.0
- [npm](https://www.npmjs.com/) v10.9.1
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
-- Docker Desktop gives you Docker Engine, Docker CLI client, and Docker Compose

### Installation
1. Clone the repository
```bash
git clone git@github.com:CDLUC3/dmsp_frontend_prototype.git
cd dmsp_frontend_prototype
npm install
```
2. Install dependencies
```bash
npm install
```

### Localization
The app is using `next-intl` for internationalization (i18n) with prefix-based routing (i.e., a dynamic [locale] segment will be included in the path, like `/en-US/account/connections`). We will be using the four-letter locales, meaning a combination of the two-letter language code and the two-letter country code (i.e., `en-US`).

The `i18n/request.ts` loads translation files, and `i18n/routing.ts` tells `next-intl` which locales shall be supported. The list of supported locales and the default locale are defined in `config/i18nConfig.ts`.

All content to be translated will be located under the `messages` directory, with content being separated out under locales, `messages/en-US/errors.json` and files being organized by components, `messages/en-US/home.json`.

#### How the locale is determined
The middleware (`proxy.ts`) determines which locale to use for each request, using the following priority of checks:

1. **Locale in the URL** - If the path starts with a supported locale (e.g., `/pt-BR/projects`), that locale is used.
2. **Logged-in user's saved language** - The `languageId` from the user's JWT in the access token cookie (named by `ACCESS_TOKEN_NAME`).
3. **The `NEXT_LOCALE` cookie** - `next-intl` sets this to the last locale the user visited.
4. **The browser language** - The `Accept-Language` header. An exact match (e.g., `pt-BR`) is preferred, otherwise it falls back to a match on the language only (e.g., `pt`).
5. **The default locale** - From `config/i18nConfig.ts`, which is currently `en-US`.

If the URL does not already include a locale, the middleware redirects to the same path prefixed with the resolved locale (e.g., `/projects` → `/en-US/projects`), preserving any query string.

#### Preserving the locale when navigating
To keep the user in their current locale, import the navigation helpers from `@/i18n/routing` instead of from `next/link` or `next/navigation`:

```
import { Link, redirect, usePathname, useRouter, getPathname } from '@/i18n/routing';
```

These are locale-aware wrappers created by `next-intl`'s `createNavigation`, so paths should be written **without** a locale prefix and the current locale will be added automatically:

```
const router = useRouter();
router.push('/projects'); // navigates to /pt-BR/projects when the current locale is pt-BR

<Link href="/projects">{t('projects')}</Link>
```

Using `next/link` or `next/navigation`'s `useRouter` with an unprefixed path will drop the locale, causing the middleware to re-resolve it (and possibly switch the user to a different locale). To switch locales explicitly, pass the `locale` option, e.g., `router.replace(pathname, { locale: 'pt-BR' })`.

The `NextIntlClientProvider` is wrapped around the children in layout.tsx
```
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
```

This allows components to reference the content from a page, like:
```
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/routing';

export default function HomePage() {
  const t = useTranslations('HomePage');
  return (
    <div>
      <h1>{t('title')}</h1>
      <Link href="/about">{t('about')}</Link>
    </div>
  );
}
```

Additional examples of how to use the translation keys:
```
    <PageHeader title={t('title')} />
    <p>{t('content', { name })}</p>
    <p>{t('itemCount', { count: 1 })}</p>
    <p>
      {t.rich('message', {
        guidelines: (chunks) => <a href="/guidelines">{chunks}</a>
      })}
    </p>
    {t.rich('markup', {
      important: (chunks) => <b>${chunks}</b>
    })}
    <div dangerouslySetInnerHTML={{ __html: t.raw('raw') }} />
    <p>{t('general')}</p>
```
with the translation definitions looking like:
```
    "LocaleTest": {
    "title": "Localization Test",
    "content": "Hello {name}!",
    "itemCount": "{count, plural, one {You have {count} item} other {You have {count} items}}",
    "message": "Please refer to <guidelines>the guidelines</guidelines>.",
    "markup": "This is <important>important</important>",
    "raw": "&lt;script&gt;alert('Hacked!')&lt;/script&gt;",
    "general": "This is new content"
  },
```

For more documentation on what is available in `next-intl`, go to: https://next-intl-docs.vercel.app/docs/getting-started

#### Crowdin - Localization Management Platform
We have a free, open-source license with Crowdin: http://crowdin.com.

In the app, we are using the Crowdin Cli to upload content, and download translated files from the site.

You can log into the site with the `dmsp-translate` account, and navigate to `https://crowdin.com/project/dmptool` to see the source files and translations.

First you must install crowdin client: `npm install -g @crowdin/cli`

In order to upload new changes to the content, run the following scripts from package.json:
- `crowdin:upload` - to upload content changes in english
- `crowdin:download` - to download any new translations

For more documentation on Crowdin, go to:
- https://crowdin.com/
- https://crowdin.github.io/crowdin-cli/

### Scans
We provide npm scripts for different scan levels: `trivy-high` runs a blocking scan for `HIGH` and `CRITICAL` vulnerabilities, `trivy-med` runs a non-blocking scan for `MEDIUM` and `LOW` vulnerabilities, and trivy-all runs both scans in sequence. 

To help ensure code security, this project uses `Trivy` for vulnerability scanning. The pre-commit hook automatically runs `trivy-high` script to prevent commits with serious vulnerabilities, and also runs `trivy-med` to report (but not block) lower-severity issues. You need to install `trivy` locally for this to work.


### Environment Variables
For the development environment, the environment variables are stored at `.env.local`. This is set as the default env file in jest.setup.ts.
These variables must be set in order for the app to work.

* `NEXT_PUBLIC_BASE_URL` - Base url for this app (e.g., "http://localhost:3000")
* `NEXT_PUBLIC_SERVER_ENDPOINT` - Base url for backend server (e.g., "http://localhost:4000")
* `NEXT_PUBLIC_NARRATIVE_ENDPOINT` - Base url when running the narrative generator locally. The narrative generator (i.e., `dmptool-narrative-generator`) generates the plan in different formats (HTML, PDF, etc)
* `NEXT_PUBLIC_GRAPHQL_SERVER_ENDPOINT` - Graphql server schema endpoint (e.g., "http://localhost:4000/graphql")
* `NEXT_PUBLIC_AUTH_ENDPOINT` - Browser-facing base url for the auth service, `dmptool-auth` (e.g., "http://localhost:4646")
* `AUTH_ENDPOINT` - Base url for the auth service, used for server-side code. Inside Docker this can differ from the browser-facing url (e.g., "http://auth:4646")
* `TOKEN_ISSUER` - Expected issuer (`iss`) of tokens from the auth service (e.g., "http://auth:4646")
* `TOKEN_AUDIENCE` - Expected audience (`aud`) of tokens from the auth service (e.g., "dmptool-ui")
* `ACCESS_TOKEN_NAME` - Name of the access token cookie (e.g., "dmptool_access")
* `REFRESH_TOKEN_NAME` - Name of the refresh token cookie (e.g., "dmptool_refresh")
* `SSO_PENDING_TOKEN_NAME` - Name of the cookie that holds a temporary token for SSO users who don't have an account yet (e.g., "dmptool_sso_pending")
* `SERVER_ENDPOINT` - Server endpoint for backend Apollo server, used for server-side code (e.g., "http://localhost:4000")
* `SERVER_LOG_LEVEL` - The log level for the server (e.g., "info", "debug", "error")

### Running the App
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm run start
```

### Docker Setup
This project users Docker for both development and production environments. The setup is managed with `docker-compose.yml` files that build off `Dockerfile.dev` for development and `Dockerfile.prod` for production. Additionally, the project includes a `buildspec.yaml` file for AWS CodeBuild, which also references these Dockerfiles.

#### Development
1. Build and run the development Docker containers
```bash
docker-compose build
docker-compose up
```

2. To stop the docker container, run
```bash
docker-compose down
```

3. Run the following to check that your container is up
```bash
docker container ls -a
```
4. Access the site at http://localhost:3000

#### Production
1. Build and run the production Docker container
```bash
docker build -f Dockerfile.prod -t dmsp_frontend_prototype:dmsp_frontend_prod .

docker run -p 3000:3000 dmsp_frontend_prototype:dmsp_frontend_prod
```
2. Access the Next.js app at http://localhost:3000


## Project Structure
### Route Groups & Embeddable Pages
Most pages live under `app/[locale]/`, which is wrapped by `app/[locale]/layout.tsx` — this provides the shared `Header`, `SubHeader`, and `Footer`, along with the app's core providers (`NextIntlClientProvider`, `ApolloWrapper`, `AuthProvider`, `CsrfProvider`, `ToastProviderWrapper`).

Some pages need to render **without** that shared chrome — for example, the public DMP landing page at `app/(embed)/[locale]/dmps/[...slug]/page.tsx`, which is meant to be embeddable/linkable on its own (e.g. as a DOI landing page) rather than appearing as part of the main app shell.

To achieve this, we use a Next.js [route group](https://nextjs.org/docs/app/building-your-application/routing/route-groups) — the `(embed)` folder. Route group names in parentheses are not part of the URL, so `app/(embed)/[locale]/dmps/[...slug]/page.tsx` still resolves to `/{locale}/dmps/{...slug}`. Because it lives outside `app/[locale]/`, it does **not** inherit `app/[locale]/layout.tsx` or any of the providers/chrome defined there — instead, `app/(embed)/[locale]/layout.tsx` provides its own minimal layout and whichever providers that page actually needs.

When adding a new page that should bypass the shared Header/Footer, it can be added under the `app/(embed)` directory.

```bash
|-- app/
|   |-- api
|       |-- setCookie
|           |-- __tests__
|           |-- route.ts
+|   |-- (embed)
+|       |-- [locale]
+|           |-- dmps
+|               |-- [...slug]
+|                   |-- __tests__
+|                   |-- page.tsx
+|                   |-- landing.module.scss
          |-- layout.tsx
+|   |-- [locale]
+|       |-- login
+|           |-- __tests__
+|           |-- login.module.scss
+|           |-- page.tsx
+|       |-- layout.tsx
+|       |-- page.tsx
+|       |-- not-found.tsx
|-- components/
|   |-- Header
|       |-- __tests__
|       |-- header.module.scss
|       |-- index.tsx
|   |-- context
|       |-- AuthContext.tsx
|       |-- CsrfContext.tsx
|-- e2e
|   |-- tests
|       |-- login.spec.ts
|   |-- playwright.config.ts
|-- generated
|   |-- fragment-masking.ts
|   |-- gql.ts
|   |-- graphql.ts
|   |-- index.ts
|-- graphql
|   |-- mutations
|       |-- affilations.mutations.graphql
|   |-- queries
|       |-- affiliations.query.graphql
|-- lib
|   |-- graphql
|       |-- apollo-wrapper.tsx
|       |-- client.ts
|       |-- apolloClient.ts
|       |-- graphqlHelper.ts
|       |-- errorTypePolicies.ts
|   |-- server
|       |-- auth.ts
|-- public
|   |-- images
|       |-- dmptool_logo_u166.svg
|-- styles
|   |-- globals.scss
|   |-- elements.scss
|-- utils
|   |-- logger.ts
|   |-- authHelper.ts
|   |-- authLink.ts
|   |-- errorHandler.ts
|-- buildspec.yaml
|-- codegen.ts
|-- docker-compose.yml
|-- DockerFile.dev
|-- Dockerfile.prod
|-- middleware.ts
|-- next.config.mjs
|-- package.json
|-- tsconfig.json
```


## Authentication
There are currently two context files, AuthContext.tsx and CsrfContext.tsx, that help manage the auth state and the csrf token state.

All forms submitted to the backend need to include the CSRF token in the header of the request. GraphQL queries have inherent handling of csrf protection as long as we remember to include the `CONTENT-TYPE` as `application/json`in the header, which is currently added by the `utils/authLink` used in the apollo client instance.

The endpoint to refresh the csrf token is called when getting a 403 returned from the backend server.

## Testing
When new components or functions are added, corresponding unit tests should ideally be added. We want to shoot for above 70% coverage. React components are tested using jest and React Testing Library.

Unit tests should generally be placed in a `__tests__` folder adjacent to the component or file being tested.

End-to-end tests are written with [Playwright](https://playwright.dev) and live in the `e2e/` directory. `e2e/` is a separate npm package with its own `package.json`, `package-lock.json`, `playwright.config.ts` and `tsconfig.json`, so Playwright doesn't get installed with the app. It is ignored by Jest, ESLint, the root `tsconfig.json` and the Docker image.

### Setting up Playwright
The tests run against real services, so start the UI (`npm run dev`), `dmptool-apollo-server` and `dmptool-auth` locally first, with the local seed data loaded.

Start the container with `docker-compose up`, copy `.env.example` to `.env`, and run `npm run test:e2e`. The packages and browsers are then installed automatically, and the manual commands are only needed when running without Docker. 
 
 Manual commands:
```bash
cd e2e
npm ci                   # install @playwright/test
npx playwright install   # download the browsers (repeat after upgrading Playwright). This is run once per machine, then again only when Playwright's version changes. Browsers go into a shared cache, which on macOS is ~/Library/Caches/ms-playwright.
cp .env.example .env     # then check the test account emails and passwords
```

`.env` is git-ignored. It holds the emails and passwords of the test accounts the tests log in as.

### Test accounts
The tests log in as two dedicated test accounts, which belong to the "Test Organization" affiliation (`https://dmptool.org/affiliations/532910`). They are created by the `2026-10-28-1224-add-test-users-for-playwright.sql` migration in `dmptool-apollo-server`.

| Role | Email | Used for |
| --- | --- | --- |
| `RESEARCHER` | `testresearcher@example.com` | Login, logout and researcher pages |
| `ADMIN` | `testadmin@example.com` | Admin pages, such as organization templates |

- **Never use a `SUPERADMIN` account in the tests.** A super admin can see and change data across every organization, so a test bug or a leaked session could affect data far beyond the test organization. Super admins can also see pages and data that admins can't, so tests run as one could pass even when the admin permission checks are broken.
- **Tests clean up after themselves.** A test that creates data (for example a template) deletes or archives it when it finishes, so runs don't build up data in the test organization.
- **Adding a role:** add it to `ROLES` in `tests/helpers/roles.ts` and add `E2E_<ROLE>_EMAIL` and `E2E_<ROLE>_PASSWORD` to `.env.example`.

### Running Playwright tests
From the repository root:

| Task | Command |
| --- | --- |
| Run all tests in Chromium, Firefox and WebKit | `npm run test:e2e` |
| Open the Playwright UI | `npm run test:e2e:ui` |

From `e2e/`:

| Task | Command |
| --- | --- |
| Run all browsers | `npx playwright test` |
| Run Chromium only | `npx playwright test --project=chromium` |
| Run headed in Chromium | `npm run test:headed` |
| Open the latest HTML report | `npx playwright show-report` |

Before the browser projects run, the `setup` project (`tests/auth.setup.ts`) logs in once per role and saves each session to `e2e/playwright/.auth/`. A spec can start logged in with `test.use(asRole('admin'))`, or logged out with `test.use(loggedOut)` (see `tests/helpers/roles.ts`).

Reports are written to `e2e/playwright-report/` and `e2e/test-results/`. Both are git-ignored.

### Handling traces, reports and saved sessions
Playwright traces record each action, the text typed with `fill()`, network requests (including session cookies), and page snapshots. The HTML report embeds the traces, so treat reports, traces and saved sessions as sensitive.

- **Passwords are never traced.** The `setup` project and the specs that log in (`login.spec.ts`, `logout.spec.ts`) turn tracing off. A new spec that types a password must add `test.use(NO_TRACE)` from `tests/helpers/login.ts`. Don't pass `--trace on` on the command line, because it overrides these settings.
- **Saved sessions only last for the run.** `playwright/.auth/*.json` holds login cookies. It is git-ignored, and the `cleanup` project (`tests/auth.teardown.ts`) deletes it after each run.
- **Never upload `playwright/`.** When CI is added, upload only `playwright-report/` and `test-results/`, to a private S3 bucket with a short retention period and access limited to the team.
- **Share links, not files.** Don't attach traces or reports to Slack messages or GitHub issues. Link to their S3 location instead.

### Playwright documentation
https://playwright.dev/docs/writing-tests

## API Routes
* `GET /api/check-auth`: returns whether user is authenticated based on presence of auth token in cookie

## Working with GraphQL
This application makes [GraphQL](https://graphql.org) calls to an [Apollo Server](https://www.apollographql.com/docs/apollo-server) backend, which provides access to data and handles authentication and authorization.

For more information about the Apollo Server backend, see [its Github repo](https://github.com/CDLUC3/dmsp_backend_prototype).

GraphQL schemas are managed in the Apollo Server backend and in the `graphql` directory of this project. This directory contains all queries and mutations used by the application to interact with backend data.

When you add or update GraphQL files in the `graphql` directory (or when the backend schema changes), run `npm run generate` to regenerate the client code. With the [`@graphql-codegen/client-preset`](https://the-guild.dev/graphql/codegen/plugins/presets/preset-client) approach, this process generates several files in the `generated` directory:

- `gql.ts`: Exports the `gql` tag for defining GraphQL operations, which is used to write queries and mutations in a type-safe way.
- `graphql.ts`: Contains all generated document nodes (typed GraphQL documents) for queries, mutations, and fragments. These are used with Apollo Client hooks and methods.
- `fragment-masking.ts`: Provides utilities for fragment masking, which helps ensure that only the fields selected in a fragment are accessible in your code. This improves type safety when working with GraphQL fragments.
- `index.ts`: Re-exports the main generated modules for convenience, so you can import from a single entry point.

This app is currently using only the `graphql.ts` generated file by using the GraphQL Documents generated, wrapping them in `useQuery` and `useMutation` hooks from Apollo v4.

```ts
import { useAddAffiliationMutation } from '../generated/hooks';
// or
import { AddAffiliationDocument } from '../generated/graphql';
```

We use the `@apollo/client` package to manage the connection with Apollo Server. The client setup is in `lib/graphql/apollo-wrapper.tsx` and is configured for client-side usage.

The `lib/graphql/graphqlHelper.ts` file provides logic for handling retries and processing GraphQL errors from Apollo Server.

## Automated Versioning
This project uses GitHub Actions to automatically manage version bumping and changelog updates whenever a pull request is merged from `development` into `stage`.

### How It Works
Two workflows handle versioning:
1. Validate Version Label - Runs on every PR opened or updated against `stage`. If there is a version label applied, it will use that to determine the new version. If no label is applied, it will automatically do a `patch` version update.
2. Automated Versioning - Runs when a PR is merged into `stage`. It reads the version label, bumps `package.json` using `npm version`, prepends a new section to `CHANGELOG.md`, commits both files, and pushes a Git tag. The command and tag are pushed directly to the `stage` branch by `github-actions`.

### PR Labels
When opening a PR from `development` to `stage`, you can apply one of the following labels. Labels can be found in the "Labels" dropdown on the PR page's right sidebar.

| Label         | When to use                                                             |
|---------------|-------------------------------------------------------------------------|
| version:major | Breaking changes or significant new features (e.g., 1.0.0 -> 2.0.0)     |
| version:minor | New backwards-compatible functionality (e.g., 1.0.0 -> 1.1.0)           |
| version:patch | Bug fixes and minor backwards-compatible changes (e.g., 1.0.0 -> 1.0.1) |

## Contributing
1. Clone the repo from github (`git clone git@github.com:CDLUC3/dmsp_frontend_prototype.git`)
2. Create a new branch prefixing branch with `bug` or `feature` based on type of update (`git checkout -b feature/your-feature`)
3. Add your changes and add commit message (`git add .`; `git commit -m "added new feature`)
    - A pre-commit is run with the `commit` which checks to make sure linting and coverage pass before a commit goes through
4. Push to the branch (`git push --set-upstream origin feature/your-feature`)
5. Open a Pull Request in github

## Contributors
- [Juliet Shin](https://github.com/jupiter007)
- [Brian Riley](https://github.com/briri)
- [Andre Engelbrecht](https://github.com/andrewebdev)
- [Fraser Clark](https://github.com/fraserclark)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) for for details.
