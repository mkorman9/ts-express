import { FC, useState } from 'react';
import { FormGroup, Button, Label, Input } from 'reactstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { useAdminAPI } from '../admin/AdminAPI';

export interface RolesEditorProps {
  assignedRoles: Set<string>;
  accountId: string;
}

const RolesEditor: FC<RolesEditorProps> = ({ assignedRoles, accountId }) => {
  const { t } = useTranslation();
  const { setRolesForAccount } = useAdminAPI();

  const [roles, setRoles] = useState<string[]>(() => Array.from(assignedRoles));

  const handleSaveRoles = () => {
    setRolesForAccount(accountId, roles)
      .then(() => {
        toast.success(t('rolesEditor.success'), { autoClose: 2000, hideProgressBar: true, closeOnClick: true });
      })
      .catch(err => {
        toast.error(t('rolesEditor.serverError'));
      });
  };

  const handleRolesChange = (roleName: string, isChecked: boolean) => {
    const rolesToSet = [];
    let roleFoundOnList = false;

    roles.forEach((r) => {
      if (r === roleName) {
        roleFoundOnList = true;

        if (isChecked) {
          rolesToSet.push(r);
        }
      } else {
        rolesToSet.push(r);
      }
    });

    if (!roleFoundOnList) {
      rolesToSet.push(roleName);
    }

    setRoles(rolesToSet);
  };

  const isRoleSet = (roleName: string): boolean => {
    let roleFoundOnList = false;

    roles.forEach((r) => {
      if (r === roleName) {
        roleFoundOnList = true;
      }
    });

    return roleFoundOnList;
  };

  return (
    <FormGroup id="roles" tag="fieldset" className="border p-3">
      <FormGroup check>
        <Label check>
          <Input type="checkbox" name="clientsEditorRole" id="clientsEditorRole"
            checked={isRoleSet('CLIENTS_EDITOR')}
            onChange={e => handleRolesChange('CLIENTS_EDITOR', e.target.checked)}
          />
          {' '}CLIENTS_EDITOR
        </Label>
      </FormGroup>
      <FormGroup check>
        <Label check>
          <Input type="checkbox" name="permissionsAdminRole" id="permissionsAdminRole" 
            checked={isRoleSet('PERMISSIONS_ADMIN')}
            onChange={e => handleRolesChange('PERMISSIONS_ADMIN', e.target.checked)}
          />
          {' '}PERMISSIONS_ADMIN
        </Label>
      </FormGroup>
      <FormGroup className="mt-4">
        <Button color="secondary" onClick={handleSaveRoles}>
          {t('rolesEditor.saveButton')}
        </Button>
      </FormGroup>
    </FormGroup>
  );
};

export default RolesEditor;
