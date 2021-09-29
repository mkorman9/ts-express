import { FC, useState, Dispatch, SetStateAction } from 'react';
import { Button, Input } from 'reactstrap';

export interface CreditCardErrorCause {
    index: number;
    value: string;
}

export interface CreditCardsListEditorProps {
    id: string;
    values: string[];
    setValues: Dispatch<SetStateAction<string[]>>;
    errors: CreditCardErrorCause[];
    setErrors: Dispatch<SetStateAction<CreditCardErrorCause[]>>;
}

const CreditCardsListEditor: FC<CreditCardsListEditorProps> = ({ id, values, setValues, errors, setErrors }) => {
    const [isEmpty, setIsEmpty] = useState<boolean>(() => !values || values.length === 0);

    const addRow = () => {
        let newValues = values.concat([""]);
        setValues(newValues);
        setIsEmpty(false);
    };

    const deleteRow = (index: number) => {
        const valuesCopy: string[] = [];
        values.forEach((v, i) => {
            if (i !== index) {
                valuesCopy.push(v);
            }
        });

        setValues(valuesCopy);

        if (valuesCopy.length === 0) {
            setIsEmpty(true);
        }
    };

    const handleValueChange = (newValue: string, i: number) => {
        if (newValue.length > 19) {
            return;
        }

        let oldValue = values[i];
        if (newValue.length > oldValue.length) {
            let change = newValue[newValue.length - 1];
            if (isNaN(parseInt(change))) {
                return;
            }

            if (newValue.length === 4 || newValue.length === 9 || newValue.length === 14) {
                newValue += ' ';
            }
            if (oldValue.length === 4 || oldValue.length === 9 || oldValue.length === 14) {
                newValue = oldValue + ' ' + change;
            }
        } else {
            if (newValue[newValue.length - 1] === ' ') {
                newValue = newValue.slice(0, newValue.length - 1);
            }
        }

        const valuesCopy = [...values];
        valuesCopy[i] = newValue;
        setValues(valuesCopy);
    };

    const getErrorForValue = (index: number) => {
        if (errors.length === 0) {
            return "";
        }

        const valueErrors = errors.filter(e => e !== null && e.index === index);
        if (valueErrors.length > 0) {
            return valueErrors[0].value;
        }
        
        return "";
    };

    const clearErrorForValue = (index: number) => {
        if (errors.length === 0) {
            return;
        }

        const errorsCopy: CreditCardErrorCause[] = [];
        errors.forEach(e => {
            if (e !== null && e.index !== index) {
                errorsCopy.push(e);
            }
        });
    
        setErrors(errorsCopy);
    };

    if (isEmpty) {
        return (
            <div id={id}>
                <Button color="primary" onClick={addRow}>+</Button>
            </div>
        );
    } else {
        return (
            <div id={id}>
                {values.map((value, i) => {
                    return <div id={id + "Input" + i} key={i}>
                        <div className="form-row mt-2">
                            <div className="col-md-10">
                                <Input
                                    type="text" 
                                    name={"creditCard" + i}
                                    id={"creditCard" + i}
                                    placeholder="0000 0000 0000 0000"
                                    value={value}
                                    onChange={e => handleValueChange(e.target.value, i)}
                                    invalid={getErrorForValue(i) !== ""}
                                    onFocus={() => clearErrorForValue(i)}
                                />
                                {getErrorForValue(i) !== "" &&
                                    <span className="invalid-feedback d-block">{getErrorForValue(i)}</span>
                                }
                            </div>
                            <div className="col-md-1">
                                <Button color="danger" onClick={e => deleteRow(i)}>-</Button>
                            </div>
                        </div>
                        {' '}
                    </div>
                })}
                <br />
                <Button color="primary" onClick={addRow}>+</Button>
            </div>
        );
    }
};

export default CreditCardsListEditor;
