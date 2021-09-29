import { FC, createContext, useContext, useEffect, useState } from 'react';

export interface ScreenSizeDependentContentContextType {
  isOnSmallScreen: boolean;
}

const ScreenSizeDependentContentContext = createContext<ScreenSizeDependentContentContextType>({} as ScreenSizeDependentContentContextType);

const ScreenSizeDependentContentProvider: FC = (props: any) => {
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

export const useScreenSizeDependentContent = () => useContext(ScreenSizeDependentContentContext);

export const OnSmallScreen: FC = (props: any) => {
  const { isOnSmallScreen } = useScreenSizeDependentContent();

  if (isOnSmallScreen) {
    return <>{props.children}</>;
  } else {
    return <></>;
  }
};

export const OnRegularScreen: FC = (props: any) => {
  const { isOnSmallScreen } = useScreenSizeDependentContent();

  if (!isOnSmallScreen) {
    return <>{props.children}</>;
  } else {
    return <></>;
  }
};

export default ScreenSizeDependentContentProvider;
