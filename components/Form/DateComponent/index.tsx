import React from 'react';
import {
  DatePicker,
  Label,
  Group,
  DateInput,
  DateSegment,
  Button,
  Popover,
  Dialog,
  Calendar,
  Heading,
  CalendarGrid,
  CalendarCell, Text,
} from "react-aria-components";
import { parseDate, DateValue } from "@internationalized/date";
import { DmpIcon } from "@/components/Icons";
import styles from './datePicker.module.scss';


/*eslint-disable @typescript-eslint/no-explicit-any*/
interface DateComponentProps {
  name: string;
  value: any;
  onChange: (value: any) => void;
  label: string;
  minValue?: DateValue | string;
  maxValue?: DateValue | string;
  helpMessage?: string;
  isDisabled?: boolean;
}

function toDateValue(value?: string | DateValue) {
  if (!value) return undefined;
  if (typeof value === 'string') return parseDate(value);
  return value;
}


const DateComponent: React.FC<DateComponentProps> = ({
  name,
  value,
  onChange,
  label,
  minValue,
  maxValue,
  helpMessage = "",
  isDisabled = false,
}) => (
  <DatePicker
    name={name}
    value={value}
    data-testid="date-picker"
    onChange={onChange}
    minValue={toDateValue(minValue)}
    maxValue={toDateValue(maxValue)}
    isDisabled={isDisabled}
  >
    <Label>{label}</Label>
    <Group>
      <DateInput>{(segment) => <DateSegment segment={segment} />}</DateInput>
      <Button>
        <DmpIcon
          icon="solid-down_arrow"
          classes={styles.arrow}
        />
      </Button>
    </Group>
    <Popover>
      <Dialog>
        <Calendar>
          <header>
            <Button slot="previous">
              <DmpIcon
                icon="solid-left_arrow"
                classes={styles.arrow}
              />
            </Button>
            <Heading className={styles.dateHeading} />
            <Button slot="next">
              <DmpIcon
                icon="solid-right_arrow"
                classes={styles.arrow}
              />
            </Button>
          </header>
          <CalendarGrid>{(date) => <CalendarCell date={date} />}</CalendarGrid>
        </Calendar>
      </Dialog>
    </Popover>
    {helpMessage && (
      <Text
        slot="description"
        className="help-text"
      >
        {helpMessage}
      </Text>
    )}
  </DatePicker>
);

export default DateComponent;
