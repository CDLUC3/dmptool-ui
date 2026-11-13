import React from "react";
import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import Header from "../index";
import "@testing-library/jest-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useCsrf } from "@/context/CsrfContext";
import { useQuery } from "@apollo/client/react";
import logECS from '@/utils/clientLogger';

expect.extend(toHaveNoViolations);

jest.mock("@apollo/client/react", () => ({
  useQuery: jest.fn(),
}));

const mockMe = (role: string) => {
  (useQuery as unknown as jest.Mock).mockReturnValue({ data: { me: { role } } });
};

jest.mock("@/context/AuthContext", () => ({
  useAuthContext: jest.fn(() => ({
    clearAuthData: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("@/context/CsrfContext", () => ({
  useCsrf: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
  usePathname: jest.fn(() => "/"),
}));

jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

jest.mock("@/utils/routes", () => ({
  routePath: jest.fn((route: string) => `/${route}`),
}));

jest.mock("@/components/LanguageSelector", () => {
  return function LanguageSelector() {
    return <div>Language Selector</div>;
  };
});

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: ({ icon }: { icon: { iconName?: string } }) => (
    <span data-testid="fontawesome-icon">{icon?.iconName || "icon"}</span>
  ),
}));

jest.mock("@/components/Form", () => ({
  TransitionLink: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("Header", () => {
  const mockSetIsAuthenticated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      setIsAuthenticated: mockSetIsAuthenticated,
      clearCache: jest.fn(),
      clearAuthData: jest.fn().mockResolvedValue(undefined),
    });
    (useCsrf as jest.Mock).mockReturnValue({
      getCsrfToken: jest.fn().mockResolvedValue("mock-csrf-token"),
    });
    mockMe("ADMIN");
  });

  it("should render the header with logo and main navigation", () => {
    render(<Header />);

    // Check for the logo
    expect(screen.getByAltText("DMP Tool")).toBeInTheDocument();

    // Check for key navigation items (authenticated user) - expect 2 instances (desktop and mobile)
    expect(screen.getAllByText("menuProjectsPlans")).toHaveLength(2);
    expect(screen.getAllByText("menuCreatePlan")).toHaveLength(2);
    expect(screen.getAllByText("menuPublicPlans")).toHaveLength(2);
    expect(screen.getAllByText("menuAccount")).toHaveLength(2);
  });

  it("should show login/signup buttons for non-authenticated users", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      setIsAuthenticated: jest.fn(),
    });

    render(<Header />);

    expect(screen.getAllByText("btnLogin")).toHaveLength(2); // Desktop and mobile
    expect(screen.getAllByText("btnSignup")).toHaveLength(2); // Desktop and mobile
  });

  it("should handle mobile menu toggle", () => {
    render(<Header />);

    // The closed menu is off screen, so it must be out of the tab order and the accessibility tree
    const mobileMenu = document.getElementById("mobile-navigation");
    expect(mobileMenu).toHaveAttribute("inert");

    const mobileMenuButton = screen.getByAltText("Mobile menu");
    fireEvent.click(mobileMenuButton);

    // Mobile menu should be visible
    expect(mobileMenu).toHaveClass("showMenu");
    expect(mobileMenu).not.toHaveAttribute("inert");

    const closeButton = screen.getByAltText("Close mobile menu");
    fireEvent.click(closeButton);

    // Mobile menu should be hidden
    expect(mobileMenu).not.toHaveClass("showMenu");
    expect(mobileMenu).toHaveAttribute("inert");
  });

  it("should handle logout button click", async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    ) as jest.Mock;

    render(<Header />);

    const logoutButton = screen.getAllByText("btnLogout")[0];
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/sign-out"),
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": "mock-csrf-token",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/app.login");
    });
  });

  it("should handle login button click", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      setIsAuthenticated: jest.fn(),
    });

    render(<Header />);

    const loginButton = screen.getAllByText("btnLogin")[0];
    fireEvent.click(loginButton);

    expect(mockPush).toHaveBeenCalledWith("/app.login");
  });

  it("should render dropdown menus", () => {
    render(<Header />);

    // Check that dropdown triggers exist (expect 2 instances - desktop and mobile)
    expect(screen.getAllByText("menuAbout")).toHaveLength(2);
    expect(screen.getAllByText("menuAdmin")).toHaveLength(2);
  });

  it("should use routePath for navigation links", () => {
    const { routePath } = jest.requireMock("@/utils/routes");

    render(<Header />);

    // Verify routePath was called for key routes
    expect(routePath).toHaveBeenCalledWith("app.home");
    expect(routePath).toHaveBeenCalledWith("projects.index");
    expect(routePath).toHaveBeenCalledWith("projects.create.start");
  });

  it("should handle authentication state changes", () => {
    const { rerender } = render(<Header />);

    // Initially authenticated
    expect(screen.getByTestId("accountMenuDesktop")).toBeInTheDocument();
    expect(screen.getByTestId("logoutButtonMobile")).toBeInTheDocument();
    expect(screen.queryByText("btnLogin")).not.toBeInTheDocument();

    // Change to non-authenticated
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      setIsAuthenticated: jest.fn(),
    });

    rerender(<Header />);

    expect(screen.getAllByText("btnLogin")).toHaveLength(2);
    expect(screen.queryByTestId("accountMenuDesktop")).not.toBeInTheDocument();
    expect(screen.queryByText("btnLogout")).not.toBeInTheDocument();
  });

  it("should render the language selector once, in the utility bar", () => {
    const { container } = render(<Header />);

    const utilityBar = container.querySelector(".utilityBar") as HTMLElement;
    expect(within(utilityBar).getByText("Language Selector")).toBeInTheDocument();
    expect(screen.getAllByText("Language Selector")).toHaveLength(1);
  });

  it("should show the language selector to logged out users", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      setIsAuthenticated: jest.fn(),
    });

    render(<Header />);

    expect(screen.getByText("Language Selector")).toBeInTheDocument();
  });

  it.each(["ADMIN", "SUPERADMIN"])("should show Templates and Admin to %s users", (role) => {
    mockMe(role);

    render(<Header />);

    const templateLinks = screen.getAllByText("menuTemplates");
    expect(templateLinks).toHaveLength(2);
    templateLinks.forEach((label) => {
      expect(label.closest("a")).toHaveAttribute("href", "/template.index");
    });
    expect(screen.getAllByText("menuAdmin")).toHaveLength(2);
  });

  it("should hide Templates and Admin from researchers", () => {
    mockMe("RESEARCHER");

    render(<Header />);

    expect(screen.queryByText("menuTemplates")).not.toBeInTheDocument();
    expect(screen.queryByText("menuAdmin")).not.toBeInTheDocument();
    expect(screen.getAllByText("menuAccount")).toHaveLength(2);
  });

  it("should not query the current user when logged out", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      setIsAuthenticated: jest.fn(),
    });

    render(<Header />);

    expect(useQuery).toHaveBeenCalledWith(expect.anything(), { skip: true });
  });

  it("should link desktop and mobile menu items to the same destinations", async () => {
    const user = userEvent.setup();
    const { container } = render(<Header />);
    const desktopMenu = container.querySelector(".navigation") as HTMLElement;
    const mobileMenu = document.getElementById("mobile-navigation") as HTMLElement;
    const hrefOf = (scope: HTMLElement, label: string) =>
      within(scope).getByText(label).closest("a")?.getAttribute("href");

    ["menuProjectsPlans", "menuCreatePlan", "menuPublicPlans", "menuFunderRequirements"].forEach((label) => {
      expect({ label, href: hrefOf(mobileMenu, label) }).toEqual({ label, href: hrefOf(desktopMenu, label) });
    });

    // Desktop dropdown items are only rendered while their menu is open
    const menus = [
      {
        testId: "aboutMenuDesktop",
        name: "menuAbout",
        labels: ["subMenuLearnMore", "subMenuMembership", "subMenuFAQs", "subMenuEditorial", "subMenuLogos"],
      },
      {
        testId: "adminMenuDesktop",
        name: "menuAdmin",
        labels: [
          "sections.organisationTemplatesAndPlans.items.notifications.title",
          "sections.organisationTemplatesAndPlans.items.organizationTemplates.title",
          "sections.organisationTemplatesAndPlans.items.templateCustomizations.title",
          "sections.organisationTemplatesAndPlans.items.guidance.title",
          "sections.organisationTemplatesAndPlans.items.projectAndPlans.title",
          "sections.organizationSettings.items.editOrganizationDetails.title",
          "sections.organizationSettings.items.schoolsDepartments.title",
          "sections.organizationSettings.items.manageUserAccounts.title",
          "sections.organizationSettings.items.customizeEmailText.title",
          "sections.organizationSettings.items.requestFeedbackOptions.title",
          "sections.reporting.items.usageStatistics.title",
        ],
      },
      {
        testId: "accountMenuDesktop",
        name: "menuAccount",
        labels: [
          "sections.userProfile.items.profile.title",
          "sections.userProfile.items.password.title",
          "sections.userProfile.items.connections.title",
          "sections.userProfile.items.notifications.title",
        ],
      },
    ];

    for (const { testId, name, labels } of menus) {
      await user.click(screen.getByTestId(testId));
      const menu = screen.getByRole("menu", { name });
      labels.forEach((label) => {
        expect({ label, href: hrefOf(mobileMenu, label) }).toEqual({ label, href: hrefOf(menu, label) });
      });
      await user.keyboard("{Escape}");
      await waitFor(() => {
        expect(screen.queryByRole("menu", { name })).not.toBeInTheDocument();
      });
    }
  });

  it("should not render any links with an empty href", () => {
    const { container } = render(<Header />);

    expect(container.querySelectorAll('a[href=""]')).toHaveLength(0);
  });

  it("should link the About items to their routes", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByTestId("aboutMenuDesktop"));

    const expectedHrefs: Record<string, string> = {
      subMenuLearnMore: "/app.about",
      subMenuMembership: "/app.membership",
      subMenuFAQs: "/app.faq",
      subMenuEditorial: "/app.editorialBoard",
      subMenuLogos: "/app.logos",
    };
    Object.entries(expectedHrefs).forEach(([key, href]) => {
      const links = screen.getAllByText(key);
      expect(links).toHaveLength(2);
      links.forEach((label) => {
        expect(label.closest("a")).toHaveAttribute("href", href);
      });
    });
  });

  it("should start the Admin menu with the admin overview, and link the mobile Admin heading to it", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const mobileMenu = document.getElementById("mobile-navigation") as HTMLElement;

    expect(within(mobileMenu).getByText("menuAdmin").closest("a")).toHaveAttribute("href", "/admin.index");

    await user.click(screen.getByTestId("adminMenuDesktop"));

    const items = within(screen.getByRole("menu", { name: "menuAdmin" })).getAllByRole("menuitem");
    expect(items).toHaveLength(12);
    expect(items[0]).toHaveTextContent("subMenuAdminOverview");
    expect(items[0]).toHaveAttribute("href", "/admin.index");
  });

  it("should use the same menu button for About, Admin and Account on desktop", () => {
    render(<Header />);

    ["aboutMenuDesktop", "adminMenuDesktop", "accountMenuDesktop"].forEach((testId) => {
      const trigger = screen.getByTestId(testId);
      expect(trigger.tagName).toBe("BUTTON");
      expect(trigger).toHaveAttribute("aria-haspopup", "true");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).toHaveClass("link", "menuTrigger");
    });
  });

  it("should open an Account menu with the account pages and Logout on desktop", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const trigger = screen.getByTestId("accountMenuDesktop");
    expect(trigger).toHaveAttribute("aria-haspopup", "true");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    const menu = screen.getByRole("menu", { name: "menuAccount" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "subMenuAccountOverview",
      "sections.userProfile.items.profile.title",
      "sections.userProfile.items.password.title",
      "sections.userProfile.items.connections.title",
      "sections.userProfile.items.notifications.title",
      "btnLogout",
    ]);
    expect(items.slice(0, 5).map((item) => item.getAttribute("href"))).toEqual([
      "/account.index",
      "/account.profile",
      "/account.password",
      "/account.connections",
      "/account.notifications",
    ]);
    expect(items[5]).not.toHaveAttribute("href");
  });

  it.each([
    ["aboutMenuDesktop", "menuAbout"],
    ["adminMenuDesktop", "menuAdmin"],
    ["accountMenuDesktop", "menuAccount"],
  ])("should open the %s menu from the keyboard and close it with Escape", async (testId, name) => {
    const user = userEvent.setup();
    render(<Header />);

    const trigger = screen.getByTestId(testId);
    act(() => trigger.focus());
    await user.keyboard("{Enter}");

    const items = within(screen.getByRole("menu", { name })).getAllByRole("menuitem");
    expect(items[0]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(items[1]).toHaveFocus();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("menu", { name })).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it("should log out from the desktop Account menu", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true })) as jest.Mock;
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByTestId("accountMenuDesktop"));
    const logoutItem = screen.getByTestId("logoutButtonDesktop");
    expect(logoutItem).toHaveAttribute("role", "menuitem");
    await user.click(logoutItem);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/sign-out"),
        expect.objectContaining({ method: "POST" }),
      );
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/app.login");
    });
  });

  it("should show the account pages and Logout under Account on mobile", () => {
    render(<Header />);
    const mobileMenu = document.getElementById("mobile-navigation") as HTMLElement;

    expect(within(mobileMenu).getByText("menuAccount").closest("a")).toHaveAttribute("href", "/account.index");
    expect(within(mobileMenu).getByText("sections.userProfile.items.password.title").closest("a"))
      .toHaveAttribute("href", "/account.password");
    expect(within(mobileMenu).getByTestId("logoutButtonMobile")).toHaveTextContent("btnLogout");
  });

  it("should end the logged-in navigation with a Create Plan button instead of Logout", () => {
    const { container } = render(<Header />);
    const desktopMenu = container.querySelector(".navigation") as HTMLElement;

    const items = desktopMenu.querySelectorAll(":scope > ul > li");
    const lastItem = items[items.length - 1] as HTMLElement;
    const createPlan = within(lastItem).getByText("menuCreatePlan").closest("a");
    expect(createPlan).toHaveAttribute("href", "/projects.create.start");
    expect(createPlan).toHaveClass("button-link", "button--primary");
    expect(within(desktopMenu).queryByText("btnLogout")).not.toBeInTheDocument();
  });

  it("should render the desktop and mobile menus as labelled navigation landmarks", () => {
    render(<Header />);

    expect(screen.getAllByRole("navigation", { name: "menuMainNavigation" })).toHaveLength(2);
    expect(screen.queryByRole("menubar")).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(<Header />);
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it.each([
    ["aboutMenuDesktop", "menuAbout"],
    ["adminMenuDesktop", "menuAdmin"],
    ["accountMenuDesktop", "menuAccount"],
  ])("should pass axe accessibility test with the %s menu open", async (testId, name) => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByTestId(testId));
    expect(screen.getByRole("menu", { name })).toBeInTheDocument();

    await act(async () => {
      expect(await axe(document.body)).toHaveNoViolations();
    });
  });

  it("should list the same admin pages as the admin overview page", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByTestId("adminMenuDesktop"));
    const adminMenu = screen.getByRole("menu", { name: "menuAdmin" });

    expect(within(adminMenu).getByText("sections.organisationTemplatesAndPlans.items.templateCustomizations.title").closest("a"))
      .toHaveAttribute("href", "/template.customizations");
    expect(within(adminMenu).getByText("sections.reporting.items.usageStatistics.title").closest("a"))
      .toHaveAttribute("href", "/admin.statistics");
    expect(within(adminMenu).queryByText("subMenuThemes")).not.toBeInTheDocument();
  });

  it("should not show Account or Admin to logged out users", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      setIsAuthenticated: jest.fn(),
    });

    render(<Header />);

    expect(screen.queryByText("menuAccount")).not.toBeInTheDocument();
    expect(screen.queryByText("menuAdmin")).not.toBeInTheDocument();
  });

  it("should link Public Plans and Funder Requirements to their routes", () => {
    render(<Header />);

    screen.getAllByText("menuPublicPlans").forEach((label) => {
      expect(label.closest("a")).toHaveAttribute("href", "/app.publicPlans");
    });
    screen.getAllByText("menuFunderRequirements").forEach((label) => {
      expect(label.closest("a")).toHaveAttribute("href", "/app.funderRequirements");
    });
  });

  it("should not render the old Rails-style locale links", () => {
    const { container } = render(<Header />);

    expect(container.querySelectorAll('a[href^="/locale/"]')).toHaveLength(0);
  });

  it("should navigate to the signup route when sign up is clicked", () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      setIsAuthenticated: jest.fn(),
    });

    render(<Header />);

    fireEvent.click(screen.getAllByText("btnSignup")[0]);

    expect(mockPush).toHaveBeenCalledWith("/app.signup");
  });

  it("should handle logout error gracefully", async () => {
    // Mock fetch to return error
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' }),
    });

    render(<Header />);

    const logoutButton = screen.getAllByText("btnLogout")[0];
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(logECS).toHaveBeenCalledTimes(1);
    });

    expect(logECS).toHaveBeenCalledWith(
      "error",
      "handleLogout",
      expect.objectContaining({
        error: expect.any(Error),
      })
    );

    // Should not call setIsAuthenticated or router.push on error
    expect(mockSetIsAuthenticated).toHaveBeenCalledTimes(1);
  });
});
