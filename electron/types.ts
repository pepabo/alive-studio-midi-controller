export interface OBSConfig {
  host: string;
  port: number;
  password: string;
  bgmSourceName: string;
}

export interface AliveStudioConfig {
  vendorName: string;
  requestType: string;
}

export interface MIDIBinding {
  type: 'obs' | 'alive-studio';
  action?: string;
  value?: number;
  seconds?: number;
  parameter?: string; // For Alive Studio: "key=alive-studio-bgm&value=..."
}

export interface MIDIConfig {
  device: string;
  bindings: Record<string, MIDIBinding>;
}

export interface AppConfig {
  obs: OBSConfig;
  aliveStudio: AliveStudioConfig;
  midi: MIDIConfig;
}

export interface TestOBSResult {
  success: boolean;
  error?: string;
}
