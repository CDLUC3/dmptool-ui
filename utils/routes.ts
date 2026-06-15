// utils/routes.ts

/*Usage*/
/*
Basic - no idea if we are going to namespace it just an example
routePath('app.login');
Output: "/en-US/login"

Route with Path Parameters
routePath('projects.show', { projectId: '123' });
Output: "/en-US/projects/123"

routePath('projects.dmp.versionedSection', { projectId: '123', dmpId: '456', versionedSectionId: '789' });
Output: "/en-US/projects/123/dmp/456/s/789"

Route with Query Parameters
routePath('projects.index', {}, { page: 2, limit: 10 });
Output: "/en-US/projects?page=2&limit=10"

routePath('projects.index', {}, { filters: ['active', 'draft'] });
Output: "/en-US/projects?filters[]=active&filters[]=draft"

Example of both params and query string
routePath('projects.members.search', { projectId: '123' }, { role: 'PI', status: 'active' });
Output: "/en-US/projects/123/members/search?role=PI&status=active"

Different locales can be passed if needed but defaults to en-US and should still work with middleware
routePath('projects.show', { projectId: '123' }, {}, 'pt-BR');
Output: "/pt-BR/projects/123"
*/

// Define query param value types
type QueryParamValue =
  string
  | number
  | boolean
  | string[]
  | number[]
  | undefined;

export const supportedLocales = ['en-US', 'pt-BR'] as const;
export type SupportedLocale = typeof supportedLocales[number];

const routes = {
  // Home route
  'app.home': '/',
  "app.login": '/login',

  // Project routes
  'projects.index': '/projects',
  'projects.show': '/projects/:projectId',
  'projects.create': '/projects/create-project',
  'projects.create.funding.search': '/projects/:projectId/funding-search',
  'projects.create.funding.check': '/projects/:projectId/project-funding',
  'projects.create.projects.search': '/projects/:projectId/projects-search',
  'projects.project.info': '/projects/:projectId/project',
  'projects.upload': '/projects/:projectId/upload',
  'projects.fundings.index': '/projects/:projectId/fundings',
  'projects.fundings.show': '/projects/:projectId/fundings/:projectFundingId',
  'projects.fundings.search': '/projects/:projectId/fundings/search',
  'projects.fundings.add': '/projects/:projectId/fundings/add',
  'projects.fundings.edit': '/projects/:projectId/fundings/:projectFundingId/edit',
  'projects.members.index': '/projects/:projectId/members',
  'projects.members.create': '/projects/:projectId/members/create',
  'projects.members.edit': '/projects/:projectId/members/:memberId/edit',
  'projects.members.search': '/projects/:projectId/members/search',
  'projects.outputs.index': '/projects/:projectId/research-outputs',
  'projects.outputs.edit': '/projects/:projectId/research-outputs/edit',
  'projects.share.index': '/projects/:projectId/share',
  'projects.related-works.index': '/projects/:projectId/related-works',
  'projects.related-works.add': '/projects/:projectId/related-works/add',

  // DMP (Data Management Plan) routes
  'projects.dmp.index': '/projects/:projectId/dmp',
  'projects.dmp.start': '/projects/:projectId/dmp/start',
  'projects.dmp.show': '/projects/:projectId/dmp/:dmpId',
  'projects.dmp.download': '/projects/:projectId/dmp/:dmpId/download',
  'projects.dmp.fundings': '/projects/:projectId/dmp/:dmpId/fundings',
  'projects.dmp.members': '/projects/:projectId/dmp/:dmpId/members',
  'projects.dmp.versionedQuestion': '/projects/:projectId/dmp/:dmpId/q',
  'projects.dmp.versionedQuestion.detail': '/projects/:projectId/dmp/:dmpId/s/:versionedSectionId/q/:versionedQuestionId',
  'projects.dmp.versionedSection': '/projects/:projectId/dmp/:dmpId/s/:versionedSectionId',
  'projects.dmp.customSection': '/projects/:projectId/dmp/:dmpId/cs/:csid',
  'projects.dmp.customQuestion.underVersionedSection': '/projects/:projectId/dmp/:dmpId/s/:sid/cq/:cqid',
  'projects.dmp.customQuestion.underCustomSection': '/projects/:projectId/dmp/:dmpId/cs/:csid/cq/:cqid',
  'projects.dmp.create': '/projects/:projectId/dmp/create',
  'projects.dmp.upload': '/projects/:projectId/dmp/upload',

  'projects.dmp.feedback': '/projects/:projectId/dmp/:dmpId/feedback',
  'projects.collaboration': '/projects/:projectId/collaboration',
  'projects.collaboration.invite': '/projects/:projectId/collaboration/invite',
  'projects.dmp.related-works': '/projects/:projectId/dmp/:dmpId/related-works',
  'projects.dmp.related-works.add': '/projects/:projectId/dmp/:dmpId/related-works/add',

  // Template
  'template.index': '/template',
  'template.show': '/template/:templateId',
  'template.access': '/template/:templateId/access',
  'template.history': '/template/:templateId/history',
  'template.q': '/template/:templateId/q',
  'template.q.slug': '/template/:templateId/q/:q_slug',
  'template.q.new': '/template/:templateId/q/new',
  'template.section': '/template/:templateId/section',
  'template.section.slug': '/template/:templateId/section/:section_slug',
  'template.section.create': '/template/:templateId/section/create',
  'template.section.new': '/template/:templateId/section/new',
  'template.create': '/template/create',
  'template.edit': '/template/:templateId/edit',
  'template.customizations': '/template/customizations',
  'template.customize': '/template/customizations/:templateCustomizationId',
  'template.customize.sectionId': '/template/customizations/:templateCustomizationId/section/:versionedSectionId',
  'template.customize.question': '/template/customizations/:templateCustomizationId/q/:versionedQuestionId',
  'template.customSection': '/template/customizations/:templateCustomizationId/customSection/:customSectionId',
  'template.customize.section.create': '/template/customizations/:templateCustomizationId/section/create',
  'template.customize.question.create': '/template/customizations/:templateCustomizationId/q/new',
  'template.customQuestion': '/template/customizations/:templateCustomizationId/customQuestion/:customQuestionId',

  // account/profile
  'account.index': '/account',
  'account.profile': '/account/profile',
  'account.password': '/account/update-password',
  'account.connections': '/account/connections',
  'account.notifications': '/account/notifications',

  // Admin routes
  'admin.index': '/admin',
  'admin.notifications': '/admin/notifications',
  'admin.templates': '/admin/templates',

  // Guidance routes
  'admin.guidance.index': '/admin/guidance',
  'admin.guidance.groups.index': '/admin/guidance/groups/:groupId',
  'admin.guidance.groups.edit': '/admin/guidance/groups/:groupId/edit',
  'admin.guidance.groups.create': '/admin/guidance/groups/create',
  'admin.guidance.groups.texts.create': '/admin/guidance/groups/:groupId/create',
  'admin.guidance.groups.texts.edit': '/admin/guidance/groups/:groupId/edit/:textId',

  'admin.projects': '/admin/projects',
  'admin.organizationDetails': '/admin/organization-details',
  'admin.departments': '/admin/departments',
  'admin.users': '/admin/users',
  'admin.emailPreferences': '/admin/email-preferences',
  'admin.feedbackOptions': '/admin/feedback-options',
  'admin.statistics': '/admin/statistics',


  // Help pages
  'help.dmp.download': '/help/dmp/download',


} as const;

