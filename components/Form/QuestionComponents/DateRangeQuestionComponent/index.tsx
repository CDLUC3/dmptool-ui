import React from 'react';
import { DateRangeQuestionType } from '@dmptool/types';
import { CalendarDate, DateValue } from "@internationalized/date";
import { DateComponent, } from '@/components/Form';
import { getCalendarDateValue } from "@/utils/dateUtils";

interface DateRangeQuestionProps {
  parsedQuestion: DateRangeQuestionType;
  fieldName?: string;
  dateRange: {
    startDate: string | DateValue | CalendarDate | null;
    endDate: string | DateValue | CalendarDate | null;
  };
  isDisabled?: boolean;
  handleDateChange: (
    key: string,
    value: string | DateValue | CalendarDate | null
  ) => void;
}

const DateRangeQuestionComponent: React.FC<DateRangeQuestionProps> = ({
  parsedQuestion,
  fieldName,
  dateRange,
  isDisabled = false,
  handleDateChange,
}) => {
  // Extract labels from JSON if available
  const startLabel = parsedQuestion?.columns?.start?.label;
  const endLabel = parsedQuestion?.columns?.end?.label;
  const startName = fieldName ? `${fieldName}-start` : "startDate";
  const endName = fieldName ? `${fieldName}-end` : "endDate";
  return (
    <div
      className='two-item-row'
      data-testid='date-range-container'
    >
      <DateComponent
        name={startName}
        value={getCalendarDateValue(dateRange.startDate)}
        onChange={newDate => handleDateChange('startDate', newDate)}
        label={startLabel}
        isDisabled={isDisabled}
      />
      <DateComponent
        name={endName}
        value={getCalendarDateValue(dateRange.endDate)}
        onChange={newDate => handleDateChange('endDate', newDate)}
        label={endLabel}
        isDisabled={isDisabled}
      />
    </div >
  )
};

export default DateRangeQuestionComponent;