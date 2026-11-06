# Template tests (`template.spec.ts`)

These tests follow an organization admin through the whole life of a template: creating it, adding a section and questions, changing question types, saving a draft, publishing, copying it, changing who can see it, previewing it, and checking its history.

## How the tests are organized

- **One template per run.** The tests build a single template step by step, and each test picks up where the previous one left off. For example, the publishing tests need the questions added earlier. Because of this they run in order, and if one fails, the rest are skipped.
- **Each browser builds its own template.** The template's name includes the browser and a timestamp, for example `E2E template chromium 1793915111104`, so runs in different browsers never touch each other's data.
- **Logged in as the test admin.** The tests start from the admin session saved by the login setup, so they never type a password. The account is the `ADMIN` test account described in the README.
- **Nothing is left behind.** When the tests finish, even after a failure, every template they created is archived. Archiving a template with no plans deletes it. The copy is archived before the original, because the original can't be archived while a copy of it exists.

## The flows, in order

### 1. Starting a new template from scratch

The admin goes to **Create a template**, enters a name, and clicks **Next**.

On the second step, "Start with a copy of an existing template", the test checks that the page shows:
- the "My organization templates" and "Public templates" lists,
- the "Build a new template" area,
- the search box and its help text.

The admin searches for something that doesn't exist, and both lists show "No items found". Finding a real template here is tested later (flow 8), once there's a published one to find.

The admin then clicks **Start**. The new template's page opens with the name as its heading, an **Add section** link, and no sections yet. The sidebar shows the template as a **Draft**.

### 2. Adding a section from scratch

From the template page, the admin clicks **Add section**. The test checks that the "Add new section" page offers all three options:
- using a section they created before,
- using a DMP Tool best practice section,
- building a new section.

The admin chooses **Create new section**. On the "Create section" form, the test checks:
- the three tabs: Edit section, Options and Logic,
- the label and help text of each field.

The admin fills in all four fields: the section name, and the introduction, requirements and guidance (these three are rich text editors). Then they click **Create section**.

Back on the template page, the section is listed as "Section 1" with its name, and an **Add question** link appears under it. The admin opens **Edit section**, and the test checks that every value they entered was saved.

### 3. Searching the question types

From the section, the admin clicks **Add question**. The page lists all 15 question types.

- Searching for "date" narrows the list to **Date Field** and **Date Range**, and shows "2 results match your search".
- A search that matches nothing, straight after that one, shows "No items found" and no types.
- After searching for "date" again, **clear filter** brings back all 15 types.

### 4. Adding one question of each type (15 tests)

There's one test for each of the 15 question types: Text Area, Text Field, Radio Buttons, Check Boxes, Select Box, Multi-select Box, Number Field, Number Range, Currency Field, Email Field, URL Field, Date Field, Date Range, Affiliation Search and Research Output Table.

In each one, the admin picks the type and the "Add new question" form opens. The test first checks what every question form has:
- the selected type, and the **Change type** button with its warning that changing type may lose data,
- the help text for the question text, requirements and guidance,
- the best practice tags,
- the **Preview question** link.

The admin then fills in every field:
- **Every type:** question text, requirements and guidance.
- **Text Area only:** sample text, and a tick in "Use this sample text as the default answer in the DMP". The test also checks that the other types don't offer this option.
- **Radio Buttons, Check Boxes, Select Box and Multi-select Box:** two answer choices, with the first set as the default. The test checks for the "Choice 1 set as default." message.
- **Number Range and Date Range:** the start and end labels. The test first checks that they start as "From" and "To".
- **Affiliation Search:** the search label and its help text.
- **Research Output Table:** the test checks that the Title field is always included and can't be removed, and the admin adds the Description field.
- **Every type except Text Area, Text Field and Research Output Table:** "Show a comment field where plan writers can explain their answer", under **Additional comment box**.
- **Every type:** the **Storage & security** and **Data Collection** tags, and **Mark as required? → Yes**. The test checks that each tag has an info button named after it (for example "More information about Storage & security"), and that choosing "required" doesn't clear the comment box choice.

The admin clicks **Save and add**. The test checks two things:
- **What was sent to Apollo:** the question is marked as required, it has both tags, the comment box is on (for the types that have one), and Apollo returned no errors.
- **The template page:** the admin is back on it, and the new question is listed.

### 5. A saved question keeps its values

