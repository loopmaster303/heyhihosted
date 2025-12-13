import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'space.heyhi.app',
  appName: 'Hey Hi',
  server: {
    url: 'https://hey-hi.space',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
    },
  }
};

export default config;
