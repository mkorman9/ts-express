import { FC, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, FormFeedback, Label, Input } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router';
import { toast } from 'react-toastify';
import { MdAdd } from 'react-icons/md';
import type { Moment } from 'moment';

import { useClientsAPI, ClientPayload, ClientErrorCause } from './ClientsAPI';
import { useAccountInfo } from '../accounts/AccountInfo';
import { UnauthorizedError, ValidationError } from '../common/API';
import CreditCardsListEditor from './CreditCardsListEditor';
import DateSelector from '../common/DateSelector';
import type { CreditCardErrorCause } from './CreditCardsListEditor';

export interface AddRecordButtonProps {
  refreshData: (modifiedRecordId?: string) => void;
}

const AddRecordButton: FC<AddRecordButtonProps> = ({ refreshData }) => {
  const { t } = useTranslation();
  const { addClient } = useClientsAPI();
  const { useLoadedAccountInfo, reloadAccountInfo } = useAccountInfo();
  const history = useHistory();

  const [modalOpen, setModalOpen] = useState<boolean>(() => false);
  const [gender, setGender] = useState<string>(() => "-");
  const [firstName, setFirstName] = useState<string>(() => "");
  const [lastName, setLastName] = useState<string>(() => "");
  const [address, setAddress] = useState<string>(() => "");
  const [phoneNumber, setPhoneNumber] = useState<string>(() => "");
  const [email, setEmail] = useState<string>(() => "");
  const [birthDate, setBirthDate] = useState<Moment | null>(() => null);
  const [creditCards, setCreditCards] = useState<string[]>(() => []);
  const [firstNameError, setFirstNameError] = useState<string>(() => "");
  const [lastNameError, setLastNameError] = useState<string>(() => "");
  const [emailError, setEmailError] = useState<string>(() => "");
  const [creditCardsErrors, setCreditCardsErrors] = useState<CreditCardErrorCause[]>(() => []);
  const [isLoading, setIsLoading] = useState<boolean>(() => false);
  const [disabled, setDisabled] = useState<boolean>(() => false);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    setGender("-");
    setFirstName("");
    setLastName("");
    setAddress("");
    setPhoneNumber("");
    setEmail("");
    setBirthDate(null);
    setCreditCards([]);
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setCreditCardsErrors([]);
  };

  const handleAdd = () => {
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

    addClient(payload)
      .then(() => {
        toast.success(t('addRecord.successToast', { name: firstName + ' ' + lastName }), { autoClose: 2000, hideProgressBar: true, closeOnClick: true });
        toggleModal();
        refreshData();
      })
      .catch(err => {
        if (err instanceof UnauthorizedError) {
          history.push('/login');
        } else if (err instanceof ValidationError) {
          err.causes.forEach(cause => {
            const field = cause.field;
            const code = cause.code;

            if (field === "firstName") {
              setFirstNameError(t('addRecord.requiredError'));
            } else if (field === "lastName") {
              setLastNameError(t('addRecord.requiredError'));
            } else if (field === "email") {
              setEmailError(t('addRecord.emailFormatError'));
            } else if (field === "creditCards.number") {
              let creditCardIndex = (cause as ClientErrorCause).creditCardIndex;
              if (creditCardIndex === null || creditCardIndex === undefined) {
                creditCardIndex = 0;
              }

              if (code === "required" || code === "ccnumber") {
                const ccErrors = creditCardsErrors || [];
                ccErrors.push({index: creditCardIndex, value: t('addRecord.creditCardFormatError') });
                setCreditCardsErrors(ccErrors);
              }
            } else if (field === "account") {
              if (code === "banned") {
                toast.error(t('addRecord.accountBannedError'));
                reloadAccountInfo();
              }
            }
          });
        } else {
          toast.error(t('addRecord.serverError'));
        }
      })
      .finally(() => {
        setIsLoading(false);  
      });
  };

  useLoadedAccountInfo((accountInfo) => {
    setDisabled(accountInfo.data.isBanned);
  });

  const validateForm = () => {
    if (firstNameError !== "" || lastNameError !== "" || emailError !== "") {
      return false;
    }

    if (firstName.length === 0 || lastName.length === 0) {
      return false;
    }

    return true;
  };

  return (<>
    <div className="float-right mb-2">
      <Button onClick={toggleModal} color="success" disabled={disabled}>
        <span><MdAdd color="white" /></span>{' ' + t('addRecord.button')}
      </Button>
    </div>

    {modalOpen && (
      <Modal isOpen={modalOpen} toggle={toggleModal}>
        <ModalHeader toggle={toggleModal}>{t('addRecord.header')}</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="gender">{t('addRecord.gender')}</Label>
            <Input type="select" name="gender" id="gender"
              value={gender}
              onChange={e => setGender(e.target.value)}
            >
              <option value="-">{t('addRecord.genders.NA')}</option>
              <option value="M">{t('addRecord.genders.M')}</option>
              <option value="F">{t('addRecord.genders.F')}</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for="firstName"><>{t('addRecord.firstName')}<span style={{color: "red"}}> *</span></></Label>
            <Input type="text" name="firstName" id="firstName"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              invalid={firstNameError !== ""}
              onFocus={() => setFirstNameError("")}
            />
            <FormFeedback valid={firstNameError === ""}>{firstNameError}</FormFeedback>
          </FormGroup>
          <FormGroup>
            <Label for="lastName"><>{t('addRecord.lastName')}<span style={{color: "red"}}> *</span></></Label>
            <Input type="text" name="lastName" id="lastName"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              invalid={lastNameError !== ""}
              onFocus={() => setLastNameError("")}
            />
            <FormFeedback valid={lastNameError === ""}>{lastNameError}</FormFeedback>
          </FormGroup>
          <FormGroup>
            <Label for="address">{t('addRecord.address')}</Label>
            <Input type="text" name="address" id="address"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label for="phoneNumber">{t('addRecord.phoneNumber')}</Label>
            <Input type="text" name="phoneNumber" id="phoneNumber"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label for="email">{t('addRecord.email')}</Label>
            <Input type="text" name="email" id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              invalid={emailError !== ""}
              onFocus={() => setEmailError("")}
            />
            <FormFeedback valid={emailError === ""}>{emailError}</FormFeedback>
          </FormGroup>
          <FormGroup>
            <Label for="birthDate">{t('addRecord.birthDate')}</Label>
            <DateSelector id="birthDate" value={birthDate} onChange={v => setBirthDate(v)} />
          </FormGroup>
          <FormGroup>
            <Label for="creditCards">{t('addRecord.creditCards')}</Label>
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
          <Button color="primary" onClick={handleAdd} disabled={isLoading || !validateForm()}>{t('addRecord.addButton')}</Button>
          {' '}
          <Button color="secondary" onClick={toggleModal}>{t('addRecord.cancelButton')}</Button>
        </ModalFooter>
      </Modal>
    )}
  </>);
};

export default AddRecordButton;
