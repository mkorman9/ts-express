import { FC } from 'react';
import { useSession } from '../session/SessionProvider';
import RolesBadges from './RolesBadges';
import RolesEditor from './RolesEditor';

export interface RolesWidgetProps {
  roles: Set<string>;
  accountId: string;
}

const RolesWidget: FC<RolesWidgetProps> = ({ roles, accountId }) => {
  const { session } = useSession();

  if (session.data.roles.has('PERMISSIONS_ADMIN')) {
    return <RolesEditor assignedRoles={roles} accountId={accountId} />;
  } else {
    return <RolesBadges assignedRoles={roles} />;
  }
};

export default RolesWidget;
