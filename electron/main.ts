import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } from 'electron';
import * as path from 'path';
import OBSWebSocket from 'obs-websocket-js';
import { Input } from '@julusian/midi';
import { ConfigManager } from './config';
import { AppConfig, MIDIBinding, OBSConfig, TestOBSResult } from './types';

let tray: Tray | null = null;
let settingsWindow: BrowserWindow | null = null;
let obsClient: OBSWebSocket | null = null;
let midiInput: Input | null = null;
let config: AppConfig | null = null;
const configManager = new ConfigManager();

let obsConnected = false;
let recordingState = false;
let fadeTimer: NodeJS.Timeout | null = null;

/**
 * OBS WebSocket接続
 */
async function connectOBS(): Promise<boolean> {
  if (!config || !config.obs) {
    console.error('OBS config not found');
    return false;
  }

  try {
    obsClient = new OBSWebSocket();
    const { host, port, password } = config.obs;

    // パスワードが空の場合はundefinedを渡す
    await obsClient.connect(`ws://${host}:${port}`, password || undefined);
    obsConnected = true;
    console.log('Connected to OBS WebSocket');

    try {
      const status = await obsClient.call('GetRecordStatus');
      recordingState = status.outputActive || false;
    } catch (err) {
      console.error('Failed to get record status:', err);
    }

    return true;
  } catch (error) {
    console.error('Failed to connect to OBS:', error);
    obsConnected = false;
    return false;
  }
}

/**
 * OBS切断
 */
function disconnectOBS(): void {
  if (obsClient) {
    try {
      obsClient.disconnect();
    } catch (error) {
      console.error('Error disconnecting OBS:', error);
    }
    obsClient = null;
    obsConnected = false;
  }
}

/**
 * MIDI初期化
 */
function initMIDI(): boolean {
  if (!config || !config.midi || !config.midi.device) {
    console.error('MIDI config not found');
    return false;
  }

  try {
    midiInput = new Input();
    const portCount = midiInput.getPortCount();
    console.log(`Found ${portCount} MIDI ports`);

    let targetPort = -1;
    for (let i = 0; i < portCount; i++) {
      const portName = midiInput.getPortName(i);
      console.log(`Port ${i}: ${portName}`);
      if (portName.includes(config.midi.device)) {
        targetPort = i;
        break;
      }
    }

    if (targetPort === -1) {
      console.error(`MIDI device not found: ${config.midi.device}`);
      return false;
    }

    midiInput.openPort(targetPort);

    midiInput.on('message', (deltaTime: number, message: number[]) => {
      const [status, note, velocity] = message;
      console.log('MIDI Message received:', { status: status.toString(16), note, velocity });
      // Note On: 0x90-0x9F
      if ((status & 0xF0) === 0x90 && velocity > 0) {
        console.log('MIDI Note On:', note, velocity);
        handleMIDIMessage(note, velocity);
      }
    });

    console.log(`MIDI device opened: ${midiInput.getPortName(targetPort)}`);
    return true;
  } catch (error) {
    console.error('Failed to initialize MIDI:', error);
    return false;
  }
}

/**
 * MIDI終了
 */
function closeMIDI(): void {
  if (midiInput) {
    try {
      midiInput.closePort();
    } catch (error) {
      console.error('Error closing MIDI:', error);
    }
    midiInput = null;
  }
}

/**
 * MIDIメッセージハンドラ
 */
function handleMIDIMessage(note: number, velocity: number): void {
  if (velocity === 0) return; // Note off

  const noteNumber = note.toString();
  const binding = config?.midi.bindings[noteNumber];

  if (binding) {
    console.log(`MIDI Note: ${noteNumber}, Action: ${binding.action || binding.type}`);
    executeAction(binding);
  }
}

/**
 * アクション実行
 */
async function executeAction(binding: MIDIBinding): Promise<void> {
  if (!binding) return;

  try {
    switch (binding.type) {
      case 'obs':
        await executeOBSAction(binding);
        break;
      case 'alive-studio':
        await executeAliveStudioAction(binding);
        break;
      default:
        console.warn('Unknown action type:', binding.type);
    }
  } catch (error) {
    console.error('Failed to execute action:', error);
  }
}

/**
 * OBSアクション実行
 */
