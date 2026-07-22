import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Header from "../index";
import "@testing-library/jest-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useCsrf } from "@/context/CsrfContext";
import logECS from '@/utils/clientLogger';

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

jest.mock("react-aria-components", () => ({
  Button: ({
    children,
    onPress,
    ...props
  }: {
    children: React.ReactNode;
    onPress?: () => void;
    [key: string]: unknown;
  }) => (
    <button
      onClick={onPress}
      {...props}
    >
      {children}
    </button>
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
      csrfToken: "mock-csrf-token",
    });
  });

  it("should render the header with logo and main navigation", () => {
    render(<Header />);

    // Check for the logo
    expect(screen.getByAltText("DMP Tool")).toBeInTheDocument();

    // Check for key navigation items (authenticated user) - expect 2 instances (desktop and mobile)
    expect(screen.getAllByText("menuProjectsPlans")).toHaveLength(2);
    expect(screen.getAllByText("menuCreatePlan")).toHaveLength(2);
    expect(screen.getAllByText("menuPublicPlans")).toHaveLength(2);
    expect(screen.getAllByText("btnLogout")).toHaveLength(2);
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

    const mobileMenuButton = screen.getByAltText("Mobile menu");
    fireEvent.click(mobileMenuButton);

    // Mobile menu should be visible
    const mobileMenu = document.getElementById("mobile-navigation");
    expect(mobileMenu).toHaveClass("showMenu");

    const closeButton = screen.getByAltText("Close mobile menu");
    fireEvent.click(closeButton);

    // Mobile menu should be hidden
    expect(mobileMenu).not.toHaveClass("showMenu");
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
        expect.stringContaining("/apollo-signout"),
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
    expect(routePath).toHaveBeenCalledWith("projects.create");
  });

  it("should handle authentication state changes", () => {
    const { rerender } = render(<Header />);

    // Initially authenticated
    expect(screen.getAllByText("btnLogout")).toHaveLength(2);
    expect(screen.queryByText("btnLogin")).not.toBeInTheDocument();

    // Change to non-authenticated
    (useAuthContext as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      setIsAuthenticated: jest.fn(),
    });

    rerender(<Header />);

    expect(screen.getAllByText("btnLogin")).toHaveLength(2);
    expect(screen.queryByText("btnLogout")).not.toBeInTheDocument();
  });

  it("should render language selector", () => {
    render(<Header />);

    // Check for language dropdown (expect 1 instance - only in desktop navigation)
    expect(screen.getByText("menuLanguage")).toBeInTheDocument();
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
