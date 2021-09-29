import { FC, createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';

export interface ScreenSizeDependentContentContextType {
  isOnSmallScreen: boolean;
}

const ScreenSizeDependentContentContext = createContext<ScreenSizeDependentContentContextType>({} as ScreenSizeDependentContentContextType);

const ScreenSizeDependentContentProvider: FC = (props: PropsWithChildren<unknown>) => {
  const checkIsOnSmallScreen = (): boolean => {
    return window.innerWidth <= 760;
  };

  const [isOnSmallScreen, setIsOnSmallScreen] = useState<boolean>(() => checkIsOnSmallScreen());

  useEffect(() => {
    window.addEventListener("resize", () => setIsOnSmallScreen(checkIsOnSmallScreen()));
    window.addEventListener("orientationchange", () => setIsOnSmallScreen(checkIsOnSmallScreen()));
  }, []);

  return (
    <ScreenSizeDependentContentContext.Provider value={{
      isOnSmallScreen
    }}>
      {props.children}
    </ScreenSizeDependentContentContext.Provider>
  );
};

export const useScreenSizeDependentContent: (() => ScreenSizeDependentContentContextType) = () => useContext(ScreenSizeDependentContentContext);

export const OnSmallScreen: FC = (props: PropsWithChildren<unknown>) => {
  const { isOnSmallScreen } = useScreenSizeDependentContent();

  if (isOnSmallScreen) {
    return <>{props.children}</>;
  } else {
    return <></>;
  }
};

export const OnRegularScreen: FC = (props: PropsWithChildren<unknown>) => {
  const { isOnSmallScreen } = useScreenSizeDependentContent();

  if (!isOnSmallScreen) {
    return <>{props.children}</>;
  } else {
    return <></>;
  }
};

export default ScreenSizeDependentContentProvider;