async function executeOBSAction(binding: MIDIBinding): Promise<void> {
  if (!obsConnected || !obsClient) {
    console.error('OBS not connected');
    return;
  }

  const { action, value, seconds, parameter } = binding;

  switch (action) {
    case 'toggleRecord':
      await toggleRecord();
      break;
    case 'startRecord':
      await startRecord();
      break;
    case 'stopRecord':
      await stopRecord();
      break;
    case 'toggleStream':
      await toggleStream();
      break;
    case 'startStream':
      await startStream();
      break;
    case 'stopStream':
      await stopStream();
      break;
    case 'setScene':
      if (parameter) {
        await setScene(parameter);
      }
      break;
    case 'saveReplay':
      await saveReplay();
      break;
    case 'setVolume':
      if (value !== undefined) {
        await setVolume(value, seconds);
      }
      break;
    case 'fadeIn':
      if (seconds !== undefined) {
        await fadeInVolume(seconds, value);
      }
      break;
    case 'fadeOut':
      if (seconds !== undefined) {
        await fadeOutVolume(seconds);
      }
      break;
    default:
      console.warn('Unknown OBS action:', action);
  }
}

/**
 * Alive Studioアクション実行
 */
async function executeAliveStudioAction(binding: MIDIBinding): Promise<void> {
  if (!obsConnected || !obsClient) {
    console.error('OBS not connected (required for Alive Studio)');
    return;
  }

  if (!binding.parameter) {
    console.error('Alive Studio parameter not specified');
    return;
  }

  try {
    const BASE_URL = 'https://studio.alive-project.com/item?slot=alive-studio-ctrl&';

    // 現在のシーンを取得
    const { currentProgramSceneName } = await obsClient.call('GetCurrentProgramScene');
    console.log('Current scene:', currentProgramSceneName);

    // シーンアイテムのリストを取得
    const { sceneItems } = await obsClient.call('GetSceneItemList', {
      sceneName: currentProgramSceneName
    });

    // Alive Studioのブラウザソースを探す
    let aliveStudioSource: string | null = null;
    for (const item of sceneItems) {
      try {
        const { inputSettings } = await obsClient.call('GetInputSettings', {
          inputName: String(item.sourceName)
        });

        const url = inputSettings.url;
        if (url && typeof url === 'string' && url.includes(BASE_URL)) {
          aliveStudioSource = String(item.sourceName);
          console.log('Found Alive Studio source:', aliveStudioSource);
          break;
        }
      } catch (err) {
        // このソースは無視
        continue;
      }
    }

    if (!aliveStudioSource) {
      console.error('Alive Studio browser source not found in current scene');
      return;
    }

    // 現在の設定を取得
    const { inputSettings: currentSettings } = await obsClient.call('GetInputSettings', {
      inputName: aliveStudioSource
    });

    const currentUrl = String(currentSettings.url || '');

    // URLパラメータを抽出
    const extractParams = (url: string): string => {
      const match = url.match(/\?slot=alive-studio-ctrl&(.+)$/);
      return match ? match[1] : '';
    };

    const currentParams = extractParams(currentUrl)
      .split('&')
      .filter(param =>
        !param.startsWith('timestamp=') &&
        !binding.parameter!.includes(param.split('=')[0])
      )
      .join('&');

    // 新しいURLを構築
    const combinedParams = [
      currentParams,
      binding.parameter,
      `timestamp=${new Date().toISOString()}`
    ].filter(Boolean).join('&');

    const newUrl = `${BASE_URL}${combinedParams}`;
    console.log('Updating Alive Studio URL:', newUrl);

    // URLを更新
    await obsClient.call('SetInputSettings', {
      inputName: aliveStudioSource,
      inputSettings: {
        ...currentSettings,
        url: newUrl
      }
    });

    console.log('Alive Studio action completed successfully');
  } catch (error) {
    console.error('Failed to execute Alive Studio action:', error);
  }
}

/**
 * 録画トグル
 */
async function toggleRecord(): Promise<void> {
  try {
    const status = await obsClient!.call('GetRecordStatus');
    if (status.outputActive) {
      await stopRecord();
    } else {
      await startRecord();
    }
  } catch (error) {
    console.error('Failed to toggle record:', error);
  }
}

/**
 * 録画開始
 */
async function startRecord(): Promise<void> {
  try {
    await obsClient!.call('StartRecord');
    recordingState = true;
    console.log('Recording started');
  } catch (error) {
    console.error('Failed to start recording:', error);
  }
}

/**
 * 録画停止
 */
async function stopRecord(): Promise<void> {
  try {
    await obsClient!.call('StopRecord');
    recordingState = false;
    console.log('Recording stopped');
  } catch (error) {
    console.error('Failed to stop recording:', error);
  }
}

/**
 * 配信切り替え
 */
async function toggleStream(): Promise<void> {
  try {
    const status = await obsClient!.call('GetStreamStatus');
    if (status.outputActive) {
      await stopStream();
    } else {
      await startStream();
    }
  } catch (error) {
    console.error('Failed to toggle stream:', error);
  }
}

