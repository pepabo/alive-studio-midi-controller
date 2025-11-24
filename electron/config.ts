import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { AppConfig } from './types';

export class ConfigManager {
  private configDir: string;
  private configPath: string;
  private defaultConfig: AppConfig;

  constructor() {
    this.configDir = path.join(app.getPath('home'), '.alive-studio-midi-controller');
    this.configPath = path.join(this.configDir, 'config.json');
    this.defaultConfig = {
      obs: {
        host: 'localhost',
        port: 4455,
        password: '',
        bgmSourceName: '[Alive]BGM'
      },
      aliveStudio: {
        vendorName: 'obs-browser',
        requestType: 'emit_event'
      },
      midi: {
        device: '',
        bindings: {}
      }
    };
    this.ensureConfigDir();
  }

  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  load(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(data);

        // Migrate old config: add aliveStudio if missing
        if (!config.aliveStudio) {
          config.aliveStudio = this.defaultConfig.aliveStudio;
          this.save(config); // Auto-save migrated config
        }

        return config;
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    return this.defaultConfig;
  }

  save(config: AppConfig): boolean {
    try {
      this.ensureConfigDir();
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }

  getDefaultConfig(): AppConfig {
    return JSON.parse(JSON.stringify(this.defaultConfig));
  }
}
