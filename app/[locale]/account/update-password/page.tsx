"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Breadcrumb, Breadcrumbs, Button } from "react-aria-components";

// Components
import PageHeader from "@/components/PageHeader";
import { FormInput } from "@/components/Form";
import { ContentContainer, LayoutWithPanel, SidebarPanel } from "@/components/Container";

// Styles
import styles from "./updatePassword.module.scss";
import { routePath } from "@/utils/routes";
import { useToast } from "@/context/ToastContext";

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UpdatePasswordPage: React.FC = () => {
  const t = useTranslations("UpdatePassword");
  const toast = useToast();

  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // This is a static form for now - just simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      // In a real implementation, this would make an API call
      console.log("Password update submitted:", formData);
      toast.add(t("messages.passwordUpdateSuccess"), { type: "success", timeout: 3000 });
    }, 1000);
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        showBackButton={true}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb>
              <Link href="/">{t("breadcrumbHome")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("account.profile")}>{t("breadcrumbProfile")}</Link>
            </Breadcrumb>
            <Breadcrumb>{t("title")}</Breadcrumb>
          </Breadcrumbs>
        }
        className="page-template-list"
      />

      <LayoutWithPanel className={"page-update-password"}>
        <ContentContainer>
          <form onSubmit={handleSubmit}>
            <div className={styles.sectionContainer}>
              <div className={styles.sectionContent}>
                <div className={styles.subSection}>
                  <h2>{t("headingPasswordRequirements")}</h2>
                  <ul>
                    <li>{t("requirementLength")}</li>
                    <li>{t("requirementNumber")}</li>
                    <li>{t("requirementUppercase")}</li>
                    <li>{t("requirementLowercase")}</li>
                    <li>{t("requirementSpecialChars")}</li>
                  </ul>
                </div>

                <div>
                  <FormInput
                    name="currentPassword"
                    type="password"
                    label={t("currentPassword")}
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    isRequired
                    isInvalid={!!errors.currentPassword}
                    errorMessage={errors.currentPassword}
                  />
                  <FormInput
                    name="newPassword"
                    type="password"
                    label={t("newPassword")}
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    isRequired
                    isInvalid={!!errors.newPassword}
                    errorMessage={errors.newPassword}
                  />
                  <FormInput
                    name="confirmPassword"
                    type="password"
                    label={t("confirmPassword")}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    isRequired
                    isInvalid={!!errors.confirmPassword}
                    errorMessage={errors.confirmPassword}
                  />
                </div>

                <div className={styles.formActions}>
                  <Button
                    type="submit"
                    isDisabled={isSubmitting}
                    data-primary={true}
                  >
                    {isSubmitting ? t("btnChangingPassword") : t("btnChangePassword")}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </ContentContainer>

        <SidebarPanel>
          <div>
            <h2 className={styles.relatedItemsHeading}>{t("headingRelatedActions")}</h2>
            <ul className={styles.relatedItems}>
              <li>
                <Link href={routePath("account.connections")}>{t("linkUpdateConnections")}</Link>
              </li>
              <li>
                <Link href={routePath("account.notifications")}>{t("linkManageNotifications")}</Link>
              </li>
            </ul>
          </div>
        </SidebarPanel>
      </LayoutWithPanel>
    </>
  );
};

export default UpdatePasswordPage;
