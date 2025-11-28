import { contextBridge, ipcRenderer } from 'electron';
import { AppConfig, OBSConfig, TestOBSResult } from './types';

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

contextBridge.exposeInMainWorld('api', {
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke('get-config'),
  saveConfig: (config: AppConfig): Promise<boolean> => ipcRenderer.invoke('save-config', config),
  getMidiDevices: (): Promise<string[]> => ipcRenderer.invoke('get-midi-devices'),
  testOBSConnection: (obsConfig: OBSConfig): Promise<TestOBSResult> => ipcRenderer.invoke('test-obs-connection', obsConfig),
  onMidiMessage: (callback: (note: number, velocity: number) => void) => {
    ipcRenderer.on('midi-message', (_event, note: number, velocity: number) => {
      callback(note, velocity);
    });
  },
  removeMidiMessageListener: () => {
    ipcRenderer.removeAllListeners('midi-message');
  },
  // 音量バランス調整用
  getAudioSources: (): Promise<{ micSources: string[]; bgmSources: string[] }> => ipcRenderer.invoke('get-audio-sources'),
  startVolumeMeasure: (sources: string[], durationMs: number): Promise<VolumeMeasureResult> =>
    ipcRenderer.invoke('start-volume-measure', sources, durationMs),
  setSourceVolume: (sourceName: string, db: number): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('set-source-volume', sourceName, db),
  // Alive Studioアクションをトリガー（MIDIキー割り当てと同じ処理）
  triggerAliveStudioAction: (parameter: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('trigger-alive-studio-action', parameter)
});