type RoutesMap = typeof routes;

/**
 * Helper type for documentation purposes
 * Combines route names with their path patterns for better IDE hover documentation
 * @example 'projects.show ➜ /projects/:projectId'
 */
type RouteNameWithPath = {
  [K in keyof RoutesMap]: `${K} ➜ ${RoutesMap[K]}`
}[keyof RoutesMap];

// Only used for documentation - not directly referenced in code
// This prevents unused type lint errors
declare const _ROUTE_DOCS: RouteNameWithPath;


/**
 * Generate a URL path for a named route with parameters and query string.
 *
 * Route mappings are available as:
 * @example 'projects.show ➜ /projects/:projectId'
 * @see {routes} for all available route definitions
 * @see {RouteNameWithPath}
 *
 * @param name - Route identifier (`RouteName`) - e.g., 'projects.show'
 * @param params - Route parameters (optional)
 * @param query - Query parameters (optional)
 * @param locale - Optional locale (default: 'en-US')
 * @returns Fully constructed URL path
 */
export function routePath(
  name: keyof RoutesMap,
  params: Record<string, string | number> = {},
  query: Record<string, QueryParamValue> = {},
  locale?: string
): string {

  // Default to 'en-US' if no locale is provided
  if (!locale) {
    locale = 'en-US'; // Always set a default value
  }

  // Automatically detect and validate locale from URL if not provided or invalid
  if (!supportedLocales.includes(locale as SupportedLocale) && typeof window !== 'undefined') {
    // Only try to detect from URL on client-side, because NextJs also has server-side rendering
    const segments = window.location.pathname.split('/');
    const potentialLocale = segments[1];
    if (supportedLocales.includes(potentialLocale as SupportedLocale)) {
      locale = potentialLocale;
    } else {
      locale = 'en-US'; // explicit fallback
    }
  }

  // Get the path pattern
  const path_pattern = routes[name];

  if (!path_pattern) {
    throw new Error(`Route not found: ${name}`);
  }

  let path = path_pattern.replace(/:([a-zA-Z_]+)/g, (_, paramName) => {
    if (!(paramName in params)) {
      throw new Error(`Missing required parameter: ${paramName} for route ${name}`);
    }
    return encodeURIComponent(String(params[paramName]));
  });

  // Handle query params
  const queryParams: string[] = [];

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      value.forEach((v) => {
        queryParams.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(v))}`);
      });
    } else {
      queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  const queryString = queryParams.join('&');
  if (queryString) {
    path += `?${queryString}`;
  }

  if (path === '/') {
    return `/${locale}`;
  }

  return `/${locale}${path}`;
}

// Type to get all available route names for better IDE support
export type RouteName = keyof typeof routes;
export { routes };
