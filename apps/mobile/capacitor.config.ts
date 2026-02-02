import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.rinklink.mobile',
  appName: 'RinkLink.ai',
  webDir: '../../dist/apps/mobile/browser',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#0c4066',
      showSpinner: false,
    },
  },
};

export default config;
