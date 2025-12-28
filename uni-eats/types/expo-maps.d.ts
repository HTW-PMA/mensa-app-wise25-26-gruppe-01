declare module 'expo-maps' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface CameraPosition {
    center: { latitude: number; longitude: number };
    pitch?: number;
    heading?: number;
    zoom?: number;
    altitude?: number;
  }

  export interface MapViewProps extends ViewProps {
    initialCameraPosition?: CameraPosition;
    children?: React.ReactNode;
  }

  const MapView: React.ComponentType<MapViewProps>;

  export interface MarkerProps {
    coordinate: { latitude: number; longitude: number };
    title?: string;
    description?: string;
    onPress?: () => void;
    children?: React.ReactNode;
  }

  export const Marker: React.ComponentType<MarkerProps>;

  export default MapView;
}