/**
 * 配信開始
 */
async function startStream(): Promise<void> {
  try {
    await obsClient!.call('StartStream');
    console.log('Stream started');
  } catch (error) {
    console.error('Failed to start stream:', error);
  }
}

/**
 * 配信停止
 */
async function stopStream(): Promise<void> {
  try {
    await obsClient!.call('StopStream');
    console.log('Stream stopped');
  } catch (error) {
    console.error('Failed to stop stream:', error);
  }
}

/**
 * シーン切り替え
 */
async function setScene(sceneName: string): Promise<void> {
  try {
    await obsClient!.call('SetCurrentProgramScene', { sceneName });
    console.log('Scene changed to:', sceneName);
  } catch (error) {
    console.error('Failed to change scene:', error);
  }
}

/**
 * リプレイ保存
 */
async function saveReplay(): Promise<void> {
  try {
    await obsClient!.call('SaveReplayBuffer');
    console.log('Replay saved');
  } catch (error) {
    console.error('Failed to save replay:', error);
  }
}

/**
 * 音量設定（フェード付き）
 */
async function setVolume(db: number, fadeSeconds?: number): Promise<void> {
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }

  const sourceName = config?.obs.bgmSourceName || '[Alive]BGM';
  const seconds = fadeSeconds !== undefined ? fadeSeconds : 0.5;

  // 0秒の場合は即座にセット
  if (seconds === 0) {
    try {
      const mul = Math.pow(10, db / 20);
      await obsClient!.call('SetInputVolume', {
        inputName: sourceName,
        inputVolumeMul: mul
      });
      console.log(`Volume set to ${db}dB immediately for ${sourceName}`);
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
    return;
  }

  // フェード処理
  const steps = 25;
  const interval = (seconds * 1000) / steps;

  try {
    const current = await obsClient!.call('GetInputVolume', {
      inputName: sourceName
    });

    const startMul = current.inputVolumeMul || 0.001;
    const startDB = 20 * Math.log10(startMul);
    const targetDB = db;
    const dbStep = (targetDB - startDB) / steps;

    console.log(`Fading volume from ${startDB.toFixed(1)}dB to ${targetDB}dB in ${seconds}s for ${sourceName}`);

    let step = 0;
    fadeTimer = setInterval(async () => {
      step++;
      const currentDB = startDB + (dbStep * step);
      const mul = Math.pow(10, currentDB / 20);

      try {
        await obsClient!.call('SetInputVolume', {
          inputName: sourceName,
          inputVolumeMul: mul
        });
      } catch (error) {
        console.error('Volume fade step error:', error);
        if (fadeTimer) clearInterval(fadeTimer);
        fadeTimer = null;
      }

      if (step >= steps) {
        if (fadeTimer) clearInterval(fadeTimer);
        fadeTimer = null;
        console.log(`Volume faded to ${db}dB for ${sourceName}`);
      }
    }, interval);
  } catch (error) {
    console.error('Failed to set volume:', error);
  }
}

/**
 * フェードイン
 */
async function fadeInVolume(seconds: number, targetDB: number = -15): Promise<void> {
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }

  const sourceName = config?.obs.bgmSourceName || '[Alive]BGM';
  const steps = 50;
  const interval = (seconds * 1000) / steps;

  try {
    const current = await obsClient!.call('GetInputVolume', {
      inputName: sourceName
    });

    const startMul = current.inputVolumeMul || 0.001;
    const startDB = 20 * Math.log10(startMul);
    const dbStep = (targetDB - startDB) / steps;

    let step = 0;
    fadeTimer = setInterval(async () => {
      step++;
      const currentDB = startDB + (dbStep * step);
      const mul = Math.pow(10, currentDB / 20);

      try {
        await obsClient!.call('SetInputVolume', {
          inputName: sourceName,
          inputVolumeMul: mul
        });
      } catch (error) {
        console.error('Fade step error:', error);
        if (fadeTimer) clearInterval(fadeTimer);
        fadeTimer = null;
      }

      if (step >= steps) {
        if (fadeTimer) clearInterval(fadeTimer);
        fadeTimer = null;
        console.log(`Fade in completed for ${sourceName}`);
      }
    }, interval);

    console.log(`Starting fade in over ${seconds}s for ${sourceName}`);
  } catch (error) {
    console.error('Failed to start fade in:', error);
  }
}

/**
 * フェードアウト
 */
