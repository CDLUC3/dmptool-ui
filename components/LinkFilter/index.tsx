import styles from "./LinkFilter.module.scss";
import React from "react";
import {
  Radio,
  RadioGroup,
  RadioGroupProps
} from "react-aria-components";

interface LinkFilterProps extends RadioGroupProps {
  label?: string;
  selected: string;
  setSelected: (value: string) => void;
  items: LinkFilterItem[];
}

export type LinkFilterItem = {
  label: string;
  id: string;
  count?: number;
};

const LinkFilter = ({ label, selected, setSelected, items, ...rest }: LinkFilterProps) => {
  return (
    <div className={styles.container}>
      {label != null && <span className={styles.label}>{label}</span>}
      <RadioGroup
        aria-label={label}
        orientation="horizontal"
        value={selected}
        onChange={(value) => {
          setSelected(value);
        }}
        className={styles.radioGroup}
        {...rest}
      >
        {items.map((category, i) => {
          let label = category.label;
          if (category.count != null) {
            label += `(${category.count})`;
          }

          return (
            <React.Fragment key={category.id}>
              <Radio
                value={category.id}
                className={styles.radio}
                aria-label={label}
              >
                {/* CSS trick to stop the radio button label font weight change from making other items in the layout
                    shift. There is a hidden label that is always bold and underlined determining the size
                    of the label and the label that we see is positioned absolutely on top and centred.
                 */}
                <span
                  className={styles.radioLabelHidden}
                  aria-hidden
                >
                  {label}
                </span>
                <span className={styles.radioLabel}>{label}</span>
              </Radio>
              {i !== items.length - 1 && (
                <span
                  aria-hidden
                  className={styles.separator}
                >
                  /
                </span>
              )}
            </React.Fragment>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default LinkFilter;
