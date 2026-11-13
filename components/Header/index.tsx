"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useQuery } from "@apollo/client/react";

import { useRouter, Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/context/AuthContext";
import { useCsrf } from "@/context/CsrfContext";
import { MeDocument, UserRole } from "@/generated/graphql";

import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  Separator,
} from "react-aria-components";
import styles from "./header.module.scss";
import LanguageSelector from "../LanguageSelector";
import { TransitionLink } from "@/components/Form";
import { routePath } from "@/utils/routes";
import logECS from '@/utils/clientLogger';
import {
  NavItem,
  mainNavItems,
  createPlanNavItem,
  publicNavItems,
  aboutNavItems,
  adminNavItems,
  adminNavItem,
  accountNavItem,
  accountNavItems,
  navItemHref,
} from "./navItems";

interface NavMenuEntry {
  id: string;
  label: React.ReactNode;
  textValue: string;
  href?: string;
  onAction?: () => void;
  testId?: string;
  separatorBefore?: boolean;
}

function NavMenu({ label, testId, entries }: { label: string; testId: string; entries: NavMenuEntry[] }) {
  return (
    <MenuTrigger>
      <Button
        className={`link ${styles.menuTrigger}`}
        data-testid={testId}
      >
        {label}
        <span
          className={styles.chevron}
          aria-hidden="true"
        />
      </Button>
      <Popover
        placement="bottom start"
        className={`react-aria-Popover ${styles.navPopover}`}
      >
        <Menu
          aria-label={label}
          className={`react-aria-Menu ${styles.navMenu}`}
        >
          {entries.flatMap((entry) => [
            ...(entry.separatorBefore ? [<Separator key={`${entry.id}-separator`} />] : []),
            <MenuItem
              key={entry.id}
              id={entry.id}
              href={entry.href}
              onAction={entry.onAction}
              textValue={entry.textValue}
              data-testid={entry.testId}
              className={`react-aria-MenuItem ${styles.navMenuItem}`}
            >
              {entry.label}
            </MenuItem>,
          ])}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}

function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const {
    isAuthenticated,
    setIsAuthenticated,
    clearCache,
    clearAuthData
  } = useAuthContext();
  const router = useRouter();
  const { getCsrfToken } = useCsrf();
  const t = useTranslations("Header");
  const Admin = useTranslations("Admin");
  const Account = useTranslations("Account");
  const { data: meData } = useQuery(MeDocument, { skip: !isAuthenticated });

  // Only controls what is shown; the backend enforces admin permissions
  const isAdminUser = meData?.me?.role === UserRole.Admin || meData?.me?.role === UserRole.Superadmin;
  const visibleMainNavItems = mainNavItems.filter((item) => !item.adminOnly || isAdminUser);

  const locales = [
    {
      id: "en-US",
      name: t("subMenuEnglish"),
    },
    {
      id: "pt-BR",
      name: t("subMenuPortuguese"),
    },
  ];

  useEffect(() => {
    //this is just to trigger a refresh on authentication change
  }, [isAuthenticated]);

  const handleLogout = async () => {
    setShowMobileMenu(false);
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/sign-out`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken || "",
        },
      });

      if (response.ok) {
        await clearAuthData();
        await router.push(routePath("app.login"));
      } else {
        logECS("error", "handleLogout", {
          error: new Error("Failed to logout"),
        });
        setIsAuthenticated(false);
        clearCache();
        await router.push(routePath("app.login"));
      }
    } catch (err) {
      logECS("error", "handleLogout", {
        error: err as Error,
      });
      setIsAuthenticated(false);
      clearCache();
      await router.push(routePath("app.login"));
    }
  };

  function handleClick() {
    setShowMobileMenu(true);
  }

  function hideMenu() {
    setShowMobileMenu(false);
  }

  const renderLabel = (item: NavItem, translate: (key: string) => string = t) => translate(item.labelKey);

  const toMenuEntry = (item: NavItem, translate: (key: string) => string = t): NavMenuEntry => ({
    id: item.labelKey,
    href: navItemHref(item),
    label: renderLabel(item, translate),
    textValue: translate(item.labelKey),
  });

  return (
    <header className={styles.header}>
      <div className={styles.utilityBar}>
        <div className={`${styles.container} ${styles.utilityBarContent}`}>
          <LanguageSelector
            locales={locales}
            label={t("menuLanguage")}
          />
        </div>
      </div>
      <div className={`${styles.container} ${styles.headerContent}`}>
        <div className={`${styles.headerLogo} ${styles.grow}`}>
          <Link href={routePath("app.home")}>
            <Image
              src="/images/dmplogo.svg"
              width={200}
              height={28}
              alt="DMP Tool"
              loading="eager" // tell the browser to load this immediately for better performance
              priority // Next.js 13+ way to indicate high priority for this image
            />
          </Link>
        </div>

        <nav
          className={`${styles.navigation} ${styles.desktop}`}
          aria-label={t("menuMainNavigation")}
        >
          <ul>
            {/* Show authenticated user items first when logged in */}
            {isAuthenticated === true &&
              visibleMainNavItems.map((item) => (
                <li key={item.labelKey}>
                  <Link href={navItemHref(item)}>{renderLabel(item)}</Link>
                </li>
              ))}

            {/* Always show public items */}
            {publicNavItems.map((item) => (
              <li key={item.labelKey}>
                <Link href={navItemHref(item)}>{renderLabel(item)}</Link>
              </li>
            ))}

            <li>
              <NavMenu
                label={t("menuAbout")}
                testId="aboutMenuDesktop"
                entries={aboutNavItems.map((item) => toMenuEntry(item))}
              />
            </li>

            {/* Show authenticated user items */}
            {isAuthenticated === true && (
              <>
                {isAdminUser && (
                  <li>
                    <NavMenu
                      label={t("menuAdmin")}
                      testId="adminMenuDesktop"
                      entries={[
                        toMenuEntry(adminNavItem),
                        ...adminNavItems.map((item) => toMenuEntry(item, Admin)),
                      ]}
                    />
                  </li>
                )}

                <li>
                  <NavMenu
                    label={t("menuAccount")}
                    testId="accountMenuDesktop"
                    entries={[
                      toMenuEntry(accountNavItem),
                      ...accountNavItems.map((item) => toMenuEntry(item, Account)),
                      {
                        id: "logout",
                        label: t("btnLogout"),
                        textValue: t("btnLogout"),
                        onAction: handleLogout,
                        testId: "logoutButtonDesktop",
                        separatorBefore: true,
                      },
                    ]}
                  />
                </li>

                <li>
                  <TransitionLink
                    href={navItemHref(createPlanNavItem)}
                    className="button-link button--primary"
                  >
                    {t(createPlanNavItem.labelKey)}
                  </TransitionLink>
                </li>
              </>
            )}

            {/* Show login/signup for non-authenticated users */}
            {isAuthenticated === false && (
              <>
                <li>
                  <Button
                    className="react-aria-Button primary"
                    onPress={() => router.push(routePath("app.login"))}
                  >
                    {t("btnLogin")}
                  </Button>
                </li>
                <li>
                  <Button
                    className="react-aria-Button secondary"
                    onPress={() => router.push(routePath("app.signup"))}
                  >
                    {t("btnSignup")}
                  </Button>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/*Mobile */}
        <button
          className={`${styles.mobile} ${styles.mobileIcon}`}
          id="mobile-menu-open"
          onClick={handleClick}
        >
          <Image
            src="/images/mobile-menu.svg"
            width={25}
            height={37}
            alt="Mobile menu"
          />
        </button>
        <div
          id="mobile-navigation"
          className={`${styles.mobile} ${styles.mobileMenu} ${showMobileMenu ? styles.showMenu : ""}`}
          inert={!showMobileMenu}
        >
          <button
            id="mobile-menu-close"
            className={styles.mobileMenuClose}
            onClick={hideMenu}
          >
            <Image
              src="/images/blue-arrow.svg"
              className={styles.closeIcon}
              width={28}
              height={39}
              alt="Close mobile menu"
            />
          </button>
          <nav aria-label={t("menuMainNavigation")}>
            <ul>
              {/* Show authenticated user items first when logged in */}
              {isAuthenticated === true &&
                visibleMainNavItems.map((item) => (
                  <li key={item.labelKey}>
                    <Link href={navItemHref(item)}>{renderLabel(item)}</Link>
                  </li>
                ))}

              {/* Always show public items */}
              {publicNavItems.map((item) => (
                <li key={item.labelKey}>
                  <Link href={navItemHref(item)}>{renderLabel(item)}</Link>
                </li>
              ))}

              <li>
                <div className={styles.dropdown}>
                  <span className={styles.submenuLabel}>{t("menuAbout")}</span>
                  <ul className={styles.submenu}>
                    {aboutNavItems.map((item) => (
                      <li key={item.labelKey}>
                        <Link href={navItemHref(item)}>{renderLabel(item)}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>

              {/* Show authenticated user items */}
              {isAuthenticated === true && (
                <>
                  {isAdminUser && (
                    <li>
                      <div className={styles.dropdown}>
                        <span>
                          <Link href={navItemHref(adminNavItem)}>{t("menuAdmin")}</Link>
                        </span>
                        <ul className={styles.submenu}>
                          {adminNavItems.map((item) => (
                            <li key={item.labelKey}>
                              <Link href={navItemHref(item)}>{renderLabel(item, Admin)}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  )}

                  <li>
                    <div className={styles.dropdown}>
                      <span>
                        <Link href={navItemHref(accountNavItem)}>{t("menuAccount")}</Link>
                      </span>
                      <ul className={styles.submenu}>
                        {accountNavItems.map((item) => (
                          <li key={item.labelKey}>
                            <Link href={navItemHref(item)}>{renderLabel(item, Account)}</Link>
                          </li>
                        ))}
                        <li>
                          <Button
                            className="link"
                            data-testid="logoutButtonMobile"
                            onPress={handleLogout}
                          >
                            {t("btnLogout")}
                          </Button>
                        </li>
                      </ul>
                    </div>
                  </li>

                  <li>
                    <TransitionLink
                      href={navItemHref(createPlanNavItem)}
                      className="button-link button--primary"
                    >
                      {t(createPlanNavItem.labelKey)}
                    </TransitionLink>
                  </li>
                </>
              )}

              {/* Show login/signup for non-authenticated users */}
              {isAuthenticated === false && (
                <>
                  <li>
                    <Button
                      className="react-aria-Button primary"
                      onPress={() => router.push(routePath("app.login"))}
                    >
                      {t("btnLogin")}
                    </Button>
                  </li>
                  <li>
                    <Button
                      className="react-aria-Button secondary"
                      onPress={() => router.push(routePath("app.signup"))}
                    >
                      {t("btnSignup")}
                    </Button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