async function fadeOutVolume(seconds: number): Promise<void> {
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }

  const sourceName = config?.obs.bgmSourceName || '[Alive]BGM';
  const targetDB = -100; // マイナス無限大相当
  const steps = 50;
  const interval = (seconds * 1000) / steps;

  try {
    const current = await obsClient!.call('GetInputVolume', {
      inputName: sourceName
    });

    const startMul = current.inputVolumeMul || 1.0;
    const startDB = 20 * Math.log10(startMul);
    const dbStep = (targetDB - startDB) / steps;

    let step = 0;
    fadeTimer = setInterval(async () => {
      step++;
      const currentDB = startDB + (dbStep * step);
      const mul = Math.pow(10, currentDB / 20);

      try {
        await obsClient!.call('SetInputVolume', {
          inputName: sourceName,
          inputVolumeMul: mul
        });
      } catch (error) {
        console.error('Fade step error:', error);
        if (fadeTimer) clearInterval(fadeTimer);
        fadeTimer = null;
      }

      if (step >= steps) {
        if (fadeTimer) clearInterval(fadeTimer);
        fadeTimer = null;
        console.log(`Fade out completed for ${sourceName}`);
      }
    }, interval);

    console.log(`Starting fade out over ${seconds}s for ${sourceName}`);
  } catch (error) {
    console.error('Failed to start fade out:', error);
  }
}

/**
 * Tray作成
 */
function createTray(): void {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  // Resize to standard tray icon size (16x16)
  const resizedIcon = icon.resize({ width: 16, height: 16 });

  tray = new Tray(resizedIcon);

  updateTrayMenu();

  tray.setToolTip('Alive Studio MIDI Controller');
}

function updateTrayMenu(): void {
  if (!tray) return;

  const loginSettings = app.getLoginItemSettings();
  const isAutoStart = loginSettings.openAtLogin;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '設定',
      click: () => {
        createSettingsWindow();
      }
    },
    { type: 'separator' },
    {
      label: 'OBS再接続',
      click: async () => {
        disconnectOBS();
        await connectOBS();
      }
    },
    {
      label: 'MIDIデバイス再接続',
      click: () => {
        closeMIDI();
        initMIDI();
      }
    },
    { type: 'separator' },
    {
      label: 'ログイン時に起動',
      type: 'checkbox',
      checked: isAutoStart,
      click: () => {
        const newValue = !isAutoStart;
        app.setLoginItemSettings({
          openAtLogin: newValue
        });
        updateTrayMenu();
      }
    },
    { type: 'separator' },
    {
      label: '終了',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

/**
 * 設定ウィンドウ作成
 */
function createSettingsWindow(): void {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: 'Alive Studio MIDI Controller - Settings',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (app.isPackaged) {
    settingsWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  } else {
    settingsWindow.loadURL('http://localhost:3000');
    settingsWindow.webContents.openDevTools(); // 開発時はDevToolsを自動で開く
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

/**
 * IPC Handlers
 */
function setupIPCHandlers(): void {
  ipcMain.handle('get-config', () => {
    return config;
  });

  ipcMain.handle('save-config', async (event, newConfig: AppConfig) => {
    const success = configManager.save(newConfig);
    if (success) {
      config = newConfig;

      disconnectOBS();
      closeMIDI();

      await connectOBS();
      initMIDI();
    }
    return success;
  });

  ipcMain.handle('get-midi-devices', () => {
    try {
      const input = new Input();
      const portCount = input.getPortCount();
      const devices: string[] = [];

      for (let i = 0; i < portCount; i++) {
        devices.push(input.getPortName(i));
      }

      input.closePort();
      return devices;
    } catch (error) {
      console.error('Failed to get MIDI devices:', error);
      return [];
    }
  });

  ipcMain.handle('test-obs-connection', async (event, obsConfig: OBSConfig): Promise<TestOBSResult> => {
    try {
      const testClient = new OBSWebSocket();
      await testClient.connect(`ws://${obsConfig.host}:${obsConfig.port}`, obsConfig.password);
      await testClient.disconnect();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}

/**
 * アプリ初期化
 */
app.whenReady().then(() => {
  config = configManager.load();

  setupIPCHandlers();

  // Trayアイコンを作成
  createTray();

  // 開発時は直接設定ウィンドウを開く（本番ではトレイメニューから開く）
  if (process.env.NODE_ENV === 'development') {
    createSettingsWindow();
  }

  connectOBS();
  initMIDI();
});

app.on('before-quit', () => {
  disconnectOBS();
  closeMIDI();

  if (fadeTimer) {
    clearInterval(fadeTimer);
  }
});

app.on('window-all-closed', () => {
  // Keep app running in menu bar
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSettingsWindow();
  }
});
