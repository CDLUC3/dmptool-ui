import { routePath, RouteName } from "@/utils/routes";

export interface NavItem {
  /** Translation key in the `Header` namespace */
  labelKey: string;
  route: RouteName;
  /** Only shown to ADMIN and SUPERADMIN users */
  adminOnly?: boolean;
}

export const mainNavItems: NavItem[] = [
  { labelKey: "menuProjectsPlans", route: "projects.index" },
  { labelKey: "menuTemplates", route: "template.index", adminOnly: true },
];

/** Primary call to action for logged-in users, shown as a button at the end of the navigation */
export const createPlanNavItem: NavItem = { labelKey: "menuCreatePlan", route: "projects.create.start" };

export const publicNavItems: NavItem[] = [
  { labelKey: "menuPublicPlans", route: "app.publicPlans" },
  { labelKey: "menuFunderRequirements", route: "app.funderRequirements" },
];

export const aboutNavItems: NavItem[] = [
  { labelKey: "subMenuLearnMore", route: "app.about" },
  { labelKey: "subMenuMembership", route: "app.membership" },
  { labelKey: "subMenuFAQs", route: "app.faq" },
  { labelKey: "subMenuEditorial", route: "app.editorialBoard" },
  { labelKey: "subMenuLogos", route: "app.logos" },
];

export const accountNavItem: NavItem = { labelKey: "subMenuAccountOverview", route: "account.index" };

/** Same items, order and routes as the Account overview page; labels are keys in the `Account` namespace */
export const accountNavItems: NavItem[] = [
  { labelKey: "sections.userProfile.items.profile.title", route: "account.profile" },
  { labelKey: "sections.userProfile.items.password.title", route: "account.password" },
  { labelKey: "sections.userProfile.items.connections.title", route: "account.connections" },
  { labelKey: "sections.userProfile.items.notifications.title", route: "account.notifications" },
];

export const adminNavItem: NavItem = { labelKey: "subMenuAdminOverview", route: "admin.index" };

/** Same items, order and routes as the Admin overview page; labels are keys in the `Admin` namespace */
export const adminNavItems: NavItem[] = [
  { labelKey: "sections.organisationTemplatesAndPlans.items.notifications.title", route: "admin.notifications" },
  { labelKey: "sections.organisationTemplatesAndPlans.items.organizationTemplates.title", route: "admin.templates" },
  { labelKey: "sections.organisationTemplatesAndPlans.items.templateCustomizations.title", route: "template.customizations" },
  { labelKey: "sections.organisationTemplatesAndPlans.items.guidance.title", route: "admin.guidance.index" },
  { labelKey: "sections.organisationTemplatesAndPlans.items.projectAndPlans.title", route: "admin.projects" },
  { labelKey: "sections.organizationSettings.items.editOrganizationDetails.title", route: "admin.organizationDetails" },
  { labelKey: "sections.organizationSettings.items.schoolsDepartments.title", route: "admin.departments" },
  { labelKey: "sections.organizationSettings.items.manageUserAccounts.title", route: "admin.users" },
  { labelKey: "sections.organizationSettings.items.customizeEmailText.title", route: "admin.emailPreferences" },
  { labelKey: "sections.organizationSettings.items.requestFeedbackOptions.title", route: "admin.feedbackOptions" },
  { labelKey: "sections.reporting.items.usageStatistics.title", route: "admin.statistics" },
];

export function navItemHref(item: NavItem): string {
  return routePath(item.route);
}
