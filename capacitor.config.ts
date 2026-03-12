import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'nl.inburgering.app',
  appName: 'Inburgering App',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    // iOS 16.0 minimum (PRD §25.1)
    deploymentTarget: '16.0',
    contentInset: 'automatic',
  },
  android: {
    // Android 8.0+ / API 26+ (PRD §25.2)
    minSdkVersion: 26,
    targetSdkVersion: 35,
  },
};

export default config;
