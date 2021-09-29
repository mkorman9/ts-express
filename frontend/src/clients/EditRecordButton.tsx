import { FC } from 'react';
import { Button } from 'reactstrap';
import { BiEdit } from 'react-icons/bi';

export interface EditRecordButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const EditRecordButton: FC<EditRecordButtonProps> = ({ onClick, disabled }) => {
  return (<>
    <Button className="mb-1" onClick={onClick} color="primary" disabled={disabled}>
      <span><BiEdit color="white" /></span>
    </Button>
  </>);
};

export default EditRecordButton;
