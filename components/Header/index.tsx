"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/context/AuthContext";
import { useCsrf } from "@/context/CsrfContext";

import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "react-aria-components";
import styles from "./header.module.scss";
import LanguageSelector from "../LanguageSelector";
import { routePath } from "@/utils/routes";
import logECS from '@/utils/clientLogger';

function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const {
    isAuthenticated,
    setIsAuthenticated,
    clearCache,
    clearAuthData
  } = useAuthContext();
  const router = useRouter();
  const { csrfToken } = useCsrf();
  const t = useTranslations("Header");

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_ENDPOINT}/apollo-signout`, {
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

  return (
    <header className={styles.header}>
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

        <div className={`${styles.navigation} ${styles.desktop}`}>
          <ul role="menu">
            {/* Show authenticated user items first when logged in */}
            {isAuthenticated && (
              <>
                <li role="menuitem">
                  <Link href={routePath("projects.index")}>{t("menuProjectsPlans")}</Link>
                </li>
                <li role="menuitem">
                  <Link href={routePath("projects.create")}>{t("menuCreatePlan")}</Link>
                </li>
              </>
            )}

            {/* Always show public items */}
            <li role="menuitem">
              <Link
                role="none"
                href="/public-plans"
              >
                {t("menuPublicPlans")}
              </Link>
            </li>
            <li role="menuitem">
              <Link
                role="none"
                href="/funder-requirements"
              >
                {t("menuFunderRequirements")}
              </Link>
            </li>

            <li role="menuitem">
              <div
                className={styles.dropdown}
                role="menu"
              >
                <span>
                  <Link
                    role="none"
                    href="#"
                  >
                    {t("menuAbout")}
                  </Link>
                </span>
                <div
                  className={styles.dropdownContent}
                  role="menu"
                >
                  <p
                    className={styles.paragraph}
                    role="menuitem"
                  >
                    <Link
                      href=""
                      role="none"
                    >
                      {t("subMenuLearnMore")}
                    </Link>
                  </p>
                  <p
                    className={styles.paragraph}
                    role="menuitem"
                  >
                    <Link
                      href=""
                      role="none"
                    >
                      {t("subMenuMembership")}
                    </Link>
                  </p>
                  <p
                    className={styles.paragraph}
                    role="menuitem"
                  >
                    <Link
                      href=""
                      role="none"
                    >
                      {t("subMenuFAQs")}
                    </Link>
                  </p>
                  <p
                    className={styles.paragraph}
                    role="menuitem"
                  >
                    <Link
                      href=""
                      role="none"
                    >
                      {t("subMenuEditorial")}
                    </Link>
                  </p>
                  <p
                    className={styles.paragraph}
                    role="menuitem"
                  >
                    <Link
                      href=""
                      role="none"
                    >
                      {t("subMenuLogos")}
                    </Link>
                  </p>
                </div>
              </div>
            </li>

            {/* Show authenticated user items */}
            {isAuthenticated && (
              <>
                <li role="menuitem">
                  <div className={styles.dropdown}>
                    <span>
                      <Link href="#">{t("menuAdmin")}</Link>
                    </span>
                    <div className={styles.dropdownContent}>
                      <p className={styles.paragraph}>
                        <Link
                          href={routePath("admin.organizationDetails")}
                          role="menuitem"
                        >
                          {t("subMenuOrganisations")}
                        </Link>
                      </p>
                      <p className={styles.paragraph}>
                        <Link
                          href=""
                          role="menuitem"
                        >
                          {t("subMenuOrgDetails")}
                        </Link>
                      </p>
                      <p className={styles.paragraph}>
                        <Link
                          href={routePath("admin.users")}
                          role="menuitem"
                        >
                          {t("subMenuUsers")}
                        </Link>
                      </p>
                      <p className={styles.paragraph}>
                        <Link
                          href={routePath("admin.projects")}
                          role="menuitem"
                        >
                          {t("subMenuPlans")}
                        </Link>
                      </p>
                      <p className={styles.paragraph}>
                        <Link
                          href=""
                          role="menuitem"
                        >
                          {t("subMenuUsage")}
                        </Link>
                      </p>
                      <p className={styles.paragraph}>
                        <Link
                          href={routePath("admin.templates")}
                          role="menuitem"
                        >
                          {t("subMenuTemplates")}
                        </Link>
                      </p>
                      <p className={styles.paragraph}>
                        <Link
                          href={routePath("admin.guidance.index")}
                          role="menuitem"
                        >
                          {t("subMenuGuidance")}
                        </Link>
                      </p>
                      <p className={styles.paragraph}>
                        <Link
                          href=""
                          role="menuitem"
                        >
                          {t("subMenuThemes")}
                        </Link>
                      </p>
                      <p className={styles.paragraph}>
                        <Link
                          href=""
                          role="menuitem"
                        >
                          {t("subMenuApiClients")}
                        </Link>
                      </p>
                      <p className={styles.paragraph}>
                        <Link
                          href=""
                          role="menuitem"
                        >
                          {t("subMenuApiLogs")}
                        </Link>
                      </p>
                      <p className={styles.paragraph}>
                        <Link
                          href={routePath("admin.notifications")}
                          role="menuitem"
                        >
                          {t("subMenuNotifications")}
                        </Link>
                      </p>
                    </div>
                  </div>
                </li>

                <li role="menuitem">
                  <div className={styles.dropdown}>
                    <a href="#">
                      <FontAwesomeIcon
                        icon={faGlobe}
                        aria-label="Language"
                      />
                    </a>
                    <div className={styles.dropdownContent}>
                      <LanguageSelector locales={locales} />
                    </div>
                  </div>
                </li>

                <li role="menuitem">
                  <Button
                    className="react-aria-Button secondary"
                    data-testid="logoutButtonDesktop"
                    onPress={handleLogout}
                  >
                    {t("btnLogout")}
                  </Button>
                </li>
              </>
            )}

            {/* Show login/signup for non-authenticated users */}
            {!isAuthenticated && (
              <>
                <li role="menuitem">
                  <Button
                    className="react-aria-Button primary"
                    onPress={() => router.push(routePath("app.login"))}
                  >
                    {t("btnLogin")}
                  </Button>
                </li>
                <li role="menuitem">
                  <Button
                    className="react-aria-Button secondary"
                    onPress={() => router.push("/signup")}
                  >
                    {t("btnSignup")}
                  </Button>
                </li>
              </>
            )}
          </ul>
        </div>

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
          <ul role="menubar">
            {/* Show authenticated user items first when logged in */}
            {isAuthenticated && (
              <>
                <li role="menuitem">
                  <Link href={routePath("projects.index")}>{t("menuProjectsPlans")}</Link>
                </li>
                <li role="menuitem">
                  <Link href={routePath("projects.create")}>{t("menuCreatePlan")}</Link>
                </li>
              </>
            )}

            {/* Always show public items */}
            <li role="menuitem">
              <Link
                role="none"
                href="/public_plans"
              >
                {t("menuPublicPlans")}
              </Link>
            </li>
            <li role="menuitem">
              <Link
                role="none"
                href="/public_templates"
              >
                {t("menuFunderRequirements")}
              </Link>
            </li>

            <li role="menuitem">
              <div className={styles.dropdown}>
                <span>
                  <Link href="#">{t("menuAbout")}</Link>
                </span>
                <ul className={styles.submenu}>
                  <li role="menuitem">
                    <Link
                      role="none"
                      href="/about_us"
                    >
                      {t("subMenuLearnMore")}
                    </Link>
                  </li>
                  <li role="menuitem">
                    <Link
                      role="none"
                      href="/join_us"
                    >
                      {t("subMenuMembership")}
                    </Link>
                  </li>
                  <li role="menuitem">
                    <Link
                      role="none"
                      href="/faq"
                    >
                      {t("subMenuFAQs")}
                    </Link>
                  </li>
                  <li role="menuitem">
                    <Link
                      role="none"
                      href="/editorial_board"
                    >
                      {t("subMenuEditorial")}
                    </Link>
                  </li>
                  <li role="menuitem">
                    <Link
                      role="none"
                      href="/promote"
                    >
                      {t("subMenuLogos")}
                    </Link>
                  </li>
                </ul>
              </div>
            </li>

            {/* Show authenticated user items */}
            {isAuthenticated && (
              <>
                <li role="menuitem">
                  <div className={styles.dropdown}>
                    <span>
                      <Link href="#">{t("menuAdmin")}</Link>
                    </span>
                    <ul className={styles.submenu}>
                      <li role="menuitem">
                        <Link
                          role="none"
                          href={routePath("admin.organizationDetails")}
                        >
                          {t("subMenuOrganisations")}
                        </Link>
                      </li>
                      <li role="menuitem">
                        <Link
                          role="none"
                          href={routePath("admin.users")}
                        >
                          {t("subMenuUsers")}
                        </Link>
                      </li>
                      <li role="menuitem">
                        <Link
                          role="none"
                          href={routePath("admin.projects")}
                        >
                          {t("subMenuPlans")}
                        </Link>
                      </li>
                      <li role="menuitem">
                        <Link
                          role="none"
                          href="/usage"
                        >
                          {t("subMenuUsage")}
                        </Link>
                      </li>
                      <li role="menuitem">
                        <Link
                          role="none"
                          href={routePath("admin.templates")}
                        >
                          {t("subMenuTemplates")}
                        </Link>
                      </li>
                      <li role="menuitem">
                        <Link
                          role="none"
                          href={routePath("admin.guidance.index")}
                        >
                          {t("subMenuGuidance")}
                        </Link>
                      </li>
                      <li role="menuitem">
                        <Link
                          role="none"
                          href="/super_admin/themes"
                        >
                          {t("subMenuThemes")}
                        </Link>
                      </li>
                      <li role="menuitem">
                        <Link
                          role="none"
                          href="/super_admin/api_clients"
                        >
                          {t("subMenuApiClients")}
                        </Link>
                      </li>
                      <li role="menuitem">
                        <Link
                          role="none"
                          href="/super_admin/api_logs"
                        >
                          {t("subMenuApiLogs")}
                        </Link>
                      </li>
                      <li role="menuitem">
                        <Link
                          role="none"
                          href={routePath("admin.notifications")}
                        >
                          {t("subMenuNotifications")}
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>

                <li role="menuitem">
                  <div className={styles.dropdown}>
                    <span>
                      <Link href="#">{t("menuLanguage")}</Link>
                    </span>
                    <ul
                      className={styles.submenu}
                      role="menu"
                    >
                      <li role="menuitem">
                        <Link
                          role="none"
                          rel="nofollow"
                          data-method="patch"
                          href="/locale/en-US"
                        >
                          {t("subMenuEnglish")}
                        </Link>
                      </li>
                      <li role="menuitem">
                        <Link
                          role="none"
                          rel="nofollow"
                          data-method="patch"
                          href="/locale/pt-BR"
                        >
                          {t("subMenuPortuguese")}
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>

                <li role="menuitem">
                  <Button
                    className="react-aria-Button secondary"
                    data-testid="logoutButtonMobile"
                    onPress={handleLogout}
                  >
                    {t("btnLogout")}
                  </Button>
                </li>
              </>
            )}

            {/* Show login/signup for non-authenticated users */}
            {!isAuthenticated && (
              <>
                <li role="menuitem">
                  <Button
                    className="react-aria-Button primary"
                    onPress={() => router.push(routePath("app.login"))}
                  >
                    {t("btnLogin")}
                  </Button>
                </li>
                <li role="menuitem">
                  <Button
                    className="react-aria-Button secondary"
                    onPress={() => router.push("/signup")}
                  >
                    {t("btnSignup")}
                  </Button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
}

export default Header;
