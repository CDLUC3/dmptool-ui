import { Button, ButtonProps } from "react-aria-components";
import React from "react";
import styles from "./ExpandButton.module.scss";
import { DmpIcon } from "@/components/Icons";

interface ExpandButtonItemProps extends ButtonProps {
  collapseLabel: string;
  expandLabel: string;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  screenReaderText?: string;
}

export default function ExpandButton({
  collapseLabel,
  expandLabel,
  expanded,
  setExpanded,
  screenReaderText,
  className,
  ...rest
}: ExpandButtonItemProps) {
  const toggleExpand = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };

  return (
    <Button
      aria-expanded={expanded}
      onPress={toggleExpand}
      className={[styles.expandButton, className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span>{expanded ? collapseLabel : expandLabel}</span>
      {screenReaderText != null && <span className="hidden-accessibly">{screenReaderText}</span>}

      <DmpIcon
        icon="keyboard_arrow_down"
        width="18px"
        height="18px"
        fill="#05042E"
        className={`${styles.expandIcon} ${expanded ? styles.expanded : ""}`}
      />
    </Button>
  );
}
