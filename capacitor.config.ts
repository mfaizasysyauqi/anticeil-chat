import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anticeil.chat',
  appName: 'Anticeil Chat',
  webDir: 'dist',
  server: {
    url: 'https://app.anticeil.com',
    cleartext: false
  }
};

export default config;
