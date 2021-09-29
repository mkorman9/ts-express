import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import moment from 'moment';

import { useLanguages } from '../common/LanguagesProvider';
import type { ClientChange, ClientChangeField } from './ClientsAPI';

export interface ClientChangelogWidgetProps {
  changelog: ClientChange[] | null;
}

export interface FieldChange {
  field: string;
  character: string;
  oldValue: string | undefined;
  value: string | undefined;
}

const ClientChangelogWidget: FC<ClientChangelogWidgetProps> = ({ changelog }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguages();

  const parseFieldChangeCharacter =  (oldValue: string | undefined, newValue: string | undefined): string => {
    if (!oldValue && newValue) {
      return "added";
    } else if (oldValue && !newValue) {
      return "removed";
    } else {
      return "changed";
    }
  };

  const formatFieldValue =  (fieldName: string, value: string | undefined): string | undefined => {
    if (fieldName === 'gender') {
      if (value === 'M') {
        return t('clientChangelogWidget.gender.M');
      } else if (value === 'F') {
        return t('clientChangelogWidget.gender.F');
      } else {
        return t('clientChangelogWidget.gender.NA');
      }
    } else if (fieldName === 'birthDate') {
      if (!value) {
        return undefined;
      }

      return currentLanguage.formatDateTime(moment(value), 'LL');
    }

    return value;
  };

  const parseCreditCardsChanges = (oldValue: string | undefined, newValue: string | undefined): [string[], string[]] => {
    const oldCreditCards: Set<string> = oldValue ? new Set(oldValue.split(",").filter(cc => cc.length > 0)) : new Set();
    const newCreditCards: Set<string> = newValue ? new Set(newValue.split(",").filter(cc => cc.length > 0)) : new Set();

    const addedCards = [...newCreditCards].filter(cc => !oldCreditCards.has(cc));
    const removedCards = [...oldCreditCards].filter(cc => !newCreditCards.has(cc));

    return [addedCards, removedCards];
  };

  if (changelog === null) {
    return null;
  }

  return (
    <div>
      <span>{t('clientChangelogWidget.listOfChanges')}</span>
      <ul>
        {changelog && changelog.map((change, key) => {
          if (change.type !== 'CREATED' && change.type !== 'UPDATED' && change.type !== 'DELETED') {
            return null;
          }
                     
          return (<li key={key}>
            <div className="mt-2">
              <p>
                <span>[{currentLanguage.formatDateTime(change.timestamp.tz(moment.tz.guess()))}]</span>
              </p>
              <p>
                <Trans
                  i18nKey={`clientChangelogWidget.changeType.${change.type.toLowerCase()}`}
                  t={t}
                  values={{ author: (change.authorUsername ? change.authorUsername : change.authorId) }}
                  components={{ profileUrl: <Link to={`/profile/id/${change.authorId}`}></Link> }}
                />
              </p>
              {(change.changeset.length > 0) && (
                <div>
                  <span>{t('clientChangelogWidget.fieldsChanged')}</span>
                  <ul>
                    {change.changeset.flatMap((changeItem: ClientChangeField): FieldChange[] => {
                      if (changeItem.field === "creditCards") {
                        const [addedCards, removedCards] = parseCreditCardsChanges(changeItem.old, changeItem.new);

                        const removedChangeSet = removedCards.map(cc => ({
                          field: "creditCard",
                          character: "removed",
                          oldValue: undefined,
                          value: cc,
                        }));
                                                
                        const addedChangeSet = addedCards.map(cc => ({
                          field: "creditCard",
                          character: "added",
                          oldValue: undefined,
                          value: cc,
                        }));

                        return [...removedChangeSet, ...addedChangeSet];
                      } else {
                        return [{
                          field: changeItem.field,
                          character: parseFieldChangeCharacter(changeItem.old, changeItem.new),
                          oldValue: formatFieldValue(changeItem.field, changeItem.old),
                          value: formatFieldValue(changeItem.field, changeItem.new),
                        }];
                      }
                    }).map((changes, i) => {
                      return (
                        <li key={i}>
                          <Trans
                            i18nKey={`clientChangelogWidget.field.${changes.character}.${changes.field}`}
                            t={t}
                            values={{ 
                              value: changes.value, 
                              oldValue: changes.oldValue
                            }}
                            components={{ bold: <b></b>, highlight: <code className="pl-1 pr-1"></code> }}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </li>);
        })}
      </ul>
    </div>
  );
};

export default ClientChangelogWidget;
