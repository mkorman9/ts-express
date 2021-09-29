import type { FC } from 'react';
import moment from 'moment-timezone';
import { DatePicker } from 'react-widgets';
import type { Moment } from 'moment';

export interface DateSelectorProps {
    id?: string;
    value: Moment | null;
    onChange: (v: Moment | null) => void;
}

const DateSelector: FC<DateSelectorProps> = ({ id, value, onChange }) => {
    const mapValue = (v: Moment | null) => {
        if (!v) {
            return null;
        }

        return v.toDate();
    };

    const changeHandler = (v: Date | null | undefined) => {
        if (!v) {
            onChange(null);
            return;
        }

        onChange(moment(v));
    };

    return (
        <DatePicker 
            name={id} 
            value={mapValue(value)}
            onChange={(v) => changeHandler(v)}
        />
    );
};

export default DateSelector;
