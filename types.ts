
export interface Object3DParams {
  name: string;
  shapeType: 'box' | 'sphere' | 'cylinder' | 'capsule' | 'torus' | 'complex';
  dimensions: {
    width: number;
    height: number;
    depth: number;
    radius?: number;
    segments?: number;
  };
  meshData?: {
    vertices: number[];
    indices: number[];
  };
  material: {
    color: string;
    metalness: number;
    roughness: number;
    emissive?: string;
    emissiveIntensity?: number;
    opacity?: number;
    transparent?: boolean;
  };
  spatialDescription: string;
}

export interface CaptureImage {
  id: string;
  url: string;
  base64: string;
  mimeType: string;
}

export interface StoredModel {
  id: string;
  name: string;
  timestamp: number;
  params: Object3DParams;
  thumbnail?: string;
}

export enum AppState {
  WELCOME = 'WELCOME',
  HOME = 'HOME',
  SCAN_CAPTURE = 'SCAN_CAPTURE',
  SCAN_PROCESSING = 'SCAN_PROCESSING',
  VIEWER = 'VIEWER',
  LIBRARY = 'LIBRARY'
}
