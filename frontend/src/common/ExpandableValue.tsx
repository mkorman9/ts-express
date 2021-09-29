import type { FC } from 'react';

export interface ExpandableValueProps {
    value: string;
    expanded: boolean;
}

const ExpandableValue: FC<ExpandableValueProps> = ({ value, expanded }) => {
    if (!expanded) {
        return <span>{!value ? '-' : value.substr(0, 3) + '...' + value.substr(-3)}</span>;
    } else {
        return <span>{!value ? '-' : value}</span>;
    }
};

export default ExpandableValue;
