import { useQuery } from "@apollo/client/react";
import { ProjectDocument } from "@/generated/graphql";
import styles from "@/components/RelatedWorksList/RelatedWorksList.module.scss";
import type { Key } from "react-aria-components";
import {
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as ReactAriaSelect,
  SelectValue,
} from "react-aria-components";
import { useTranslations } from "next-intl";

const EMPTY_KEY = "__empty__" as const;
type Item<TKey extends Key> = { id: TKey; label: string };

export interface ProjectPlanSelectProps {
  projectId: number;
  selectedKey: number | null;
  setSelectedKey: (selectedKey: number | null) => void;
  label?: string;
  containerClassName?: string;
}

export const ProjectPlanSelect = ({
  projectId,
  selectedKey,
  setSelectedKey,
  label,
  containerClassName = styles.filterByType,
}: ProjectPlanSelectProps) => {
  const t = useTranslations("RelatedWorksSelect");

  const { data } = useQuery(ProjectDocument, {
    variables: { projectId },
    fetchPolicy: "cache-and-network",
  });
  let projectItems: Item<number>[] = [];
  if (data != null) {
    projectItems = (data?.project?.plans ?? []).filter((item) => item.registered != null).map((item) => ({ id: item.id!, label: item.title! }));
  }

  return (
    <RelatedWorksSelect<number>
      label={label}
      placeholder={t("planSelectPlaceholder")}
      selectedKey={selectedKey}
      setSelectedKey={setSelectedKey}
      items={projectItems}
      containerClassName={containerClassName}
      includeEmptyValue
    />
  );
};

export interface RelatedWorksSelectProps<TKey extends Key> {
  label?: string;
  placeholder: string;
  selectedKey: TKey | null;
  setSelectedKey: (selectedKey: TKey | null) => void;
  items: Item<TKey>[];
  containerClassName?: string;
  includeEmptyValue?: boolean;
}

export const RelatedWorksSelect = <TKey extends Key>({
  label,
  placeholder,
  selectedKey,
  setSelectedKey,
  items,
  containerClassName,
  includeEmptyValue = false,
}: RelatedWorksSelectProps<TKey>) => {
  const selectedKeyForSelect: Key | null = includeEmptyValue && selectedKey == null ? EMPTY_KEY : selectedKey;

  return (
    <div className={containerClassName}>
      <ReactAriaSelect
        aria-label={label == null ? placeholder : undefined}
        placeholder={placeholder}
        selectedKey={selectedKeyForSelect}
        onSelectionChange={(key) => {
          if (includeEmptyValue && key === EMPTY_KEY) {
            setSelectedKey(null);
            return;
          }
          setSelectedKey(key as TKey);
        }}
        style={{ marginBottom: 0 }}
      >
        {label != null && <Label>{label}</Label>}
        <Button
          type="button"
          className="react-aria-Button selectButton"
        >
          <SelectValue />
          <span aria-hidden="true">▼</span>
        </Button>
        <Popover>
          <ListBox>
            {includeEmptyValue && (
              <ListBoxItem
                id={EMPTY_KEY}
                style={{ fontStyle: "italic" }}
              >
                {placeholder}
              </ListBoxItem>
            )}

            {items.map((item) => (
              <ListBoxItem
                key={item.id}
                id={item.id}
              >
                {item.label}
              </ListBoxItem>
            ))}
          </ListBox>
        </Popover>
        <FieldError />
      </ReactAriaSelect>
    </div>
  );
};
