import { FC, useMemo } from 'react';
import { Badge } from 'reactstrap';

export interface RolesBadgesProps {
  assignedRoles: Set<string>;
}

const RolesBadges: FC<RolesBadgesProps> = ({ assignedRoles }) => {
  const roles = useMemo(() => Array.from(assignedRoles), [assignedRoles]);

  if (!roles || roles.length === 0) {
    return (<div id="roles">-</div>);
  }

  return (<div id="roles">
    {roles.map((roleName, i) => {
      let color = "secondary";

      if (roleName === "PERMISSIONS_ADMIN") {
        color = "success";
      } else if (roleName === "CLIENTS_EDITOR") {
        color = "danger";
      }

      return (
        <span key={i}><Badge color={color}>{roleName}</Badge> </span>
      );
    })}
  </div>);
};

export default RolesBadges;
