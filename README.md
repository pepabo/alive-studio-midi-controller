# Alive Studio MIDI Controller

MIDIコントローラーで[Alive Studio](https://alive-project.com/studio)とOBS Studioを操作するElectronメニューバーアプリ。

![Alive Studio MIDI Controller](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)

## 機能

- 🎹 **MIDI制御**: Launchkey Mini MK4 25など、任意のMIDIコントローラーに対応
- 🎨 **Alive Studio統合**: Alive Studio素材（BGM、背景、効果音など）を制御
- 🎥 **OBS統合**: obs-websocket 5.x完全対応（認証サポート）
- 🔊 **音声制御**: BGM音量の設定、フェードイン/アウトエフェクト（即座または指定秒数でフェード）
- 📹 **録画制御**: 開始/停止/切り替え
- 📡 **配信制御**: 開始/停止/切り替え
- 🎬 **シーン制御**: OBSシーン間の切り替え
- ⏮️ **リプレイバッファ**: コマンドでリプレイバッファを保存
- 🍎 **メニューバーアプリ**: macOSメニューバーで動作（Dockアイコンなし）
- 🚀 **自動起動**: システム起動時に自動で起動
- 💾 **自動保存**: 設定変更を自動的に保存

## インストール

### エンドユーザー向け

[Releasesページ](https://github.com/pepabo/alive-studio-midi-controller/releases)から最新版をダウンロードしてインストールしてください。

#### macOS
1. `Alive Studio MIDI Controller.dmg` をダウンロード
2. DMGファイルを開いてアプリケーションフォルダにドラッグ＆ドロップ
3. アプリケーションを起動（メニューバーにアイコンが表示されます）

#### Windows
1. `Alive Studio MIDI Controller Setup.exe` をダウンロード
2. インストーラーを実行してインストール
3. アプリケーションを起動（システムトレイにアイコンが表示されます）

### 必要要件

- OBS Studio
- MIDIコントローラー（例: Launchkey Mini MK4 25）

## 開発者向けセットアップ

### 必要要件

- Node.js 20以上とnpm
- OBS Studio
- MIDIコントローラー（例: Launchkey Mini MK4 25）

### インストール

```bash
# 依存関係をインストール
npm install

# 開発モード（ホットリロード）
npm run dev

# macOSアプリをビルド
npm run build:mac

# Windowsアプリをビルド
npm run build:win

# 両プラットフォームをビルド
npm run build
```

## 開発

### 開発モード

```bash
npm run dev
```

レンダラー（React UI）はホットリロードをサポートしています。

## 本番ビルド

### macOS

```bash
npm run build:mac
```

**出力:**
- `release/Alive Studio MIDI Controller.dmg` - インストーラー
- `release/Alive Studio MIDI Controller-mac.zip` - ポータブル版

**特徴:**
- メニューバーで動作（Dockアイコンなし）
- ログイン時の自動起動設定可能
- すべての依存関係をバンドル

### Windows

```bash
npm run build:win
```

**出力:**
- `release/Alive Studio MIDI Controller Setup.exe` - インストーラー (NSIS)
- `release/Alive Studio MIDI Controller Portable.exe` - ポータブル版

**特徴:**
- システムトレイで動作
- インストール先の選択可能
- デスクトップショートカット作成
- スタートメニュー登録

### すべてのプラットフォーム

```bash
npm run build
```

macOS と Windows 両方をビルドします。

### ビルドコマンド詳細

```bash
# コンパイルのみ（TypeScript + Vite）
npm run compile

# レンダラープロセスのコンパイル
npm run compile:renderer

# メインプロセスのコンパイル
npm run compile:main
```

## リリース

### リリース手順（macOS）

1. **バージョンを更新**
   ```bash
   npm version patch  # 1.0.0 → 1.0.1
   npm version minor  # 1.0.0 → 1.1.0
   npm version major  # 1.0.0 → 2.0.0
   ```

2. **変更をコミット**
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: Bump version to vX.X.X"
   git push origin main
   ```

3. **リリースを作成**
   ```bash
   npm run release
   ```

   このコマンドは以下を実行します：
   - macOSアプリをビルド
   - GitHub Releaseを作成
   - DMGとZIPファイルをアップロード

4. **リリース確認**
   - リリースページ: https://github.com/pepabo/alive-studio-midi-controller/releases

## トラブルシューティング

### MIDIデバイスが表示されない

```bash
# MIDIデバイスが接続されているか確認
npm run dev
# コンソールで「MIDI device not found」エラーを確認
```

### OBS接続に失敗

- OBS WebSocketが有効になっているか確認
- 設定でホスト/ポート/パスワードを確認
- 「接続テスト」ボタンを使用
- OBS WebSocketのバージョンを確認（5.x必須）

### アプリが起動しない

```bash
# Electronログを確認
npm run dev
# ターミナルでエラーを確認
```

## ライセンス

MIT

## 作者

[Kentaro Kuribayashi](https://kentarokuribayashi.com)
