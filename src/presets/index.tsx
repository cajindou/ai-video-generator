import { useLaunch } from '@tarojs/taro';
import { PropsWithChildren } from 'react';
import { AuthService } from '@/services/auth.service';
import { H5NavBar } from './h5-navbar';
import { injectH5Styles } from './h5-styles';
import { enableWxDebugIfNeeded } from './wx-debug';

export const Preset = ({ children }: PropsWithChildren) => {
  useLaunch(() => {
    enableWxDebugIfNeeded();
    injectH5Styles();

    // 小程序端自动登录
    if (TARO_ENV === 'weapp') {
      AuthService.login().then(userInfo => {
        if (userInfo) {
          console.log('[App] 用户登录成功:', userInfo.openid);
        } else {
          console.warn('[App] 用户登录失败');
        }
      });
    }
  });

  if (TARO_ENV === 'h5') {
    return <H5NavBar>{children}</H5NavBar>;
  }

  return <>{children}</>;
};
