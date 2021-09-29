import { FC, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, FormFeedback, Label, Input } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router';
import { toast } from 'react-toastify';
import type { Moment } from 'moment';

import { useClientsAPI, Client, ClientPayload, ClientErrorCause } from './ClientsAPI';
import { useAccountInfo } from '../accounts/AccountInfo';
import { UnauthorizedError, ValidationError } from '../common/API';
import CreditCardsListEditor from './CreditCardsListEditor';
import DateSelector from '../common/DateSelector';
import type { CreditCardErrorCause } from './CreditCardsListEditor';

export interface EditRecordModalProps {
  record: Client;
  refreshData: (modifiedRecordId?: string) => void;
  close: () => void;
}

const EditRecordModal: FC<EditRecordModalProps> = ({ record, refreshData, close }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { updateClient } = useClientsAPI();
  const { reloadAccountInfo } = useAccountInfo();

  const [gender, setGender] = useState<string>(() => record.gender);
  const [firstName, setFirstName] = useState<string>(() => record.firstName);
  const [lastName, setLastName] = useState<string>(() => record.lastName);
  const [address, setAddress] = useState<string>(() => record.address);
  const [phoneNumber, setPhoneNumber] = useState<string>(() => record.phoneNumber);
  const [email, setEmail] = useState<string>(() => record.email);
  const [birthDate, setBirthDate] = useState<Moment | null>(() => record.birthDate);
  const [creditCards, setCreditCards] = useState<string[]>(() => record.creditCards.map(card => card.number));
  const [firstNameError, setFirstNameError] = useState<string>(() => "");
  const [lastNameError, setLastNameError] = useState<string>(() => "");
  const [emailError, setEmailError] = useState<string>(() => "");
  const [creditCardsErrors, setCreditCardsErrors] = useState<CreditCardErrorCause[]>(() => []);
  const [isLoading, setIsLoading] = useState<boolean>(() => false);

  const handleEdit = () => {
    setIsLoading(true);

    const payload: ClientPayload = {
      gender: gender || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      address: address || undefined,
      phoneNumber: phoneNumber || undefined,
      email: email || undefined,
      birthDate: birthDate || undefined,
      creditCards: creditCards.map(cardNumber => ({number: cardNumber}))
    };

    updateClient(record.id, payload)
      .then(() => {
        toast.success(t('editRecord.successToast', { name: firstName + ' ' + lastName }), { autoClose: 2000, hideProgressBar: true, closeOnClick: true });
        refreshData(record.id);
        close();
      })
      .catch(err => {
        if (err instanceof UnauthorizedError) {
          history.push('/login');
        } else if (err instanceof ValidationError) {
          err.causes.forEach(cause => {
            const field = cause.field;
            const code = cause.code;

            if (field === "firstName") {
              setFirstNameError(t('editRecord.requiredError'));
            } else if (field === "lastName") {
              setLastNameError(t('editRecord.requiredError'));
            } else if (field === "email") {
              setEmailError(t('editRecord.emailFormatError'));
            } else if (field === "creditCards.number") {
              let creditCardIndex = (cause as ClientErrorCause).creditCardIndex;
              if (creditCardIndex === null || creditCardIndex === undefined) {
                creditCardIndex = 0;
              }

              if (code === "required" || code === "ccnumber") {
                const ccErrors = creditCardsErrors || [];
                ccErrors.push({index: creditCardIndex, value: t('editRecord.creditCardFormatError') });
                setCreditCardsErrors(ccErrors);
              }
            } else if (field === "account") {
              if (code === "banned") {
                toast.error(t('editRecord.accountBannedError'));
                reloadAccountInfo();
              }
            }
          });
        } else {
          toast.error(t('editRecord.serverError'));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (<>
    <Modal isOpen={true} toggle={close}>
      <ModalHeader toggle={close}>{t('editRecord.header', { name: record.firstName + ' ' + record.lastName })}</ModalHeader>
      <ModalBody>
        <FormGroup>
          <Label for="gender">{t('editRecord.gender')}</Label>
          <Input type="select" name="gender" id="gender"
            value={gender}
            onChange={e => setGender(e.target.value)}
          >
            <option value="-">{t('editRecord.genders.NA')}</option>
            <option value="M">{t('editRecord.genders.M')}</option>
            <option value="F">{t('editRecord.genders.F')}</option>
          </Input>
        </FormGroup>
        <FormGroup>
          <Label for="firstName"><>{t('editRecord.firstName')}<span style={{color: "red"}}> *</span></></Label>
          <Input type="text" name="firstName" id="firstName"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            invalid={firstNameError !== ""}
            onFocus={() => setFirstNameError("")}
          />
          <FormFeedback valid={firstNameError === ""}>{firstNameError}</FormFeedback>
        </FormGroup>
        <FormGroup>
          <Label for="lastName"><>{t('editRecord.lastName')}<span style={{color: "red"}}> *</span></></Label>
          <Input type="text" name="lastName" id="lastName"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            invalid={lastNameError !== ""}
            onFocus={() => setLastNameError("")}
          />
          <FormFeedback valid={lastNameError === ""}>{lastNameError}</FormFeedback>
        </FormGroup>
        <FormGroup>
          <Label for="address">{t('editRecord.address')}</Label>
          <Input type="text" name="address" id="address"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label for="phoneNumber">{t('editRecord.phoneNumber')}</Label>
          <Input type="text" name="phoneNumber" id="phoneNumber"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label for="email">{t('editRecord.email')}</Label>
          <Input type="text" name="email" id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            invalid={emailError !== ""}
            onFocus={() => setEmailError("")}
          />
          <FormFeedback valid={emailError === ""}>{emailError}</FormFeedback>
        </FormGroup>
        <FormGroup>
          <Label for="birthDate">{t('editRecord.birthDate')}</Label>
          <DateSelector id="birthDate" value={birthDate} onChange={v => setBirthDate(v)} />
        </FormGroup>
        <FormGroup>
          <Label for="creditCards">{t('editRecord.creditCards')}</Label>
          <CreditCardsListEditor
            id="creditCards"
            values={creditCards}
            setValues={setCreditCards}
            errors={creditCardsErrors}
            setErrors={setCreditCardsErrors}
          />
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={handleEdit} disabled={isLoading}>{t('editRecord.saveButton')}</Button>
        {' '}
        <Button color="secondary" onClick={close}>{t('editRecord.cancelButton')}</Button>
      </ModalFooter>
    </Modal>
  </>);
};

export default EditRecordModal;
