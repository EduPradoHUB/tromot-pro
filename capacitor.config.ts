import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bc258fac6bb8419b8b51b94515b0f521',
  appName: 'tromot-pro',
  webDir: 'dist',
  server: {
    url: 'https://bc258fac-6bb8-419b-8b51-b94515b0f521.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a365d',
      showSpinner: false
    }
  }
};

export default config;