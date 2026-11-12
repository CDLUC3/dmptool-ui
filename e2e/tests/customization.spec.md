# Template customization tests (`customization.spec.ts`)

These tests follow one template customization from start to finish. An organization admin customizes a funder's template and publishes the customization, and then a researcher in the same organization writes a plan with that template and sees the customization in it.

## How the tests are organized

- **Three test accounts.**
  - The **funder admin** (`funderAdmin`) owns the template being customized. It's an `ADMIN` in a separate "DMP Tool API Testing Funder" organization, because an organization can't customize its own templates.
  - The **admin** (`admin`) customizes it, in the "DMP Tool API Testing" organization.
  - The **researcher** (`researcher`) is in the same organization as the admin, and writes the plan.

  All three start from the sessions saved by the login setup, so they never type a password. The README describes the accounts.
- **Their own data.** Before the tests start, two things are created through Apollo:
  - the funder admin creates and publishes a **public** template, with the same section and three questions the plan tests use (a Text Area with sample text, Radio Buttons and a Text Field),
  - the researcher creates a project with the funder organization as its planned funder, so the funder's templates are listed when the researcher creates a plan.

  The tests don't use seed data, or the templates from the other spec files.
- **In order.** The tests build on one customization, so they run in order, and if one fails, the rest are skipped.
- **Unique names.** Every template, project, section and question name includes the browser, the time and a random part.
- **Nothing is left behind.** When the tests finish, even after a failure, everything is removed through Apollo in dependency order:
  1. the researcher's project is archived, which deletes its plan,
  2. the admin removes the customization (one organization can only customize a template once, so a leftover would block the same template, though each run uses a new one),
  3. the funder admin archives the funder template, which deletes it once it has no plans.

## The admin customizes the funder template

### 1. The funder template is listed as customizable, and Update starts a customization

The admin opens **Template customizations** (`/template/customizations`) and searches for the funder template. Its list item shows the funder organization's name and "Not customized". Neither of its "Update" links goes to a customization page yet, because there isn't one. Clicking its **Update** action creates the customization (the `AddTemplateCustomization` mutation) and opens its page.

The page is titled with the funder template's name, and shows the funder's section and its three questions. Nothing has been customized yet, so there's no **Publish customization** button.

### 2. A custom question is added to the funder's section

In the funder's section, the admin clicks **Add question**, chooses **Text Field**, enters the question text and clicks **Save and add**. The customization page then shows the new question, and now that something is customized, **Publish customization** is shown.

### 3. A custom section is added, with a custom question in it

The admin clicks **Add section**, enters a section name and clicks **Create section**. The customization page shows the new section. The admin then adds a Text Field question to it, as in flow 2.

### 4. Publishing the customization

The admin clicks **Publish customization**. Once it's published, the only action shown is **Unpublish**.

## A researcher in the admin's organization writes a plan with it

### 5. The plan has the funder's questions and the published customization

On the project's **Plan: Select a DMP template** page, the researcher searches for the funder template and selects it. The new plan says it's based on the funder template, and has:

- the funder's section and its three questions,
- the custom question the admin added to the funder's section,
- the custom section and its question,

so 0 of 5 questions are answered.

The customization is applied when the plan is created, using the organization of the user who creates it. That's why it has to be published first (flow 4), and why a researcher in a different organization wouldn't see it.

## Not covered yet

- **A researcher in another organization.** Their plan from the same template shouldn't show the customization. No researcher account exists outside the admin's organization yet.
- **Customizing the funder's own questions and sections**, for example adding guidance or a sample answer to a funder question.
- **The funder publishing a new version** of the template, which changes the customization's migration status ("Funder template has changed").
- **Previewing, unpublishing and deleting** the customization from its page. The tests remove it through Apollo instead.

## Known issues the tests work around

- **Each template on the customizations list is a list item inside another list item**, so a filter on the template's heading matches both. The tests take the inner one (`.last()`).

## Things to know when changing these tests

- **Each list item on the customizations page has two "Update {template}" links**, one in its heading and one in its actions. Until the template is customized, neither has an `href`: both create the customization before opening it. The tests click the action (the last one).
- **The tests search only once, with their own steps rather than the `search()` helper.** Searching again with the same term used to show "No items found"; that's fixed, and searching once keeps the test short.
- **The customizations page's Search button is named "Clear search"**, because it's inside a React Aria `SearchField`.
- **There's no Publish button until something is customized.** A new customization with no changes has no publish actions.
- **The researcher must create the plan after the customization is published.** A plan only picks up the customization that's published when the plan is created.
