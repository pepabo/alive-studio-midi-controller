import { contextBridge, ipcRenderer } from 'electron';
import { AppConfig, OBSConfig, TestOBSResult } from './types';

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
  }
});
