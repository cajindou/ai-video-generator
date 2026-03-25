import { useLaunch } from '@tarojs/taro';
import { PropsWithChildren } from 'react';
import { H5NavBar } from './h5-navbar';
import { injectH5Styles } from './h5-styles';
import { enableWxDebugIfNeeded } from './wx-debug';

export const Preset = ({ children }: PropsWithChildren) => {
  useLaunch(() => {
    enableWxDebugIfNeeded();
    injectH5Styles();

    // 移除启动时自动登录，改为用户操作时按需登录
    // 这样可以避免小程序启动时发起网络请求导致的超时问题
  });

  if (TARO_ENV === 'h5') {
    return <H5NavBar>{children}</H5NavBar>;
  }

  return <>{children}</>;
};
