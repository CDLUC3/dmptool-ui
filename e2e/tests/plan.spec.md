# Plan tests (`plan.spec.ts`)

These tests follow a researcher creating a project and writing a plan for it: the different ways through the "Create project" steps, then creating a plan from a template, answering its questions, and updating it from the project page.

## How the tests are organized

- **Logged in as the test researcher.** The tests start from the researcher session saved by the login setup, so they never type a password. The account is the `RESEARCHER` test account described in the README.
- **Their own template.** Before the plan tests start, the test admin creates and publishes a small template through Apollo in the researcher's organization: one section and three questions (a Text Area with sample text, Radio Buttons and a Text Field). The tests don't use the templates from `template.spec.ts`, which may run before, after or alongside these tests and removes its templates when it finishes.
- **Unique names.** Every project and template name includes the browser and a timestamp, so runs in different browsers never touch each other's data.
- **Nothing is left behind.** When the tests finish, even after a failure, every project they created is archived through Apollo, which also deletes its plans. Then the template is archived, which deletes it once it has no plans.
**Two groups**. The "Creating a project" tests are independent of each other, so they can run in any order, or at the same time when you pass `--workers`. (By default the tests run one at a time; see the README, with `worker=1`.) The plan tests build on each other (one project, one plan), so they always run in order, and if one fails, the rest are skipped.

## Creating a project

Each test starts on the **Projects and Plans Dashboard** (`/projects`), clicks **Create project**, enters a unique title, and chooses Mock or Real. Clicking **Next** creates the project and opens the **Add funder** step. Most tests then fill in **Project Details** (abstract, start and end dates, and the "Social Sciences" research domain) and finish on the "You've created a project" page, which names the project and its funder.

After each one, the test checks what was saved through Apollo.

### 1. A mock project with no funder

The researcher chooses **Mock project**, ticks **I don't have a funder**, and goes straight to Project Details. Apollo has the project marked as a test project, with no funding, and with the researcher as its primary contact.

### 2. A real project that already applied to NIH, with the project added manually

The researcher searches the funders for "NIH" and selects **National Institutes of Health (nih.gov)**. On **Funding status** they choose **Already applied**. NIH has an award database, so this opens **Search for projects**, where they choose **Add project manually**.

On **Add funding details**, the funder is shown as NIH, and they enter a grant number, a project number and an opportunity number. Apollo saves all three. The status is saved as "planned", because Apollo has no "applied" status yet.

### 3. A real project already funded by NIH

As in flow 2, but with **Already funded**. The funding is saved as "granted".

### 4. A real project with its funder added manually

After a funder search, the researcher clicks **Add funder manually**. On the **Add Funding Details** form they type "National Science" and pick **National Science Foundation (nsf.gov)** from the suggestions, then enter a grant number and save. The test picks an existing funder because typing a new name would create a new organization, which the tests can't remove afterwards.

### 5. Back returns to the previous step

- From the first step, **Back** returns to the dashboard.
- The **Add funder** step has no Back button, because going back would create the project a second time.
- **Back** on Search for projects returns to Funding status, Back on Add funding details returns to Search for projects, and Back on Project Details returns to Add funding details.
- Between these checks the test moves forward with the browser's history, because the steps' Next buttons would save each step again.

## Writing a plan

### 6. Creating the project

The researcher creates a real project with NIH and keeps the default **Planning to apply**, which goes straight to Project Details. From the finish page they open **Project overview**, which shows the title, the start and end dates, and "1 funding source" (NIH).

The overview doesn't show the abstract or research domain, so the test opens **Edit project details** to check the abstract, and checks the dates and research domain through Apollo. The page doesn't show the saved research domain; see "Known issues" below.

### 7. Creating the plan

From the project overview the researcher clicks **Create new plan**. The "Select a DMP template" page is filtered to the project's funder (NIH) and the researcher's organization. They search for the test template and select it.

The plan opens with:
- the project's title as its heading, and "This plan is based on the "‹template›" template",
- NIH as its funding, and the researcher as a plan member,
- the template's section, and "0 of 3 questions answered".

### 8. Answering the questions

- **Text Area:** the researcher clicks **View sample answer**, which shows the template's sample text, then **Use answer**. The sample text goes into the answer, and the answer saves.
- **Radio Buttons:** they choose the second option and save.
- **Text Field:** they type an answer and save.

The plan then shows "3 of 3 questions answered · 100%", and each question is marked as answered. After a reload, all three answers are still there.

### 9. The plan on the project page, and Update plan

From the plan's breadcrumbs the researcher goes back to **Project overview**. The plan's card shows:
- its title and "Funding: National Institutes of Health",
- its section with "3 of 3" answered,
- its DOI (every plan gets one when it's created, but it's only registered when the plan is published), and a **Download** link.

The researcher clicks **Update plan**, which opens the plan. They change the Text Field answer and save. After a reload, the new answer is shown.

## Not covered yet

- **Publishing the plan, and making it public.** Publishing registers the plan's DOI with EZID, and the local Apollo and the test environments use EZID's staging server, where registered DOIs can't be deleted. Every run would register new DOIs, so publishing isn't tested.
- **Downloading the plan.** It needs `dmptool-narrative-generator`, which isn't usually running locally.
- **Subdomains.** The local seed data doesn't link any subdomains to their research domains, so the subdomain list is always empty locally.
- **Importing a project from NIH's award database.** "Search for projects" calls NIH's live API, so the tests use "Add project manually" instead.

## Known issues the tests work around

- **The saved research domain isn't shown** on the Edit project details page when it has no subdomain. `ResearchDomainCascadingDropdown` only restores the selection when there's a parent domain, so a top-level domain like "Social Sciences" shows as "Select a domain". The test checks the domain through Apollo instead.
- **The plan page's breadcrumbs** are named "Breadcrumb navigation", while other pages use "Breadcrumbs". The test accepts either.

## Things to know when changing these tests

- **Clicking too early.** A click on a page that has just loaded can be ignored, because the page's JavaScript isn't ready yet. Clicks that move to the next step are retried until the next step appears, and never repeated once it has.
- **Checkboxes and radio buttons** are selected with the keyboard (focus, then Space), as a keyboard user would.
- **Finding NIH.** "Most popular funders" changes with the data, so the tests always find NIH by searching for it.
- **Date fields** have a segment for each part of the date. The tests click the month segment and type the digits, for example `01152027`.
