import { useTranslations } from "next-intl";
import { FileSizeFieldProps } from "@/app/types";
import styles from "./questionAdd.module.scss";

const FileSizeField = ({ field }: FileSizeFieldProps) => {
  const QuestionAdd = useTranslations("QuestionAdd");
  return (
    <div className={styles.typeConfig}>
      {field.byteSizeConfig?.availableUnits && (
        <div className={styles.defaultTypes}>
          <fieldset>
            <legend>{QuestionAdd("researchOutput.fileSize.legends.default")}</legend>
            <ul
              className={`${styles.typesList} ${styles.bulletList}`}
              role="list"
            >
              {field.byteSizeConfig?.availableUnits.map((unit, index) => {
                return (
                  <li
                    key={unit.value || index}
                    className={styles.typeItem}
                  >
                    <span id={`access-level-${index}`}>{unit.label}</span>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </div>
      )}
    </div>
  );
};

export default FileSizeField;
