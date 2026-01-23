import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Uni Eats",
  slug: "unieats",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "unieats",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.unieats2.app",
    icon: "./assets/images/icon.png",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#02AA20",
      foregroundImage: "./assets/images/icon.png",
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.unieats2.app"
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#02AA20",
        dark: {
          backgroundColor: "#02AA20"
        }
      }
    ],
    "expo-maps",
    "expo-notifications"
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true
  },
  extra: {
    eas: {
      projectId: "820258d6-8338-4456-9372-fef8f7b7b722"
    }
  },
  owner: "pascalnoacks-organization"
});
