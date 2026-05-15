## Added
- Added new shared styles `popoverContent`, `popover-inverse`, and `link-disabled` [#225]
- Added use of `TransitionLink` to some of the buttons in the Plan builder flow, so that it shows a loading transition when the user clicks on links [#225]
- Added a `SaveCollaboratorAccessModal` to display to user when saving a change to a collaborator's access level [#228]
- Added new `Notification` component for displaying notifications at top of page. Added new `CompleteFeedback` mutation [#191]
- Added `UpdateAffiliation` and `AffiliationById` queries [#203]

## Updated
- Updated `OverviewSection` component to use `disabled` and `hoverMessage` props so that those links can be disabled with a popover message [#225]
- Updated `PlanOverviewPage`, `PlanOverviewSectionPageShared`, and `PlanOverviewQuestionPageShared` components to display a `readOnly` mode. Added popover messages to disabled links [#225]
- Updated `FeedbackOptions` page to properly validate and message user when submitted emails are not valid, and added the use of a save confirmation modal [#228]
- Updated `AccessLevelRadioGroup` to include `PRIMARY` [#228]
- Updated `ProjectsProjectCollaboration` component with new functionality to determine whether a user can make certain access level changes [#228]
- Updated `ProjectsProjectPlanFeedback` component to disable the submit button do only Primary users can make the request [#228]
- Updated `useResearchoutputTable` hook to not include `outputType` field as one that is initially enabled. Updated `expandedFields` logic for Research Output fields to be dynamic [#33]
- Updated Request Feedback Options text [#226]
- Updated `PlanOverviewPage` and `plan` schema to include the `planCreator` field now passed as part of `plan` query response, and fixed bug in determining `read-only` [#198]
- Updated `RepoSelectorForAnswer` to fix the issue with repositories not displaying in repositories search modal. Main change was to place the repositoriesData handling into a useEffect, since fetchRepositoriesData is async [#224]
- Updated `TemplateCustomizationOverview` to `refetch` data after a section reordering so that we know to display the "Publish changes" button. Also, updated `CustomSectionEdit` to `refetch` data after reordering questions for the same reason. [#200]
- Updated `CustomQuestionNew` to filter out the `displayOrder` field from shared `commonFields` since it's not needed for the custom question mutation [#200]
- Updated `TemplateEditPage` to clear errors when `handleSubmit` called [#200]
- Updated back the `displayOrder` field and `QuestionDisplayOrderDocument` and `getDisplayOrder` function to `QuestionAdd` for calculating displayOrder, since cached data was somehow being used with the previous changes [#200]
- Updated the `jsonToState` function in `researchOutputTransformations` to set `enabled === false` for `outputTypes` when there is no value saved in the question `json`. This makes sure that checkbox remains unchecked when RO question form is edited [#201]
- Updated `PlanOverviewQuestionPageShared` to display feedback notification when user is Org Admin, and feedback has been requested. Also, made updates to `useRenderQuestionField.tsx` to disable fields when in that mode [#196]
- Updated `PlanOverviewPage` section buttons to display `View` button text when in feedback mode [#196]
- Updated `ReposSelector.tsx` to fix some issues with subject area searches [#118]
- Updated `PlanOverviewPage` component to display a feedback mode notification at top of page when one has status=REQUESTED [#191]
- Enhanced condition in `RepoSelectorForAnswer` to display the preferred Repositories checkbox [#118]
- Updated `FeedbackOptions` component to use real data [#203]
- Updated `RepoSelectorForAnswer` to wait to query `Re3byUrIsDocument` until we have `preferredReposURIs` because preferred repos don't display even though they eventually do to trigger the display of the "preferred repositories" checkbox [#118]

## Chore
- Updated version of `next-intl` to `v4.9.2` and `icu-minify` to `v4.11.1`, and added `override` of `postcss` to `v8.5.10` to address security vulnerabilities.
- Updated `sanitize-html` to `v2.17.3` and `dompurify` to `v3.4.0` due to security issues. Also, updated `prettier` to `v3.8.3` and `@dmptool/types` to `v3.1.4`, and `lodash` override to `v.4.18.1`. Removed overrides for `minimatch` and `test-exclude`.

==========================================================================================
## All changes above the line happened after the merge to the main branch on April 20, 2026
==========================================================================================
## Added
- Added new `RequestFeedback` mutation [#568]
- Added new `PlanOverviewCustomQuestionUnderCustomSectionPage` at `/projects/[projectId]/dmp/[dmpid]/cs/[csid/cq/[cqid]`, `PlanOverviewCustomSectionPage` at `projects/[projectId]/dmp/[dmpid]/cs/[csid]`, and `PlanOverviewCustomQuestionUnderVersionedSectionPage` at `projects/[projectId]/dmp/[dmpid]/s/[sid]/cq/[cqid]` [#172]
- Added new routes for `projects.dmp.customSection`, `projects.dmp.customQuestion.underVersionedSection`, `projects.dmp.customQuestion.underCustomSection` [#172]
- Added new `projects.dmp.customSection` and `projects.dmp.customQuestion.detail` routes to routePath [#169]
- Added `PublishedCustomSection` query [#169]
- Added new `NavigationEvent` and `TransitionLink` to prevent multiple clicks on a link while loading, and to provide feedback to user with a progress bar [#149]
- Added a new `TransitionButton` component to disable button when in progress, and to change button text when loading [#149]
- Added `loading.tsx` at `app` directory root, instead of in `app/[locale]` because it wasn't working in the `[locale]` directory [#149]
- Added new `TooltipSelect` component, which allows us to include descriptions with each `Select` option [#32]
- `Custom Question` additions [#929]
  - Added new `CustomQuestionEdit` page
  - Added new `QuestionCustomize` page
  - Added new `CustomQuestionNew` page
  - Added new `AddCustomQuestion`, `UpdateCustomQuestion`, `RemoveCustomQuestion`, `AddQuestionCustomization`, `UpdateQuestionCustomization`, `RemoveQuestionCustomization` mutations
  - Added `CustomQuestion` and `QuestionCustomizationByVersionedQuestion` mutations
  - Added new routes for Custom Queries to `utils/routes.ts`
- Added `CustomSectionEdit`, and `CreateCustomSectionPage` for adding and editing Custom Sections [#928]
- Added new `/template/customizations/[templateCustomizationOverview]` page [#927]
- Added new `CustomizedTemplate` components directory and new `CustomizedQuestionEdit` and `CustomizedSectionEdit` components [#927]
- Added `MoveCustomQuestion`, `MoveCustomSection`, `UpdateSectionCustomization`, `RemoveSectionCustomization`, `UpdateCustomSection`, `AddTemplateCustomization` mutations and `SectionCustomization` and `TemplateCustomizationOverview` queries [#927]
- Added new `/template/customizations` page and associated `CustomizedTemplateListItem` component [#43]
- Added new `warning` icon to `iconset.svg` [#43]
- Added new `clearAuthData` and `clearCache` to `AuthProvider` so that we can clear cache on `/login` and `/logout` [#55]
- Added new `useGuidanceMutation` hook for adding and removing guidance from right sidebar [#15]
- Added new queries `GuidanceSourcesForPlan`, `AddPlanGuidance`, `RemovePlanGuidance` and `ManagedAffiliationsWithGuidance` [#15]
- Added new component `AffiliationSearchForGuidance` to be used for the custom guidance search modal [#15]
- Added a new type policy `guidanceTypePolicies` for Apollo Client [#15]
- Added related works project overview page [#700]

## Updated
- Updated `users` query to include `feedbackEmails` [#568]
- Updated `ProjectsProjectPlanFeedback` Request Feedback page. Hooked up the page to data and adjusted layout [#568]
- Updated `ResearchOutputComponent` so that it disables checkboxes on the research output template builder form for all fields that are required [#33]
- Updated `AnswerByVersionedQuestionId` query and `addAnswer` mutation schemas to pass in `versionedCustomSectionId` and `versionedCustomQuestionId` so that we can get answers to custom questions and save them accordingly [#174]
- Updated `PublishedQuestion` query to include customization fields, and updated `PlanOverviewQuestionPageShared` component to use the new customization sample text and org info [#174]
- Moved shared `actions` from `project/[projectId]/dmp/[dmpid]/s/[sid]/q/[qid]` to `@/app/actions` since they will be shared between the three question pages [#172]
- Moved the `__mocks__`, `__tests__` directories to the new shared `PlanOverviewQuestionPageShared` and `PlanOverviewSectionPageShared` components and `hooks` to `@/app/hooks` for `useComments.tsx`. Also moved shared `Comments` files to `components/Comments` [#172]
- Updated `useGuidanceMutations` and `useGuidanceData` hooks to include custom questions [#172]
- Updated `PlanOverviewSectionPage` to get `sectionType` from query param and added `PublishedCustomSectionDocument` and `PublishedCustomQuestionsDocument` queries to get custom sections and questions to list on the page. set correct `section` or `questions` values based on `BASE` and `CUSTOM` sectionTypes [#169]
- Updated `CustomQuestionNew` to pass `sectionType` to `QuestionAdd` component [#169]
- Updated `PublishedQuestions` query fields, and added `PublishedCustomQuestions` query [#169]
- Updated `useGuidanceData` to use the correct sectionId for custom sections, and updated `useGuidanceMutation` hook to do the same using the new `customSectionId` prop [#169]
- Updated `CustomizedSectionEdit` to pass the new `direction` prop to `moveCustomQuestion` mutation [#169] 
- Updated renovate config to rebase when a PR is behind the base branch
- Updated `ProjectOverviewPage` to display both `BASE` and `CUSTOM` sections in the card [#168]
- Updated `PlanOverviewPage` to display both the `BASE` and `CUSTOM` sections in the list [#168]
- Updated `project` and `plan` queries to include the new `customSectionId` and `sectionType` fields [#168]
- Updated `PlanCreate` page to use the `versionedTemplateCustomizationId` to determine whether the template has customizations [#165]
- Updated `layout.tsx` to include the progress bar navigation for custom links [#149]
- Updated buttons and links in template builder flow to use the new `TransitionButton` and `TransitionLink` components [#149]
- Updated `PlanOverviewSectionPage` left nav to appear only for large screens over `1800px` for now, because it was overlapping with the content for smaller devices [#34]
- `Custom Questi
- Updated Research Output standardFields config so that only `title` field is required when answering question [#33]
- `Custom Question` updates [#929]
- Moved `addQuestionMutation` out of `QuestionView` so that `QuestionView` can be shared for both `BASE` and `CUSTOM` questions
  - Updated `QuestionTypeSelectPage` to include the `addQuestionMutation` and `getDisplayOrder` and pass those to `QuestionAdd`
  - Added use of `Loading` component in `TemplateCreatePage`
  - Added `fetchPolicy` of `cache-and-network` to `TemplateCustomiationOverview` query so that we get updated data when user returns from editing section or question
  - Updated form components with `isDisabled` prop so that users customizing existing questions can see a disabled version of the form fields
  - Updated `QuestionAdd` to accept more props and be more flexible for shared use with Custom Questions
  - Updated `QuestionView` to accept more props like `orgGuidance` so it can be shared with Custom Questions
- Updated `ReposSelector` and `RepoSelectorForAnswer` components to use the new `Re3RepositoryTypesListDocument`, `Re3SubjectListDocument`, and `Re3byUrIsDocument` queries [#113]
- Updated `ResearchOutputAnswerComponent` so that we don't get a duplicate `save` CTAs when on the `SingleResearchOutputComponent` page [#113]
- Updated `SectionCustomizePage` component for customizing existing sections [#928]
- Updated `TemplateSelectTemplatePage` component to pass `versionedTemplateId` to `addTemplate` mutation when the template being cloned is not in the user's organization [#1006]
- Update `addTemplate` query to include `copyFromVersionedTemplateId` variable [#1006]
- Updated `useResearchOutputTable`'s `updateStandardFieldProperty` method to `enable` a Research Output Table field when any content or config changes for that field [#943]
- Updated `/login` page step=email to include a "Back" button so user can go back to Step 1 [#997]

## Fixed
- Fixed the sidebar panel links in `PlanOverviewPage` because they did not match or function consistently [#568]
- Fixed some broken translation keys for Loading message [#165]
- Fixed some issues in `Research Output` question answer form, where data flags checkboxes were not displaying and output types was missing the custom output
- Fixed issue with missing `as builder` in `Dockerfile.prod`
- Fixed bug where user's org was not displaying as a filter option, and Best practice was displaying instead [#62]
- Fixed issue with default `sampleText` appearing again in textArea question, after the user overrides it, saves, and then deletes their answer [#7]
- Updated "Back" button on /login page to have `type=button` instead of `type=submit`
- Fixed bug where the published status on `/template/[templateId]` did not match that on the template cards at `/template` for the `unpublished changes` state. Added a shared hook for determining the correct status text [#875]

## Chore
- Updated `@apollo/client` to `v4.1.7`, `@apollo/client-integration-nextjs` to `v0.14.5`, `next` to `v16.2.3`, `next-intl` to `v4.9.1`,`@types/node` to `v24.12.2`, `@types/sanitize-html` to `v2.16.1`, `brace-expansion` to `v2.1.0` and `minimatch` to `v10.2.5`, and `next` to `v16.2.6`.
- Addressed `lodash` vulnerability by adding it as an `override` at v4.18.0 in `package.json` [#172]
- Addressed `picomatch` package vulnerability [#169]
- Updated version of `next` to `v16.2.0`, `sanitize-html` to `v2.17.2`, `react-aria/toast` to `v3.0.11`, `@react-stately/toast` to `3.1.3` and `react-aria-components` to `v1.16.0`. Fixed some unit tests related to the updates, and updated header logo `Image` and related `css` to remove warnings related to resizing.
- Updated version of `next` to `16.1.7` due to security vulnerability
- Updated version of `dompurify` to `v3.3.2` due to security vulnerability, and included updates to`test-exclude` to v7.0.2, `sanitize-html` to v2.17.1, `tinymce` to v7.9.2, `next-intl` to v4.8.3, `html-react-parser` to v5.2.17, `@types/node` to v24.12.0, and `@types/react to v18.3.28.
- Updated version of `minimatch` to `10.2.4` to address vulnerabilities
- Updated version of `@dmptool/types` to `3.1.2` and `zod` to match package version to `4.3.6`
- Added override for `minimatch` dependency and removed them for `prismjs` and `qs`.
  - Added override for transient dependency `@eslint/plugin-kit (0.3.4)` and `test-exclude` due to vulnerabilities. `test-exclude` override was necessary because `minimatch 10.x` changed its API. Older test-exclude version expects older minimatch API, which called minimatch as a function. This caused errors.
  - Updated versions of `@graphql-codegen/cli (6.1.2)`, `@graphql-codegen/client-preset (5.2.3)`, `@graphql-codegen/typed-document-ndoe (6.1.6)`, `@graphql-codegen/typescript (5.0.8)`, `@graphql-codegen/typescript-operations (5.0.8)`, `@typescript-eslint/eslint-plugin (8.56.1)`, `@typescript-eslint/parser (8.56.1)`, `eslint (9.18.0)`, `eslint-config-next (16.1.6)` so that we can remove vulnerabilities.
  - Updated `eslint.config.js` to accomodate new eslint updates
- Updated `middleware.ts` to `proxy.ts` per `middleware` being deprecated in `next v16` [#51]
- Updated `eslint` to `v8.57.1`, `cypress` to `v15.10.0`, `eslint-config-next` to `v15.5.11`, `next` to `16.1.6`, `html-react-parser` to `v5.2.16`, `next-intl` to `v4.8.2`, `react` to `v19.2.4`, `react-dom` to `v19.2.4` and `jose` to `v6.1.3`
- Updated version of `next` to `v16.1.5` due to vulnerability and `next-intl` to `4.8.0` due to dependency
- Updated version of `@dmptool/types` to `v3.1.1` because it has a fix for the 'fs' errors
==========================================================================================
## All changes above the line happened after the merge to the main branch on Jan 27, 2026
==========================================================================================
## Added
- Added new `GuidancePanel` component for the tabbed guidance in the right sidebar [#12]
- Added `BestPracticeGuidance` query [#12]
- Added ability to show if there are pending related works and the number of accepted works [#981]
- Added ability to manually add a related work via a DOI [#835]
- Added a shared `utils/apolloErrorHandler.ts` file to handle `AbortError` related to the updated Apollo Client v4 [#1094]
- Added new graphql queries `MetadataStandardsByURIs` and `RepositoriesByURIs` to get the preferred standards and repos for the Research Output Answer modals [#1094]
- Added `errorTypePolicies` to use in the `apollo-wrapper.tsx` file, due to changes in Apollo's default caching and merge behavior. Setting "merge: false" always replaces new data, instead of trying to merge error objects [#1089]
- Added Question Preview for `ResearchOutput` type [#1055]
- Added new `ResearchOutputAnswerComponent`, `SingleResearchOutputComponent`, `RepoSelectorForAnswer` and `MetaDataStandardForAnswer` components for the rendering of `researchOutputTable` question type answer form [#787]
- Added `utils/researchOutputTransformations.ts` to group utilities for `researchOutputTable` [#787]
### Updated
- Updated `PlanOverviewSectionPage` and `PlanOverviewQuestionPage` to use the new `useGuidanceMutations` hook to add and remove guidance from the sidebar [#15]
- Updated existing `useGuidanceData` to use the new `GuidanceSourcesForPlanDocument` query [#15]
- Updated the `GuidancePanel` with the new `Modal` for searching for managed affiliations [#15]
- Added new icon for a `cancel-reverse` that inverts the typical `cancel` icon color [#15]
- Added a shared `unstyled` button [#15]
- Updated `ExpandableContentSection` component to work with new `GuidancePanel` [#12]
- Updated queries for`GuidanceGroups`, `Me` and `PublishedQuestion` queries [#12]
- Updated to `dmptool/types` version `3.1.0` and ran `npm run generate` to update the GraphQL types [#1129]
- Updated code to use the new version of the `Licenses` query that returns all Licenses without Pagination or search term [#1129]
- Updates related to updated version of @dmptool/types to v2.3.0 [#1082][#998]
  - Updated `PlanCreate` question component page to add a `textArea` comment field if `showCommentField` is true and added `description` to the answer JSON [#998]
  - Added `showCommentField` checkbox field to `QuestionAdd` and `QuestionEdit` components [#998]
  - Updated `CheckboxesQuestionComponent to use  `options.selected` instead of `options.checked` [#998]
  - Updated `InitialAccessLevel.tsx` component to use dynamic translations for info icons [#1082]
  - Updated `QuestionView` to display an “Additional comment” field in the question preview if the `showCommentField` checkbox is checked [#998]
  - Updated `utils/questionTypeHandlers.ts` file to use `QuestionDefaultMap` from `@dmptool/types` instead of manually assembling QUESTION_TYPE_DEFAULTS 
  [#1082]
  - Updated researchOutputTable.ts to use DefaultResearchOutputAccessLevelColumn instead of hard-coding definitions in defaultAccessLevels [#1082]
  - Updated utils/researchOutputTransformations.ts” to use DefaultResearchOutputCustomColumn in place of AdditionalFieldsType [#1082]
- Updated `RepoSelectorForAnswer` and `MetaDataStandardForAnswer` so that the preferred selections display in the modal when first loaded [#1094]
- Updated `ResearchOutputAnswerComponent` and `researchOutputTransformations.ts` so that we don't get the preferred repos and standards displaying as pre-selected in the Research Output Answer form [#1094]
- Updated `@apollo/client` to `v4` which required updates to our `graphql-codegen` process and, therefore, almost all components and unit tests [#1089]
  - Updated `codegen.ts` for new Client Preset approach [#1089]
  - Updated all components to use the new Apollo Client v4 approach of using Documents and wrapping them in hooks, like `useQuery` and `useMutation` from `apollo/client/react` [#1089]
  - Updated `lib/graphql/graphqlHelper.ts` to use new Apollo Client methods [#1089]
  - Replaced use of `@apollo/experimental-nextjs-app-support` with `@apollo.client-integration-nextjs` [#1089]
  - Installed `rxjs` peer dependency for Apollo Client v4 [#1089]
  - Installed `@graphql-codegen/client-preset` and `@graphql-codegen/typed-document-node` which replaces no longer supported `@graphql-codegen/typescript-react-apollo` [#1089]
  - Deleted `lib/graphql/server` files since they were old and not being used [#1089]
  - Updated `lib/graphql/client` and `lib/graphql/apolloClient` with new methods for Apollo Client v4 [#1089]
  - Updated `jest.setup.ts` to suppress `DOMException` errors in tests [#1089]
- Updated `/login` page to disable `email` field when on second step of login [#997]
- Updated "Share with people" link on `ProjectsProjectMember` component to go to `/collaboration` page [#845]
- Updated `TemplateEditPage` component with the new `Unpublished changes` status [#875]
- Updated `QuestionAdd` and associated unit tests to include tests for new `researchOutputTable` question type [#787]
- Update `PlanOverviewQuestionPage` component and related unit test in template builder flow to add `researchOutputTable` question type support [#787]
- Updated `QuestionEdit` page and related unit test to improve the `researchOutputTable` question type application by moving hydration out to hook [#787]
- Update `hooks/useResearchOutputTable` to memoize some functions and moved some code out to new `researchOutputTransformations` util  [#787]
- Moved `ResearchOutputQuestionComponent` and `ResearchOutputAnswerComponent` under `components/Form` [#787]
- Updated shared `ErrorMessages` to pass in `ref` so we can control which field error to scroll to [#787]
- Updated `hooks/useRenderQuestionField` hook to include rendering of `researchOutputTable` answer form [#787]
- Updated `utils/questionTypeHandlers` with use of `Default` types from `@dmptool/types` [#787]
- Hooked up the `Research Output table` for template builder for `QuestionAdd` and `QuestionEdit` components. Updated `QuestionEdit` to use server actions[#869]
  - Updated associated research output field components, like `InitialAccessLevel`, `LicenseField`, `MetaDataStandards`, `OutputTypeField` and `ReposSelector` [#869]
  - Added a `ResearchOutputComponent` to consolidate the code for that question type [#869]
  - Added a new `useResearchOutputTable` hook to share functionality between `QuestionAdd` and `QuestionEdit` [#869]
  - Updated `Pagination` component so that navigation doesn't shift too much [#869]
### Remove
- Removed `boolean` question type from the Add Question question types list [#990]
### Fixed
- Fixed issue on Guidance Group creation, where saving content for one tag, wipes out the entered content (unsaved) for other tags [#6]
- Fixed related works pagination.

### Chore
- Updated dependency versions
  - Updated `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` to `v6.21.0`, `typescript` to `v5.9.3`, `jsonwebtoken` to `v9.0.3`, `graphql` to `v16.12.0`, `@types/node` to `v24.10.9`, `dompurify` to `v3.3.1`, and `@graphql-codegen/cli` to `v6.1.1`
- Updates required in conjunction with update of Apollo Client version [#1089]
  - Updated Apollo Client from `3.13.8 to 4.0.11`
  - Removed `@apollo/experimental-nextjs-app-support` to `@apollo/client-integration-nextjs@0.14.1`
  - Removed `@graphql-codegen/typescript-react-apollo` and replaced with `@graphql-codegen/client-preset`
- Removing `github/dependabot.yaml` file because we are opting to use `renovate` to notify us of dependency updates
- Updated the following packages: `@types/react` to 18.3.27, `react` to 19.2.3, `react-dom` to 19.2.3, `node-fetch` to 3.3.2, `@types/node` to 24.10.4, `eslint` to 9.39.2, `eslint-plugin-unused-imports` to 4.3.0, `husky` to 9.1.7, `pino` to 9.14.0 and `prettier` to 3.7.4
- Updated `qs` to 6.14.1 version due to vulnerability and updated dependency `cypress` to version 15.0.0
- Updated `next` to version 15.5.9 due to vulnerability
- Updated version of `next` to `15.5.8` due to vulnerability
==========================================================================================
## All changes above the line happened after the merge to the main branch on Dec 4, 2025
==========================================================================================
### Added
- Added missing `slug` property to all `tags` in the graphQL queries 
- Added guidance text from the backend to the Question Answer page [#580]
- Added new, shared `ProjectRoles` component that generates the list of Project Roles for both the Project Member Search and Edit Project member pages [#945]
- Added `Help text` fields to `Description, Repositories, Metadata Standards, License, Access Level and Custom Text` fields in Research Output question type [#970]
- Added customizable `Initial Access Level` field to the QuestionAdd page for Research Outputs question type [#969]
- Added new `Start DMP` page at `projects/[projectId]/dmp/start` to direct user to create new plan or upload existing [#956]
- Added `autosave` back to the `PlanOverviewQuestionpage` [#944]
- Hooked up the `Download plan` page and added a `download-narrative` api endpoint [#313]

### Updated
- Guidance page updates [#934]
  - Hooked up `admin/guidance` page that lists all the `guidance groups` and offers `Create Guidance Group` button and edit options for existing Guidance Groups [#934]
  - Hooked up `admin/guidance/groups/create`, and created a new page for `admin/guidance/groups/[groupId]` to include guidance text for all tags in one place and to allow    
    publishing at that level [#934]
  - Added skeleton for loading of TinyMCEEditor. Especially needed it for the new Guidance Group Edit page, since we are loading so many at once [#934] 
  - Updated stripHtmlTags to include replacement of `&nbsp;` [#934]
  - Updated `DashboardListItem` to have the option to be fully clickable. This makes clicking on smaller devices easier [#934]
- Made improvements to auth handling in `middleware` and `authHelper.ts` [#1035]
- Made text changes to upcoming blog posts [#989]
- For Research Outputs, updated repositories and metadata standards fields to be automatically enabled when user selects custom ones [#943]
- Updated Licenses and Output Types to use label "Use custom list" [#943]
- Updated `Output Types` in static `Research Outputs` table [#962]
  - Added a description field to custom types
  - Added tooltip icons next to each default output type with the description
  - Updated Output Types component to behave like the Licenses component, where users can delete default types
  - Updated unit test
- Improved project creation steps by updating pages in the flow (header, home, plan dashboard, create project details,and funding search) to help users in creating a plan [#956]
- Updated Project Details subdomains field to only display once a user selects a research domain [#947]
- Updated `Remove` buttons to be `secondary` buttons, rather than `red` [#964]

### Fixed
- For Research Outputs, fixed custom Licenses select field to display selected value [#943]
- Fixed issue where custom repos and standards were not saving in state [#943]

### Removed
- Removed Research Outputs section from the plan overview page
- Removed reference to the old `outputs` association on the graphQL query
- Removed `Description` fields for Research Output question fields [#970]
- Removed `scrollToTop` from `Template Create` page [#950]

### Chore
- Updated `jws` to `3.2.3` due to vulnerability
- Updated `next` version to `15.5.7` due to vulnerability
- Ran `npm audit fix` to address `glob` vulnerability and `js-yaml` vulnerability
====================================================================================================================================
## All changes above the line happened after the merge to the main branch on Nov 3, 2025
### Added
- Added user's org as a filter for the Plan Create (`projects/9/dmp/create`) page, and updated filter text to include `organization` [#735]
  - Fixed filtering on the Plan Create (`projects/9/dmp/create`) page so that it takes search term into consideration when used with checked filters [#735]
  - Moved checkbox filters below search field to make them more noticeable [#735]
  - Made code improvements to the Plan Create page and updated unit tests [#735]
- Removed `Title` field from TinyMCEEditor's `Insert Link` form, and made `new window` the default for `Open link in...` [#874]
- Integrated related works UI with GraphQL backend.
- Added updated description that includes template source, affiliation name, version and publish date on the `Plan Overview` page [#621]
- Added plan feedback status (Feedback received, Feedback requested, No feedback) to the `Plan Overview` page [#411]

### Updated
- Updated `TinyMCEEditor` to allow users to change text color and background color.

### Fixed
- Fixed typo in some translation text for the `projects/[projectId]/collaboration/invite` page and added missing `Owner` access level radio option [#846]
- Moved `ProjectsProjectCollaborationInvite` off of using `useReducer` to using `useState` instead [#846]

### Removed

### Chore
- Updated version of cypress to `14.5.4` and fixed broken cypress tests and removed loading of `tinymce` from `layout.tsx` into `TinyMCEEditor`
- Trying another method of disabling the renovate `Apollo Graphql Group update` 
- Disable `Apollo Graphql` renovate PR and fix missing logs from CHANGELOG
- Added `renovate.json` config file in order to get automatic PRs for dependency updates
==================================================================================================================
<!-- Merged below to main branch on Friday, July 18th, 2025  -->
### Added
- `DashboardListItem` component and some basic tests
- guidance route definitions to `utils/routes.ts`
- Added Guidance Dashboard page, SCSS file and tests
- Added Guidance Group Create page, SCSS file and tests
- Added Guidance Group Index page, SCSS file and tests
- Added Guidance Group Edit page, SCSS file and tests
- Added Guidance Text Create page, SCSS file and tests
- Added Guidance Text Edit page, SCSS file and tests
- Duplicate templates to add Organization Templates page
- Add admin feedback options page
- Add admin email text page with styling and tests
- Add static page for Org admin projects dashboard
- Add static update password page
- Added dependabot config
- Add departments and schools page
- Add hostname and port to start command in AWS Dockerfile
- Add explicit cors rules to nextJS config to allow traffic from our domain
- Added Trivy precommit hook to scan for vulnerabilities in package-lock.json
- Add organization details page
- added profile overview page
- added "homepage" which is our temp home page just to add the admin link and made it nicer
- Added admin overview page
- Added component for `PageLinkCard`
- Added admin route definitions to `utils/routes.ts`
- Added `redact` to the pino logger to prevent sensitive information from being logged
- Added `utils/server/loggerUtils.ts` with a method to `prepareLogObject` that strips out empty values and adds available JWT info to the log to assist with debugging
- Added `SERVER_LOG_LEVEL` to the `.env.example` file to be able to set the log level for server side actions
- Added a link to open up a `preview` of the `plan` by using the `dmptool-narrative-generator` endpoint [#412]
- Added use of pagination queries to the `template/[templateId]/section/new` page [#676]
- `small` button CSS class.
- Added curl to the AWS Dockerfile for session manager access
- Added bash to the AWS Dockerfile for session manager access
- Added shared `dmptool-network` to the `docker-compose.yaml` file to allow nextJS server side actions to be able to reach the local apollo server
- Static Feedback page with translation and text [#750]
- Added `RelatedWorks` page and associated components `RelatedWorksList`, `RelatedWorksListItem`, `ExpandableNameList` and `LinkFilter`. [#672][#673]
- Added a `dialog` when removing `project members` so we can message them about the member being removed from all plans and allow users to confirm they want to delete this member [#737]
- Added new `Comments` functionality. Added new graphql queries to get `answerComments` and `feedbackComments` for the `Question Details` page [#321]
- Added new mutations to `add`, `update`, and `delete` comments [#321]
- Added new `CommentList` and `CommentsDrawer` components, and `useComments` hook for the comments list [#321]
- Added `.js` extension to `import nextJest from "next/jest.js";` in `jest.config.ts` to remove errors when running `npm test`[#662]
- Added `Pagination` component to be used on different pages with a large number of search results [#686]
- Added JSON mocks to `__mocks__` for all types of versioned questions (for use with the project/plan pages)
- Hooked up the Project Funding Search page at `/projects/[projectId]/fundings/search` [#606]
- Added auto-save to the `Question Answer` page [#585]
- Added the ability to edit the `Plan title` [#608]
- Added the page for adding a funder manually [#497]
- Added missing `planId` from the `PlanFundings` errors [#322](https://github.com/CDLUC3/dmsp_backend_prototype/issues/322)
- Added descriptive text to the funding-search page [#760](https://github.com/CDLUC3/dmsp_frontend_prototype/issues/760)
- Added description to project search page [#761](https://github.com/CDLUC3/dmsp_frontend_prototype/issues/761)
- Required field indicators to FormInput, FormTextArea, FormSelect, RadioGroup, CheckboxGroup, and TypeAheadWithOther components [#503]
- Added test suites for CheckboxGroup and RadioGroup components that seemed to be missing [#503]
- Interactive form examples to the styleguide showing required and non-required
  states [#503]
- New DmpTable component that wraps the react-aria table, columns and rows. [#239]
- Created the static page for the org admin user dashboard. [#782]

### Updated

- Removed some duplicate text from `template/[templateId]/access` under `External people` [#482]
- Updated description on `template/[templateId]/access` and visibility text on template publish modal [#482]
- Updated `/template/[templateId]` to include the `View history` link in the header description [#430]
- Updated `PageHeaderWithTitleChange` component to pass a `descriptionAppend` in order to append the `View history` JSX [#430]
- Updated `/template/[templateId]/history` to fix how the `description` was being displayed. Updated to use Intl date formatting [#430]
- Updated `/signup` form so that the `email` field is grayed out on step 2, and added a `Back` button on step 2 [#769]
- Updated the `/template/create` page to use the new `offset pagination` functionality for both template sections [#817]
- Updated the `/template` page to use the new `cursor pagination` functionality, because it was only ever loading 20 results [#812]
- Added Admin section translations to both English (`messages/en-US/global.json`) and Portuguese (`messages/pt-BR/global.json`) language files
- Updated all server actions to use the new `logger` and `prepareLogObject` method to log useful information for debugging
- Updated `logger` to use the new `SERVER_LOG_LEVEL` env variable
- Added a `beforeunload` event handler to the `PlanOverviewQuestionPage`, `CreateSectionPage`, `SectionUpdatePage` and `QuestionAdd` components to warn users when they are navigating away with unsaved changes [#758]
- Updated `Commenting` logic on the `PlanOverviewQuestionPage` so that the `creator` or anybody with `role="OWN"` can delete anybody's comments [#321]
- Updated to show disabled `Comment` button with a tooltip message when there is no `answer` yet. [#321]
- Updated language used in RelatedWorks UI, moved accept and reject buttons into the cards out of the expand section and changed order of accept and reject buttons [#799]
- Hooked up the `ProjectsProjectCollaboration` page. Added new `server actions` to handle access level changes, revoking collaborator and resending invite [#381]
- Optimized the `graphqlServerActionHandler` so that we can normalize errors returned and simplify client-side handling [#381]
- Updated the shared`RadioGroupComponent` and `CheckboxGroupComponent` components to be more like a wrapper to reduce duplicate of code and make it more flexible [#743]
- Project over is now using sidebar to allow for collaboration [#750]
- Sidebar is now using global styling rather than css modules [#750]
- Renamed collaboration components from `ProjectsProjectPlanFeedback` to `ProjectsProjectCollaboration` for better clarity and consistency: [#750]
  - Updated main collaboration page component name and imports
  - Updated invite page component name and translation keys
  - Updated all related test files and component references
  - Updated translation files in both English and Portuguese
  - Renamed SCSS module file to match new component naming convention
- Use `orcidToUrl` helper function to generate full ORCID URLs. [#672][#673]
- Moved expand button from `ResearchOutputsList` into its own component `ExpandButton`.[#672][#673]
- Updated `template.visibility` to `template.latestPublishVisibility` to match backend changes [#715]
- Update the Publish modal so that a `visibility` radio option is defaulted to previously set one in the last publish date [#715]
- Updated the template cards so that if `template.latestPublishVisibility` then we remove the `dot` separateor [#715]
- Updated the `Publish Preview` dialog to show the progress from the resolver so it doesn't have to add progress for all sections but get it directly [#720]
- Update the section questions to show Answered/Not Answered status and buttons Start/Update [#670]
- Updated the `Plan Create` page to switch off of manual `Load more` to new `pagination` queries [#686]
- Updated unit test for `Plan Create` to use new `MockProvider` [#686]
- Updated all plan pages to use the proper section and question ids. They were using `Section.id` and `Question.id` but should be using `VersionedSection.id` and `VersionedQuestion.id` since the plan is based on a published template and so should be referencing the components of the published version
- Renamed existing `__mocks__` to be clear that they represent non-versioned questions (for use with the template pages)
- Update `@dmptool/types` version [#322](https://github.com/CDLUC3/dmsp_backend_prototype/issues/322)
- Updated handling of `date`, `dateRange`, `numberRange`, `currency`, and `option` to reflect changes in `@dmptool/types` [#322](https://github.com/CDLUC3/dmsp_backend_prototype/issues/322)
- `@dmptool/types` now has an `affiliationSearch` instead of `typeaheadSearch` and a separate`multiselectBox` type, so updated code to work with these new handlers [#322](https://github.com/CDLUC3/dmsp_backend_prototype/issues/322)
- Updated `utils/questionTypeHandlers.ts` to work with the changed `@dmptool/types` [#322](https://github.com/CDLUC3/dmsp_backend_prototype/issues/322)
- Update json mocks in `__mocks__` directory to reflect changes to question and answer types [#322](https://github.com/CDLUC3/dmsp_backend_prototype/issues/322)
- Updated mocks in `components` to work with updated question JSON [#322](https://github.com/CDLUC3/dmsp_backend_prototype/issues/322)
- Updated the funding-search page on the create project step to link to the new page to add the funder manually [#497]
- Removed research outputs, including related pages and routes, from the demp overview [#764](https://github.com/CDLUC3/dmsp_frontend_prototype/issues/764)

### Fixed

- Update middleware to redirect back to same URL when tokens have been refreshed [#848]
- Updated `ResearchDomainCascadingDropdown` to not require Research domain fields [#763]
- Added missing `relatedWorks` translation keys since it was breaking the pages when locale=pt-BR.
- Returned changes that were initially part of PR `#816` related to `/template` pagination [#812]
- Fixed issue in `Dockerfile.dev` where `package-lock.json` was not being copied over and breaking build.
- Moved `sanitize-html` to `dependencies` now that we're removing the devDependencies in build pipeline [#823]
- Updated `package-lock.json` to fix an issue where `npm install` was broken due to newly `pegged` packages: [#823]
  - Ran `npm install @apollo/experimental-nextjs-app-support@0.12.2 react@19 react-dom@19` to fix
  - Removed unused `@fontsource/material-symbols-outlined`
  - Added a fix for a bug I discovered while on the `Add Section` page. Trying to select a pre-existing `Section` to create a new one from was broken due to `error handling` logic.
- Fixed middleware issue to add `dmspt` token cookie when a refreshToken is implemented [#676]
- Fixed some new errors related to an update in how data is passed to `logger` using `@elastic/ecs-pino-format`. Also, deleted `package-lock.json` and re-ran `npm install` to get clean packages after the npm debug and chalk compromise.
- Make `Tab` use `cursor: pointer`.
- Fix styling of `Toggle Switch` as toggle button was vertically off-centre.
- Fix styling of `Select` by setting `overflow: auto` on `ListBox` so that the list can scroll, and make `ListBoxItem` use `cursor: pointer`.
- Updated `Add Funder` page to use an `affiliationSearch` for the `funder name`. Updated `Edit Funding Details` page to disable the `funder name` on the form, and to add the `Add another` and `Remove funder` buttons [#656]
- Fixed issue where publishing a template with visibility `ORGANIZATION` was breaking because frontend is passing the invalid enum of `PRIVATE` instead of `ORGANIZATION` [#715]
- Fixed `sass` errors resulting from latest version updates [#751]
- Fixed issue with some breaking unit tests due to different timezones [#739]
- Fixed some issues on the `Project details` page [#734]
- Fixed issue with entered Affiliation `label` and `help` text not displaying on the `Question Preview` page
- Update `PlanOverviewQuestionPage` to make sure that `sample text` displays initially when it is present and `useSampleTextAsDefault` is set to true [#677]
- Updated `SectionTypeSelectPage` to only show the `Org section` and `best Practice section` headers if there are any to display [#702]
- Fixed issue with saved data not loading on the `Funding Detail` page after saving [#659]
- Flapping test `should render PlanCreate component with funder checkbox` required additional clearing of mocks to perform consistently.
- Bad test on DateRangeQuestionComponent tests that were consistently failing because of multiple matches in my environment.
- Fixed a bug on `Section` page where `question` text was used, when we should be referring to `section` instead [#666]
- Updated the `stripHtmlTags` function to include an option to strip only specific tags [#662]
- Updated the `Question details` page to strip the `questionText` of `HTML` tags [#662]
- Added `Load more` functionality for `/projects` page, using the new pagination [#647]
- Addressed issue where templates on `/projects/7/dmp/create` were showing `Not published`. They are all `versionedTemplates` so they are `published` [#646] d
- Fixed bug when hovering over the `Back` button turns text white (essentially invisible) [#651]
- Fixed inconsistent naming of question type `Affiliation Search` [#645]
- Fixed bugs related to the `Project Funding` page [#643,650]
  - Updated `Project Funding` page to use correct `projectFundingId` when clicking `edit` and changed the `fetchPolicy` to make sure it always grabs latest list of `funding` when the user arrives at the page
  - Added `commas` in between `funder` names on the `Project Overview` page
  - Updated the `Project Funding Search` page to use same `max-widths` for the funder lists
- Updated `ProjectsProjectPlanAdjustFunding` component to use `checkboxes` instead of `radiobuttons` for funders [#631]
  - Also, made sure to redirect users to the `Project Overview` page after saving `funding` selection
  - Added toast message
  - Made updates to assure that funder appears on the `Plan Overview` page after selecting it
  - Made sure that `funding` was saved correctly so that the saved selection displays when user returns
- Added the missing expanding/collapsing `Best Practices` to the sidebar of the `Question Details` page [#638]
- Removed errors that were being observed due to missing projectFundingId in mocks [#641]
- Fixed the contrast for the `Date Picker` on the `/projects/[projectId]/project` page by implementing the shared `Date Component` there [#597]
- Fixed bug where links in `Plan Overview` sidebar were of different sizes [#634]
- Fixed the bug where `Plan Status` was displayed in all caps in the sidebar for the `Plan Overview` page [#634]
- Make `plan` and `template` title changes more smooth by optimistically updating title [#625]
- Made the project title change smoother by optimistically updated title [#608]
- Updated the `Plan Overview` page so that it uses the `Plan` title instead of the `template` title [#303]
- Added the apiTarget to the funder search and popular funders queries, and make sure that we redirect to the correct page, depending on the apiTarget availability. [#596]
- Fixed a bug on the funding-search page, to make sure that popular funders are hidden when the user actions a search. [#596]
- Allow for tags in the checkbox group to wrap when the screen size is small. [#489]
- Changed the create-project flow [#681]
- Creating a new DMP should pre-select all project funders for the project. [#683]

### Removed

- Remove `QuestionTypeMap` from the `utils/questionTypeHandler` because it is now provided by `@dmptool/types` [#322](https://github.com/CDLUC3/dmsp_backend_prototype/issues/322)
- Remove the old QuestinType` graphQL query [#322](https://github.com/CDLUC3/dmsp_backend_prototype/issues/322)
- Deleted `__mocks__/mockQuestionTypes.json` as it is no longer needed [#322](https://github.com/CDLUC3/dmsp_backend_prototype/issues/322)

### Chore
- Fixed type error in `FormSelect` due to a change in `@types/react` versions when merging `stage` into `development`
- Addressed `fast-redact` but upgrading `pino` version
- Upgraded to `NextJS v15.5.2` to remove vulnerability and added `next-env.d.ts` to the ignore list for linting. [#751]

====================================================================================================================================

## All changes above the line happened after the merge to the main branch on July 21, 2025

### Added

- Added the `Mark as required` radio buttons on the `QuestionAdd` and `QuestionEdit` pages and updated unit tests [#562]
- Added three more `icons` for solid down, left and right arrows for the Date Picker [#597]
- Added a new `ExpandableContentSection` component that allows use to `expand` and `collapse` content, especially for the `Best Practices` right sidebar, but can be used for any content [#578]
- Added the `Question details` page that allows users to answer a question [#320]
- Added, or moved, the `question details` page from `projects/[projectId]/dmp/[dmpid]/q/[qid]` to `projects/[projectId]/dmp/[dmpid]/s/[sid]/q/[qid]` [#320]
- Added a new `useRenderQuestionField` hook to render different questions on the `Question details` page [#320]
- Added a test in `jest.setup.ts` to catch extraneous errors that are not tested or in a unit test.
- Added delete section functionality to template builder with confirmation modal, including translations, and tests
- Implemented a "Delete Question" feature on the question editing page with extra dialog and with tests
- Hook up the Plan Funder page with actual data so that the user can manage funders on their plan. [#363]
- Added popular funders to the funder search page when creating a new project. [#380]

### Updated

- Implement GraphQL integration for plan section questions page [#366]
- Add `PlanSectionQuestions` query to fetch questions by section ID

### Updated

- Updated `routePath` with route `projects.share.index` and updated unit test for `ProjectsProjectMembers` [#589]
- Updated `QuestionView` to use the new `ExpandableContentSection` for the `Best Practices` right sidebar [#578]
- Updated `graphqlHelper.ts` file to be more robust and correctly refresh tokens and refresh content when there is an `UNAUTHENTICATED` error [#320]
- Clean up connections page and buttons [#516]
- Added spacing on the `Account Profile` for the demo [#509]
- Updated `Account Profile` to use routePath() instead of hardcoded paths
- fix translation string to use the correct tags for the `Account Profile` [#515]

### Fixed

- Fixed the `Plan Overview` breadcrumb so that it includes a link to previous `Project Overview` page, as well as updating them to use `routePath` [#592]
- Fixed the `Edit` link in the `Project Funding` page so that it includes correct `projectFundingId` in path, and added missing translation keys and updated routes to use `routePath`, and updated unit test [#592]
- Added error message when the user clicks `Edit` for a funder that has no `funderProjectNumber` [#592]
- Adjusted field-level errors on `Edit Funding Details` page, and switched to using `routePath` for breadcrumbs and updated unit test [#592]
- Improved the spacing on the `projects/create-project` page. Set the standard `line-height` for `#App` to 1.5. Added a little bit of margin above a checkbox to make it align better with text [#595]
- Added another unit test for the `projects/create-project` page. Updated the routePath for that page to be correct [#595]
- Updated `Update` link for each section on `projects/[projectId]/dmp/[dmpid]` to `Start` if no questions have been answered yet in that section [#594]
- Improved color contrast on date picker [#597]
- Updated `projects/[projectId]/members` page to have consistent breadcrumbs as the `Project overview` page [#589]
- Prevent the project date from displaying if either `startDate` or `endDate` are not available [#588]
- Fixed broken links on the `Project overview` page that go to the individual plans [#575]
- Removed the `Sample text` field from the Question Add/Edit forms for all question types except for `textArea` [#564]

## v0.0.1

- Plan Manage Access [#299]
- Plan Publish [#299]
- Plan Downloads [#299]
-

### Added

- Added new `SectionEditContainer` component, for use in `QuestionEditCard`, to make reordering of questions more smooth [#207]
- Added new `updateQuestionDisplayorder` and `updateSectionDisplayOrder` server actions to update question and section order when users click the `onMoveUp` and `onMoveDown` arrows [#207]
- Added question type components to the components/Form/QuestionComponents directory [#157]
  - Updated the `QuestionAdd` and `QuestionEdit` components to allow for the adding and editing of the new question types [#157]
  - Updated `QuestionView` component, which is used to show a Preview of the Question that is being added or edited. Added handlers to allows users to interact with the questions in the Preview mode.
  - Built a `MultiSelect` component using an accessible approach [#157]
  - Created the `Number` and `Currency` components using React Aria Component's `NumberField`. This allows users to increment and decrement the field using buttons.[#157]
- Added support for question type JSON objects [#535]
- Added TinyMCE Editor component and added it to the styleguide [#462]
- Added a Load more button to the Add new section page [#450]
- PublishedSections graphQL query [#448]
- Added new Server Actions `addCollaboratorAction` [#381]
- Added `addProjectCollaborator` mutations [#381]
- Added help text to Section fields from the wireframe [#281]
- Added new serverAuthHelper.ts to work with Server Actions [#364]
- Added type check to pre-commit hook and fixed some issues in the app [#391]
- Add central "named routes" and helper function
- Project Create Flow [#299]
- Project Upload [#299]
- Project Funder [#299]
- Project Details [#299]
- Project Funders [#299]
- Project Members [#299]
- Project Research outputs [#299]
- Plan Adjust Funders [#299]
- PLan Adjust Members [#299]
- Plan Adjust Research outputs [#299]
- Projects dashboard [#175]
- Project Overview [#175]
- Plan Overview [#178]
- Plan Section and boilerplate tests [#178]
- Plan Question and boilerplate tests [#178]
- QuestionPreview component [#224]

### Updated

- Updated the template cards in `TemplateListPage` and `PlanCreate` components to use the `TemplateSelectListItem` component, which was updated to correctly display `ownerDisplayName`, `publish status` and `visibility` [#470]
- Updated the templates cards on `/template` page to match the look of the cards on the `/template/create` page [#470]
- Switched out all occurrences of Remirror/DMPEditor rich text editor with TinyMCE [#496]
- Convert all references to the old `Contributor` to `Member` and `Project/PlanFunder` to `Project/PlanFunding` to mimic language used in UI
- Added the `Account Profile` link on the home page for the demo and fixed the success message when updating profile [#508] [#512]
- Updated the "add new section" page to properly split our the affiliation's sections from best practice sections [#451]
- Changed all instances of TemplateVisibility.PRIVATE to TemplateVisibility.ORGANIZATION to accomodate backend changes and also made update to `template/[templateId]` so that the `Version` and `Last updated` titles don't show in `description` when values are undefined [#466]
- Updated `affiliations`, `myTemplates`, `publishedTemplates`, `myProjects` queries to handle the new pagination format. Updated the corresponding pages and components only enough to keep them working as-is [#180](https://github.com/CDLUC3/dmsp_backend_prototype/issues/180)
- Updated `templates/[templateId]/sections/new` to use the new PublishedSections query and to use the addSection mutation when the user selects a section to copy
- Hooked up `projects/[projectId]/dmp/[dmpId]/feedback/invite` page to backend data [#381]
- Removed from from the modal on `projects/[projectId]/dmp/[dmpId]/feedback/invite` to add a project member, since we don't have user data at that point [#381]
- Updated `Template` and `Projects` pages to work with the new pared down search result responses from GraphQL [#223] and [#218](https://github.com/CDLUC3/dmsp_backend_prototype/issues/218)
- Updated `Plan Members` page. Added mutation and queries, and a server action for handling addPlanContributors mutation [#364]
- Explicitly updated nextJS version to 14.2.25 due to an Authorization Bypass vulnerability in middleware (CVE-2025-29927) [#388]
- Added `white-space: pre-wrap` for Prosemirror due to warnings [#388]
- Update `Edit Member Details` page. Added mutation and queries, translations, and unit test [#367]
- Updated `PlanCreate` component so that it hooks up to real data. The functionality of the page is a little complicated, so I added a `CreatePlan.md` file to summarize what functionality is expected in the page. [#361]
- Updated the `Project Members` page with real data [#360]
- Updated `ProjectsProjectFundingEdit` component and moved the page under a new `[projectFunderId]` directory at `/projects/[projectId]/funder/[projectFunderId]/edit` [#357]
- Updated the `Project Overview` page [#339]
- Updated `/projects/[projectId]/project` page to hook it up to data [#351]
- Moved some shared test utils to jest.setup.ts or `__mocks__/common.ts` [#351]
- Updated translation content to use sentence-case rather than title case [#351]
- Made updates throughout the Template Builder flow to make the experience more consistent across pages, and fixed some bugs [#347]
- Updated `/projects/create-project` and added new shared RadioGroup and CheckboxGroup components [#332]
- Made updates to get Dockerfile.prod to work.
  - Updated Dockerfile.prod
  - Updated next.config.mjs to include output `standalone`
  - Updated `docker-compose.yml`
  - Fixed lint issues introduced with changes to field-level errors
- Updated `buildspec` to use the `Docker.prod` file
- Updated `/projects/page.tsx` to use real data and have search capabilities [#4]
- Updated `/template/[templateId]/access` page to hook it up to real data [#223]
- Updated the Edit Question `template/[templateId]/q/[q_slug]/page.tsx` with actual data from backend and added functionality for `options` question types [#188]
- Updated the Add Question`template/[templateId]/q/new/page.tsx` page with actual data from backend and added functionality to accomodate `option` question types. [#188]
- Updated shared FormInput component [#188]
- Updated `/template/create/page.tsx`[#186]
- Removed select-template page, since we are using `SelectExistingTemplate` in place of it [#186]
- Updated existing Templates graphql query with more fields [#186]
- Updated shared `FormInput` component to pass ‘ariaDescribedBy’ [#186]
- Updated `TemplateSelectListItem` [#186]
- Updated `/graphql/apollo-wrapper.tsx` since `@apollo/experimental-nextjs-app-support/ssr` was deprecated [#186]
- Updated `/graphql/graphqlHelper.ts` with a call to `client.resetStore’` This should refetch user’s data when refreshAuthTokens() is called [#186]
- Updated `refreshAuthTokens` function with ability to pass in cookies [#186]
- Updated `middleware` to call refreshAuthTokens when there is no auth token cookie [#186]
- Updated `QuestionTypeSelectPage`- hooked up to real data and updated code [#220]
- Renamed previous `QuestionEdit` component to `QuestionEditCard` for more specificity [#220]
- Added the `QuestionView` component which will render the question fields based on the question type. [#379]
- Integrated the `QuestionPreview` and `QuestionView` components on the add and edit question pages. [#379]
- Removed unused component `EditQuestionPage` to avoid confusion with other components. This is a legacy component. [#379]
- Added a FunderSearch component that performs a funder search, and returns the
  results. [#335]
- Added a the `LoggedError` custom error type to simplify logging of errors by. [#335]
- Updated the funding-search page under create project to use the new funder
  search component. Also hooked up the capability to select a funder and
  associate it with the project. [#335]
- Updated some of the other Funder pages under create project so that they link
  and redirect to the correct named urls for the funder search page. [#335]

### Fixed

- Fixed type error related to `confirm-email` page that was breaking build
- Fixed issue with search fields not looking good on smaller devices. Made updates to get the `Search` button to wrap for mobile [#488]
- Fixed breaking build by addressing a type error
- Fixed missing translations on User Profile page [#488]
- Fixed issue with TypeAheadWithOther dropdown menu displaying when user clicks the `Edit` button on `User profile` page [#511]
- Fixed issue with Template not refreshing after published [#455]
  - Added a server endpoint env variable for graphqlServerActionHandler.ts since env variables prefixed with NEXT_PUBLIC do not work on the server side [#455]
- Added Rich Text Editor for Sample Text in the Question forms [#456]
  - Adjusted widths of Edit template title to accomodate for very long titles [#456]
- Fixed bugs related to the template builder flow
  - Fixed Preview page to not display HTML at top for Requirements [#449]
  - Added redirect back to Edit Template page when user creates a new Section [#452]
  - On `/template` page, fixed the `published` and `unpublished` labels on the list items because they were reversed [#453]
  - Replaced hard-coded org names with the actual org names in text on `Manage access` page, and fixed archive modal title to `Confirm removal` [#454]
  - Changed `Published` to `Last updated` on `/template/[templateId]` page and fixed missing translation for `Load 3 more`. Also when adding a new `Question`, the button should say `Save and add` and when editing an existing question, the form button should say `Save and update`. [#455]
  - Added missing space after `Guidance by` and `These are requirements by` in the Preview page [#455]
- Fix logger path issue in auth.ts [#441]
- Added handling of scenario where no jwt payload is returned when getting languageId in middleware [#441]
- Fixed ordering issue for Sections on the Edit Templates page [#436]
- Fixed missing `as deps` in `Dockerfile.prod`.
- Fixed wrong node image in `Dockerfile.prd`. Also fixed a number of linting issues.
- Fixed bug in `/projects/[projectId]/dmp/[dmpId]/download` because of unused `FileIcon` [#376]
- Fixed bug where `/template` page was continuosly refreshed when no data was returned [#351]
- Fixed that didn't show the current title when editing a template name [#475]
- Added the missing button to create a new template from scratch [#474]
- Fixed typo and ensure that correct visibility text displays when changing the
  Private/Public status in the Template Publish Modal [#483]

### Chore

- Updated a number of packages, such as next, react-aria-components, eslint, next-intl, etc [#529]
- Updated a number of unit tests to address the reduced coverage of branch tests [#529]
- Fixed sass warnings and errors introduced with latest updates to packages [#529]
- Updated and added unit tests to increase coverage in the app [#490]
- Updated and improved the cypress functional tests to fix them and updated some cypress documentation in the README.md file [#490]
- # Updated NodeJS version to v22 [#144]

### Added

- Added real data and functionality to the PlanOverviewPage, `/projects/[projectId]/dmp/[dmpId]` [#362]
- Added new right sidebar with new multi-page Publish modal with checklist data, and `status` select [#362]
- Added `/projects/[projectId]/project-funding`, copying over the static code from `/projects/[projectId]/create-project/funding`. Updated
  page to use shared RadioGroupComponent, and updated RadioGroupComponent to use description [#336]
- Added new `QuestionEdit` and `QuestionTypeCard` components [#220]
- Added new Question and QuestionOption types [#188]
- Added a new FormTextArea component [#188]
- Added new QuestionOptionsComponent for handling the `options` question types in the form [#188]
- Added new QuestionAdd component for adding a new question [#188]
- Added new `QuestionsDisplayOrder` and `Question` queries and `AddQuestion` and `UpdateQuestion` mutations [#188]
- Added useSampleTextAsDefault checkbox for text field question types [#188]

### Fixed

- Fixed `EvalError: Code generation from strings ` bug that was occurring because I set the environment in docker-compose.yml to production

====================================================================================================





### Update
- Update main branch with latest development branch

===============================================================================================================
### Updated

=======

- Updated `/graphql` files to include new backend error objects [#308]
- Updated `/account/profile/page.tsx` to display the new backend field level errors [#308]
- Updated `/template/[templateid]/page.tsx` to display the new backend field level errors [#308]
- Updated `/template/[templateid]/section/page.tsx` to display the new backend field level errors [#308]
- Updated `/template/[templateid]/section/create/page.tsx` to display the new backend field level errors [#308]
- Updated `/template/[templateid]/section/[section_slug]/page.tsx` to display the new backend field level errors [#308]
- Updated `/template/create/page.tsx`[#186]
- Removed select-template page, since we are using `SelectExistingTemplate` in place of it [#186]
- Updated existing Templates graphql query with more fields [#186]
- Updated shared `FormInput` component to pass ‘ariaDescribedBy’ [#186]
- Updated `TemplateSelectListItem` [#186]
- Updated `/graphql/apollo-wrapper.tsx` since `@apollo/experimental-nextjs-app-support/ssr` was deprecated [#186]
- Updated `/graphql/graphqlHelper.ts` with a call to `client.resetStore’` This should refetch user’s data when refreshAuthTokens() is called [#186]
- Updated `refreshAuthTokens` function with ability to pass in cookies [#186]
- Updated `middleware` to call refreshAuthTokens when there is no auth token cookie [#186]
- Updated some pages with toast messages, and updated toast files [#231]
- Added Portuguese translations for newly added translation keys [#231]
- Updated version of `next` to `14.2.22` [#231]
- Updated app/template/[templateId]/section/[section_slug] to hook it into backend data [#217]
- Updated app/template/[templateId]/section/create page to use Remirror text editors, and checkboxes with info popovers [#187]
- Updated DMPEditor to use a skeleton while the text editors are loading, since it can be slow [#187]
- Updated app/template/[templateId]/section/new page to hook it up to backend data, handle errors, and add translations [#189]
- Updated app/template/[templateId] page to hook it up to the backend and handle errors and translations[#206]
- Updated app/[locale]/template page to hook it up to backend and handle errors and translations[#82]
- Updated account/profile, email/email-confirmed, email/verification-failed, and account/connections to use new, shared layout containers [#185]
- Refactored font family usage for consistency.
- Updated the Login and Signup pages to function as the wireframes. [#117]
- Updated TypeAheadWithOther component to be a bit more generic [#117]
- Cleaned up some of the error handling code so that it's easier to debug and
  trace issues. [#117]

### Added

- Added `MyVersionedTemplates` and `PublishedTemplates` graphql queries and `addTemplateMutation` graphql mutation [#186]
- Created the `SelectExistingTemplate` component which displays the publishedTemplates and allows user to filter view [#186]
- Created `TemplateList` component used by `SelectExistingTemplate`[#186]
- Added Toast Message capabilities using **React Aria Component's use Toast**. [#211]
- Project overview page [#175]
  - Moved pages under [locale] folder
  - dummy portuguese brazilian translation
- New translation updates [#160]
  - Installed next-intl, and created a /messages directory for content, and /i18n directory for next-intl request and routing
  - Moved pages under dynamic folder [locale]
  - Updated middleware to add correct locale based on path, token, browser preference, or default to english
  - Added provider NextIntlClientProvider to layout.tsx
  - Added a test page, locale-test, where you can see demos of translations
  - Added NextIntlClientProvider to the @/utils/test-utils
  - Updated next.config.mjs to use next-intl plugin
- Template Builder: Access Page [#166]
- Created css for sectionContainer, sectionHeader, sectionContent for generic sections
- Updated mobile breadcrumbs css
- Added ability to add 'Other' affiliation in the User Profile page [#170]
- Created create/select-template page and test [#167]
  - Created new components for this page
  - Created Template Select List Item
- Template Builder: Access Page [#166]
- Created css for sectionContainer, sectionHeader, sectionContent for generic sections
- Updated mobile breadcrumbs css
- Added ability to add 'Other' affiliation in the User Profile page [#170]
- Added new components [#111]
  - Clickable interface for Template List
  - Clickable interface for Template Edit
  - Clickable interface for Template Section Edit/New
  - Clickable interface for Template Question Edit/New
  - Clickable interface that starts "Publish Template" flow
  - Added component for TemplateListItem
  - Added component for Section Header Edit
  - Added component for Question Card Edit
  - Added component for "Add question" button
  - Added component for "Add section" button
- Added new User Profile page [#124]
  - Created a separate UpdateEmailAddress component
  - Created EmailAddressRow component
  - Created shared Form components, FormInput and FormSelect
  - Created temporary RightSidebar component
  - Updated TypeAheadWithOther component to work with parent components
  - Added some shared css for shared form components in a new style file called \_form.scss
  - Added corresponding unit tests
- Added spacing guidelines to the styleguide
- Cleaned up the styleguide and added additional text to explain the spacing guidelines
- Created SCSS helpers/mixins to generate alot of our font sizes,colours and spacing
- Added `LayoutContainer`, `ContentContainer` and their related styles. [#154]
- Added a responsive size hook for react that will return the window size on
  resize. [#154, #110]
- Added a `LayoutWithSidebar` container, along with a related
  `SidebarContainer`, and documented their use on the styleguide. [#154, #110]

### Fixed

- Remove duplicate graphqlServerActionHandler.ts and serverAuthHelper.ts
- Fixed `login` 404 error issue and looping issue in middleware [#194]
- Removed old `app/layout.tsx` page. It was causing errors, since we have one located at `app/[locale]/layout.tsx` now.
- Fixed a failing unit test and build for `confirm-email` component when backend server was not running [#180]
- Removed use of NEXT_PUBLIC_GRAPHQL_ENDPOINT env variable, since it was a duplicate of NEXT_PUBLIC_SERVER_ENDPOINT [#171]

### Added

=======

- Made some updates related to authentication [#142]
- Updated middleware to redirect to /login if both access token and refresh token is missing
- Updated refreshAuthTokens method to throw errors that will be caught gqlErrorHandler
- Updated gqlErrorHandler to redirect to /login when refreshAuthTokens returns an error
- Updated template history page to use handleApolloErrors, and updated handleApolloErrors to have a router param
- Updated client-graphql-test page to pass router to handleApolloErrors
- Added confirm-email server-side component, and email-confirmed and verification-failed client components for email alias verification [#125]
- Checkbox & Checkbox group component [#75]
- Radio component [#75]
- Select component [#75]
- Basic Cards [#75]
- Section header component [#75]
- Question card component [#75]
- Tabs component [#75]
- Template Overview - blocked out page for component builder assistance [#75]
- Template Edit Section - blocked out page for component builder assistance [#75]
- Template Edit Question - blocked out page for component builder assistance [#75]
- Set up a directory for the account pages, and added the Connections page [#128]
- Added new shared LeftSidebar, TooltipWithDialog, and ButtonWithImage components. Updated styleguide with the new TooltipWithDialog and ButtonWithImage components. [#128]
- Fixed type bugs in the template history page which was breaking the build.
- Added csrf token to header for /login and /signup page and error handling to refresh csrf and auth tokens [#116]
- Added cypress for functional tests. Added a functional test to check for HTTP-only auth cookies [#116]
- Added the Template History page [#86]
- Added more documentation to README.md [#91]
- Added existing header and footer from production to app [#89]
- Added two new TypeAhead/Autosuggest components, one with and one without the "Other" option [#10]
- Added the use of graphql-codegen to generate types for graphql requests [#10]
- Added Material Symbols and a custom `DmpIcon` component that will render a specific icon using it's short-code. [#80]
- Added custom SVG icon set to be used by `DmpIcon` [#80]
- Added the initial version of our custom ReMirror text editor [#74].

### Updates

- Button styles [#75]
- Text input styles [#75]
- Made updates to change 'name' to 'displayName' for affiliations, in response to backend changes [#137]
- Updated endpoints for 'signin' and 'signup' to be 'apollo-signin' and 'apollo-signup' [#99]

### Fixed

- Fixed Logout button/link not working in header [#103]
- Fixed an issue with docker-compose not starting the app [#93]

## v0.0.1

### Added

- Added logout api and link [#65]
- Added loading state and velocity controls to the login and signup forms [#66]
- Added placeholders for /signup and /login pages and added a new api endpoint for setting the access token in a cookie [#19]
- Added .editorconfig file to help maintain consistent coding styles [#37]
- Added Styleguide Page, as well as custom components and css that are only to
  be used on the Styleguide. [#51]
- Added some default CSS variables that we can hook into when we start doing the
  theming, many of these variables are also used by the newly added `react-aria`
  components. [#51]

### Updates

- Updated endpoints for 'signin' and 'signup' to be 'apollo-signin' and 'apollo-signup' [#99]
- Updates for auth pages to accomodate backend changes [#63]
- Updated lib/graphql/client.ts with adding an errorLink to the client instance, and intercepting specific error types or codes to handle them differently if we want.[#29]
- Updated lib/graphql/server/queries/dmpDataQueries.ts to 1) Map the error code to a user friendly message using a hash like utils/userFriendlyErrorMessage, log the error to the new utils/logger.ts, and throw an error that will be caught by the "try-catch" in the client- or server-side component. logger.ts can be used directly in client- and server-components as well.[#29]
- Updated dmps/[...slug]/page.tsx to throw the returned error in the 'try-catch'[#29]
- Installed pino and @elastic/ecs-pino-format to output formatted logs[#29]
- Added app/not-found.tsx to handle 404 errors[#29]
- Added app/error.tsx to handle server-side errors. Client components will most likely display returned errors in the page using useState().[#29]
- Moved `globals.scss` to the `styles` directory. The goal here is to have
  global style in their own directory. [#51]
- Extracted some common styles for Typography, Elements, and Page into their own
  css modules, which we import in globals. [#51]
- Updated `layout.tsx` to use the code formatting for classes and id's as
  outline in the styleguide. [#51]
- Updated some CSS classes to remove verbose naming. [#51]

### Fixed

- Fixed an issue with docker-compose not starting the app [#93]
