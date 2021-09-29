import { FC, PropsWithChildren, useState } from "react";
import { Spinner } from 'reactstrap';

import { useSession } from "./SessionProvider";

const SessionOverlay: FC = (props: PropsWithChildren<{}>) => {
  const [isLoading, setIsLoading] = useState(true);

  const { useActiveSession, useMissingSession } = useSession();

  const loadingDone = () => {
    setIsLoading(false);
  };

  useActiveSession(_ => loadingDone());
  useMissingSession(() => loadingDone());

  if (isLoading) {
    return (<>
      <div className="text-center mt-4">
        <Spinner />
      </div>
    </>);
  }

  return (<>
    {props.children}
  </>);
};

export default SessionOverlay;
