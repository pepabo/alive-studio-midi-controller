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
  type: 'obs' | 'url' | 'alive-studio';
  action?: string;
  value?: number;
  seconds?: number;
  url?: string;
  parameter?: string;
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

declare global {
  interface Window {
    api: {
      getConfig: () => Promise<AppConfig>;
      saveConfig: (config: AppConfig) => Promise<boolean>;
      getMidiDevices: () => Promise<string[]>;
      testOBSConnection: (obsConfig: OBSConfig) => Promise<TestOBSResult>;
    };
  }
}
