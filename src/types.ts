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

export interface VolumeMeasureResult {
  success: boolean;
  error?: string;
  results?: {
    [key: string]: {
      peakDb: number;        // 最大ピーク値 (dBFS) - フェーダー後
      rmsDb: number;         // RMS平均 (dBFS) - 体感音量に近い
      inputPeakDb: number;   // 入力ピーク値 (dBFS) - フェーダー前
      faderDb: number;       // 現在のフェーダー設定 (dB)
      sampleCount: number;   // 有効サンプル数
    };
  };
}

declare global {
  interface Window {
    api: {
      getConfig: () => Promise<AppConfig>;
      saveConfig: (config: AppConfig) => Promise<boolean>;
      getMidiDevices: () => Promise<string[]>;
      testOBSConnection: (obsConfig: OBSConfig) => Promise<TestOBSResult>;
      onMidiMessage: (callback: (note: number, velocity: number) => void) => void;
      removeMidiMessageListener: () => void;
      // 音量バランス調整用
      getAudioSources: () => Promise<{ micSources: string[]; bgmSources: string[] }>;
      startVolumeMeasure: (sources: string[], durationMs: number) => Promise<VolumeMeasureResult>;
      setSourceVolume: (sourceName: string, db: number) => Promise<{ success: boolean; error?: string }>;
      // Alive Studioアクションをトリガー（MIDIキー割り当てと同じ処理）
      triggerAliveStudioAction: (parameter: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}
