import { FC } from 'react';
import { Button } from 'reactstrap';
import { MdDelete } from 'react-icons/md';

export interface DeleteRecordButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const DeleteRecordButton: FC<DeleteRecordButtonProps> = ({ onClick, disabled }) => {
  return (<>
    <Button className="mb-1" onClick={onClick} color="danger" disabled={disabled}>
      <span><MdDelete color="white" /></span>
    </Button>
  </>);
};

export default DeleteRecordButton;
