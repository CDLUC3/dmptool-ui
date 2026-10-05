"use client";

import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutWithPanel, SidebarPanel } from "@/components/Container";
import { FormInput } from "@/components/Form";
import { Button, Dialog, DialogTrigger, Modal, ModalOverlay } from "react-aria-components";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import styles from "./Departments.module.scss";
import { routePath } from "@/utils/routes";
interface Department {
  id: string;
  name: string;
  abbreviation: string;
}

const DepartmentsPage: React.FC = () => {
  const t = useTranslations("Departments");
  const Admin = useTranslations("Admin");
  const Global = useTranslations("Global");

  const [departments, setDepartments] = useState<Department[]>([
    { id: "1", name: "Publishing Archiving and Digitization", abbreviation: "PAD" },
    { id: "2", name: "UC Curation Center", abbreviation: "UC3" },
  ]);
  const [deleteModalOpen, setDeleteModalOpen] = useState<string | null>(null);

  const handleAddDepartment = () => {
    const newId = (departments.length + 1).toString();
    setDepartments([...departments, { id: newId, name: "", abbreviation: "" }]);
  };

  const handleRemoveDepartment = (id: string) => {
    setDepartments(departments.filter((dept) => dept.id !== id));
    setDeleteModalOpen(null);
  };

  const handleDepartmentChange = (id: string, field: "name" | "abbreviation", value: string) => {
    setDepartments(departments.map((dept) => (dept.id === id ? { ...dept, [field]: value } : dept)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit");
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        showBackButton={true}
        className="page-organization-details-header"
      />

      <LayoutWithPanel className={"page-departments"}>
        <ContentContainer>
          <form onSubmit={handleSubmit}>
            {/* Departments section */}

            {departments.map((department) => (
              <div
                key={department.id}
                className={styles.sectionContainer}
              >
                <div className={styles.sectionContent}>
                  <div className={styles.departmentFields}>
                    <FormInput
                      name={`departmentName_${department.id}`}
                      label={t("fields.departmentName.label")}
                      placeholder={t("fields.departmentName.placeholder")}
                      value={department.name}
                      onChange={(e) => handleDepartmentChange(department.id, "name", e.target.value)}
                    />
                    <FormInput
                      name={`departmentAbbr_${department.id}`}
                      label={t("fields.departmentAbbr.label")}
                      placeholder={t("fields.departmentAbbr.placeholder")}
                      value={department.abbreviation}
                      onChange={(e) => handleDepartmentChange(department.id, "abbreviation", e.target.value)}
                    />
                  </div>
                  <div className={styles.departmentActions}>
                    <Button
                      type="button"
                      data-primary={true}
                    >
                      {t("actions.save")}
                    </Button>
                    <DialogTrigger
                      isOpen={deleteModalOpen === department.id}
                      onOpenChange={(isOpen) => setDeleteModalOpen(isOpen ? department.id : null)}
                    >
                      <Button
                        type="button"
                        className="react-aria-Button react-aria-Button--secondary"
                      >
                        {t("actions.delete")}
                      </Button>
                      <ModalOverlay>
                        <Modal>
                          <Dialog>
                            {({ close }) => (
                              <>
                                <h3>{t("deleteModal.title")}</h3>
                                <p>{t("deleteModal.content", { name: department.name })}</p>
                                <div className={styles.deleteConfirmButtons}>
                                  <Button
                                    className="react-aria-Button"
                                    autoFocus
                                    onPress={close}
                                  >
                                    {Global("buttons.cancel")}
                                  </Button>
                                  <Button
                                    className="danger"
                                    onPress={() => {
                                      handleRemoveDepartment(department.id);
                                      close();
                                    }}
                                  >
                                    {t("deleteModal.deleteButton")}
                                  </Button>
                                </div>
                              </>
                            )}
                          </Dialog>
                        </Modal>
                      </ModalOverlay>
                    </DialogTrigger>
                  </div>
                </div>
              </div>
            ))}

            {/* Add new department section */}
            <div className={styles.sectionContainer}>
              <div className={styles.addNewSection}>
                <Button
                  onPress={handleAddDepartment}
                  className="react-aria-Button react-aria-Button--secondary"
                >
                  <span className={styles.plusIcon}>+</span>
                  <span className={styles.addNewText}>{t("actions.addNew")}</span>
                </Button>
              </div>
            </div>
          </form>
        </ContentContainer>

        <SidebarPanel>
          <div>
            <h2 className={styles.relatedItemsHeading}>{Admin("headingRelatedActions")}</h2>
            <ul className={styles.relatedItems}>
              <li>
                <Link href={routePath("admin.organizationDetails")}>
                  {Admin("sections.organizationSettings.items.editOrganizationDetails.title")}
                </Link>
              </li>
              <li>
                <Link href={routePath("admin.users")}>
                  {Admin("sections.organizationSettings.items.manageUserAccounts.title")}
                </Link>
              </li>
              <li>
                <Link href={routePath("admin.emailPreferences")}>
                  {Admin("sections.organizationSettings.items.customizeEmailText.title")}
                </Link>
              </li>
              <li>
                <Link href={routePath("admin.feedbackOptions")}>
                  {Admin("sections.organizationSettings.items.requestFeedbackOptions.title")}
                </Link>
              </li>
            </ul>
          </div>
        </SidebarPanel>
      </LayoutWithPanel>
    </>
  );
};

export default DepartmentsPage;
