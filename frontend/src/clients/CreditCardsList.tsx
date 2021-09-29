import { FC } from 'react';

import type { CreditCard } from './ClientsAPI';

export interface CreditCardsListProps {
  value: CreditCard[];
  expanded: boolean;
}

const CreditCardsList: FC<CreditCardsListProps> = ({ value, expanded }) => {
  if (value.length === 0) {
    return (
      <span>(0)</span>
    );
  }

  if (!expanded) {
    return <span>{`(${value.length})`}</span>;
  }

  return (<>
    <span>{`(${value.length})`}</span>
    <ul className="mb-0 pl-3">
      {value.map((creditCard, i) => (
        <li key={i}>{creditCard.number}</li>
      ))}
    </ul>
  </>);
};

export default CreditCardsList;
