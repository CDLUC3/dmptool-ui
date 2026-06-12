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
The app is using `next-intl` for internationalization (i18n) with prefix-based routing (i.e., a dynamic [locale] segment will be included in the path, like `/en-US/account/connectsion`). We will be using the four-letter locales, meaning a combination of the two-letter language code and the two-letter country code(i.e., `en_US`).

The `i18n/request.js` loads translation files, and `i18n/routing.js` tells `next-intl` which locales shall be supported.

All content to be translated will be located under the `messages` directory, with content being separated out under locales, `messages/en-US/errors.json` and files being organized by components, `messages/en-US/home.json`.

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
* `JWT_SECRET` - Secret key for JWT authentication
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
```bash
|-- app/
|   |-- api
|       |-- setCookie
|           |-- __tests__
|           |-- s3Uploader.ts
|   |-- login
|       |-- __tests__
|       |-- login.module.scss
|       |-- page.tsx
|   |-- layout.tsx
|   |-- page.tsx
|   |-- not-found.tsx
|-- components/
|   |-- Header
|       |-- __tests__
|       |-- header.module.scss
|       |-- index.tsx
|   |-- context
|       |-- AuthContext.tsx
|       |-- CsrfContext.tsx
|-- cypress
|   |-- e2e
|       |-- spec.cy.ts
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

Functional tests are conducted using Cypress. These tests can be run in headless mode using the command `npm run cypress:run` or in headed mode is `npm run cypress:open`. Functional tests should be placed in the `cypress` directory. `e2e` tests will be placed in the `cypress/e2e` directory.

### Cypress configuration
In order to prevent `cypress` tests from clashing with `jest` tests, two different tsconfig files were created: one for cypress - `tsconfig.cypress.json` and one for jest - `tsconfig.json`. We specifically excluded `cypress` from the `tsconfig.json` file.

Also, there is a very simple `cypress.config.ts` file that we need to add.

### Running cypress tests
`cypress` can be opened using the `cypress:open` script in `package.json`. This will open cypress in your browser, and allow you to navigate to your test and run it.

You can use the `cypress:run` script to run your tests in headless mode in the terminal window.

By default, Cypress looks for tests in `cypress/e2e` directory. tests are run from the `cypress/e2e` directory. You can customize this and add your own test directories by updating the `cypress.config.ts` file:
```
export default defineConfig({
  e2e: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    specPattern: 'tests/**/*.cy.{js,jsx,ts,tsx}', // Custom directory
    setupNodeEvents(on, config) {
      return config;
    },
  },
  // ... rest of config
});
```

### Cypress documentation
`cypress` provides good documentation at: https://docs.cypress.io/app/end-to-end-testing/writing-your-first-end-to-end-test

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
