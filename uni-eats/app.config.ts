import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Uni-Eats",
  slug: "uni-eats",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/UniEatsLogo.png",
  scheme: "unieats",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.unieats.app",
    icon: "./assets/images/UniEatsLogo.png"
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#02AA20",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.unieats.app"
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
    "expo-maps"
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true
  }
});