The admin reopens the Text Area question from its **Edit question** link, which is named after the question ("Edit question: E2E Text Area question"). The test checks that everything entered in flow 4 was kept:
- the type and question text,
- the requirements, guidance and sample text,
- the default-answer tick,
- **Required: Yes**,
- the two tags that were ticked, and that other tags weren't ticked.

### 6. Changing the type of a new question (before saving)

The admin starts a new Text Field question, types some question text, and clicks **Change type**. The list of question types opens again. The admin picks **Radio Buttons**, and the form now shows Radio Buttons with its answer choice fields.

This question is never saved, so it doesn't affect the question counts in later flows.

### 7. Changing the type of a saved question

The admin opens the Text Field question saved in flow 4 (the edit page calls its type "Text"), clicks **Change type**, and picks **Check Boxes** (shown on the edit page as "Checkbox"). The question opens again as Check Boxes, still with its question text. The admin adds an answer choice and clicks **Save and update**.

When the question is reopened, it's still Check Boxes with the new choice, so the type change was saved.

### 8. Saving a draft

On the template page, the admin clicks **Save as draft**. The test checks:
- the "Successfully updated." message,
- the version shown under the title is now **v1**,
- the sidebar's visibility setting shows **Unpublished changes**.

### 9. Publishing the template

The admin clicks **Publish template**. The test checks the dialog's text: the visibility options with their descriptions, the notes about what publishing does, and the change log help text.

1. The admin clicks **Save and publish** without filling anything in. Two errors appear: one asking them to choose a visibility, and one saying a change log is required.
2. The admin chooses **Public**. A note appears saying all DMP Tool users will be able to see and use the template.
3. The admin enters a change log and publishes.

The dialog closes, the version is now **v2**, and the sidebar shows **Published**.

### 10. Copying an existing template

The admin starts creating another template, named after the first one with "copy" on the end. On the second step they search for the published template, and it appears under **Public templates**. They click its **Select** button.

A new template opens. It has a different id from the original and the "copy" name, plus the original's section and all 15 of its questions.

### 11. Searching the organization's templates

On the **Organization templates** page (`/template`), the admin searches for the original template's name. Both the original and the copy are found, and nothing else. A search that matches nothing shows "No items found".

### 12. Changing who can see the template

First the admin makes a small change: they add " (updated)" to the section guidance. Apollo won't publish a template that hasn't changed since its last publish, even when only the visibility is different.

Then the admin opens the **Edit** link next to **Visibility settings** in the sidebar.
1. The dialog says version v2 was published with Public visibility, and **Public** is already selected.
2. The admin switches to **Organization only**. A note appears saying only users in their organization will be able to see and use the template.
3. The admin enters a change log and publishes.

The version is now **v3**. Reopening the dialog shows that v3 was published with Organization only visibility, now selected.

### 13. Previewing the template

The admin clicks **Preview** in the sidebar. The preview page shows:
- "Preview:" followed by the template's name, and the explanation that this is how the template will look to plan writers,
- the section with its name, introduction and requirements,
- all 15 questions, with "0 of 15 questions answered".

**Back to template** returns to the template page.

### 14. Checking the history

The admin opens the history twice: once from **View history** under the page title, and once from **History** in the sidebar. Both open the "Template history" page. Its table has the columns Action, User, and Time and Date, and lists three versions, newest first:
- **PUBLISHED v3**, with the change log from flow 12,
- **PUBLISHED v2**, with the change log from flow 9,
- **DRAFT v1**.

Each row shows the admin's name. The test gets the expected name from Apollo instead of hard-coding it, so it doesn't depend on the seed data.

## Things to know when changing these tests

- **Clicking too early.** A click on a page that has just loaded can be ignored, because the page's JavaScript isn't ready yet. Clicks that open the next step are retried until the step appears, and never repeated once it has. Save as draft is never clicked again once a save has been sent, so it can't create an extra version.
- **Checkboxes and radio buttons** are selected with the keyboard (focus, then Space). The visible box is drawn by React Aria, and some labels contain other buttons, like the tags' "Click for more info", so clicking them isn't reliable.
- **Rich text editors** (TinyMCE) can drop keystrokes while they're starting up. Typing into them is retried until the text appears, without ever typing it twice.
- **Leaving a form with unsaved changes** opens a "Leave site?" dialog. The tests accept it automatically.
- **Run time:** about 2 minutes in Chromium alone, and about 5.5 minutes for all three browsers.
