declare module 'react-simple-maps' {
  import { ComponentType, ReactNode, SVGProps, MouseEvent } from 'react';

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    style?: React.CSSProperties;
    width?: number;
    height?: number;
    children?: ReactNode;
  }
  export const ComposableMap: ComponentType<ComposableMapProps>;

  export interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: GeoType[] }) => ReactNode;
  }
  export const Geographies: ComponentType<GeographiesProps>;

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: GeoType;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
  }
  export const Geography: ComponentType<GeographyProps>;

  export interface MarkerProps {
    coordinates: [number, number];
    onClick?: (event: MouseEvent<SVGGElement>) => void;
    children?: ReactNode;
    style?: React.CSSProperties;
  }
  export const Marker: ComponentType<MarkerProps>;

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    children?: ReactNode;
    translateExtent?: [[number, number], [number, number]];
  }
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;

  export interface GeoType {
    rsmKey: string;
    type: string;
    properties: Record<string, unknown>;
    geometry: object;
  }
}
