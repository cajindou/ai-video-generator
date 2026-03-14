import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, usePageScroll } from '@tarojs/taro';
import { useState, useEffect, PropsWithChildren, useCallback } from 'react';
import { ChevronLeft, House } from 'lucide-react-taro';

interface NavConfig {
  navigationBarTitleText?: string;
  navigationBarBackgroundColor?: string;
  navigationBarTextStyle?: 'black' | 'white';
  navigationStyle?: 'default' | 'custom';
  transparentTitle?: 'none' | 'always' | 'auto';
}

enum LeftIcon {
  Back = 'back',
  Home = 'home',
  None = 'none',
}

interface NavState {
  visible: boolean;
  title: string;
  bgColor: string;
  textStyle: 'black' | 'white';
  navStyle: 'default' | 'custom';
  transparent: 'none' | 'always' | 'auto';
  leftIcon: LeftIcon;
}

const DEFAULT_NAV_STATE: NavState = {
  visible: false,
  title: '',
  bgColor: '#ffffff',
  textStyle: 'black',
  navStyle: 'default',
  transparent: 'none',
  leftIcon: LeftIcon.None,
};

const getTabBarPages = (): Set<string> => {
  const tabBar = Taro.getApp()?.config?.tabBar;
  return new Set(
    tabBar?.list?.map((item: { pagePath: string }) => item.pagePath) || [],
  );
};

const computeLeftIcon = (
  route: string,
  tabBarPages: Set<string>,
  historyLength: number,
): LeftIcon => {
  if (!route) return LeftIcon.None;

  const isHomePage =
    route === 'pages/index/index' || route === '/pages/index/index';
  const isTabBarPage = tabBarPages.has(route);
  const hasHistory = historyLength > 1;

  if (isTabBarPage || isHomePage) return LeftIcon.None;
  if (hasHistory) return LeftIcon.Back;
  return LeftIcon.Home;
};

export const H5NavBar = ({ children }: PropsWithChildren) => {
  const [navState, setNavState] = useState<NavState>(DEFAULT_NAV_STATE);
  const [scrollOpacity, setScrollOpacity] = useState(0);

  const updateNavState = useCallback(() => {
    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const route = currentPage?.route || '';
    const config: NavConfig = (currentPage as any)?.config || {};
    const tabBarPages = getTabBarPages();

    const isSinglePageApp = tabBarPages.size <= 1 && pages.length <= 1;

    setNavState({
      visible: !isSinglePageApp,
      title: config.navigationBarTitleText || '',
      bgColor: config.navigationBarBackgroundColor || '#ffffff',
      textStyle: config.navigationBarTextStyle || 'black',
      navStyle: config.navigationStyle || 'default',
      transparent: config.transparentTitle || 'none',
      leftIcon: isSinglePageApp
        ? LeftIcon.None
        : computeLeftIcon(route, tabBarPages, pages.length),
    });
  }, []);

  useDidShow(() => {
    updateNavState();
  });

  usePageScroll(({ scrollTop }) => {
    if (navState.transparent === 'auto') {
      setScrollOpacity(Math.min(scrollTop / 100, 1));
    }
  });

  useEffect(() => {
    if (TARO_ENV !== 'h5') return;

    const titleEl = document.querySelector('title') || document.head;
    const observer = new MutationObserver(() => updateNavState());
    observer.observe(titleEl, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [updateNavState]);

  if (
    TARO_ENV !== 'h5' ||
    navState.navStyle === 'custom' ||
    !navState.visible
  ) {
    return <>{children}</>;
  }

  const iconColor = navState.textStyle === 'white' ? '#fff' : '#333';
  const textColorClass =
    navState.textStyle === 'white' ? 'text-white' : 'text-gray-800';

  const getBgStyle = () => {
    if (navState.transparent === 'always') {
      return { backgroundColor: 'transparent' };
    }
    if (navState.transparent === 'auto') {
      return { backgroundColor: navState.bgColor, opacity: scrollOpacity };
    }
    return { backgroundColor: navState.bgColor };
  };

  const handleBack = () => Taro.navigateBack();
  const handleGoHome = () => Taro.switchTab({ url: '/pages/index/index' });

  return (
    <View className="flex flex-col h-full">
      <View
        className={`fixed top-0 left-0 right-0 h-11 flex items-center justify-center z-1000 ${navState.transparent === 'none' ? 'border-b border-gray-200' : ''}`}
        style={getBgStyle()}
      >
        {navState.leftIcon === LeftIcon.Back && (
          <View
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center"
            onClick={handleBack}
          >
            <ChevronLeft size={24} color={iconColor} />
          </View>
        )}
        {navState.leftIcon === LeftIcon.Home && (
          <View
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center"
            onClick={handleGoHome}
          >
            <House size={22} color={iconColor} />
          </View>
        )}
        <Text
          className={`text-base font-medium max-w-3/5 truncate ${textColorClass}`}
        >
          {navState.title}
        </Text>
      </View>
      <View className="h-11 shrink-0" />
      <View className="pb-11 h-full">{children}</View>
    </View>
  );
};
