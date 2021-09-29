import { FC, PropsWithChildren, useState } from "react";
import { Spinner } from 'reactstrap';

import { useAccountInfo } from "./AccountInfo";

const AccountInfoOverlay: FC = (props: PropsWithChildren<{}>) => {
  const [isLoading, setIsLoading] = useState(true);

  const { useLoadedAccountInfo, useMissingAccountInfo } = useAccountInfo();

  const loadingDone = () => {
    setIsLoading(false);
  };

  useLoadedAccountInfo(_ => loadingDone());
  useMissingAccountInfo(() => loadingDone());

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

export default AccountInfoOverlay;
