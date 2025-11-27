import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Music, Settings, Wifi, CheckCircle2, XCircle, Trash2, Plus, BookOpen } from 'lucide-react'
import type { AppConfig, MIDIBinding } from './types'

function getMIDINoteName(noteNumber: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octave = Math.floor(noteNumber / 12) - 1
  const noteName = noteNames[noteNumber % 12]
  return `${noteName}${octave}`
}

interface BindingRowProps {
  note: string
  binding: MIDIBinding
  updateBinding: (note: string, binding: MIDIBinding) => void
  deleteBinding: (note: string) => void
  changeBindingNote: (oldNote: string, newNote: string, binding: MIDIBinding) => void
  isHighlighted?: boolean
  isWaitingForMidi?: boolean
  onStartMidiCapture: (note: string) => void
  onCancelMidiCapture: () => void
}

function BindingRow({ note, binding, updateBinding, deleteBinding, changeBindingNote, isHighlighted, isWaitingForMidi, onStartMidiCapture, onCancelMidiCapture }: BindingRowProps) {
  const [displayNote, setDisplayNote] = useState(note)

  // noteプロパティが変更されたら、displayNoteを更新
  useEffect(() => {
    setDisplayNote(note)
  }, [note])

  return (
    <div className={`grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 p-4 rounded-lg border transition-all duration-500 ${isHighlighted ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300' : isWaitingForMidi ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-300' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-2">
        {isWaitingForMidi ? (
          <button
            onClick={onCancelMidiCapture}
            className="h-10 w-16 rounded-md border border-yellow-400 bg-yellow-100 px-2 py-2 text-xs text-yellow-700 text-center animate-pulse"
          >
            待機中...
          </button>
        ) : (
          <button
            onClick={() => onStartMidiCapture(note)}
            className="h-10 w-16 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 text-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="クリックしてMIDIキーを押すと設定できます"
          >
            {note}
          </button>
        )}
        <span className="text-sm text-gray-600 font-medium w-8">
          {getMIDINoteName(parseInt(displayNote))}
        </span>
      </div>

      <Select
        value={binding.type || 'alive-studio'}
        onValueChange={(val: 'obs' | 'alive-studio') => updateBinding(note, { ...binding, type: val })}
      >
        <SelectTrigger className="h-10 w-36 border-gray-300">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="obs">OBS</SelectItem>
          <SelectItem value="alive-studio">Alive Studio</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        {binding.type === 'obs' && (
          <>
            <Select
              value={binding.action || ''}
              onValueChange={(val) => updateBinding(note, { ...binding, action: val })}
            >
              <SelectTrigger className="h-10 w-40 border-gray-300">
                <SelectValue placeholder="アクション" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toggleRecord">録画切り替え</SelectItem>
                <SelectItem value="startRecord">録画開始</SelectItem>
                <SelectItem value="stopRecord">録画停止</SelectItem>
                <SelectItem value="toggleStream">配信切り替え</SelectItem>
                <SelectItem value="startStream">配信開始</SelectItem>
                <SelectItem value="stopStream">配信停止</SelectItem>
                <SelectItem value="setScene">シーン切り替え</SelectItem>
                <SelectItem value="saveReplay">リプレイ保存</SelectItem>
                <SelectItem value="setVolume">音量設定</SelectItem>
                <SelectItem value="fadeIn">フェードイン</SelectItem>
                <SelectItem value="fadeOut">フェードアウト</SelectItem>
              </SelectContent>
            </Select>

            {binding.action === 'setScene' && (
              <Input
                type="text"
                value={binding.parameter || ''}
                onChange={(e) => updateBinding(note, { ...binding, parameter: e.target.value })}
                className="h-10 border-gray-300"
                placeholder="シーン名を入力"
              />
            )}

            {binding.action === 'setVolume' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 whitespace-nowrap">音量</span>
                  <Input
                    type="number"
                    value={binding.value ?? 0}
                    onChange={(e) => updateBinding(note, { ...binding, value: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                    className="h-10 w-20 border-gray-300"
                    placeholder="-15"
                  />
                  <span className="text-xs text-gray-500">dB</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 whitespace-nowrap">秒数</span>
                  <Input
                    type="number"
                    value={binding.seconds ?? 0}
                    onChange={(e) => updateBinding(note, { ...binding, seconds: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                    className="h-10 w-16 border-gray-300"
                    placeholder="0"
                  />
                  <span className="text-xs text-gray-500">秒</span>
                </div>
              </>
            )}

            {(binding.action === 'fadeIn' || binding.action === 'fadeOut') && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 whitespace-nowrap">秒数</span>
                  <Input
                    type="number"
                    value={binding.seconds ?? 5}
                    onChange={(e) => updateBinding(note, { ...binding, seconds: e.target.value === '' ? 5 : parseFloat(e.target.value) })}
                    className="h-10 w-16 border-gray-300"
                    placeholder="5"
                  />
                  <span className="text-xs text-gray-500">秒</span>
                </div>

                {binding.action === 'fadeIn' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 whitespace-nowrap">目標</span>
                    <Input
                      type="number"
                      value={binding.value ?? -15}
                      onChange={(e) => updateBinding(note, { ...binding, value: e.target.value === '' ? -15 : parseFloat(e.target.value) })}
                      className="h-10 w-20 border-gray-300"
                      placeholder="-15"
                    />
                    <span className="text-xs text-gray-500">dB</span>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {binding.type === 'alive-studio' && (
          <Input
            value={binding.parameter || ''}
            onChange={(e) => updateBinding(note, { ...binding, parameter: e.target.value })}
            className="h-10 border-gray-300 font-mono text-xs"
            placeholder="StreamDeck設定パラメータを貼り付け (例: key=alive-studio-bgm&value=...)"
          />
        )}
      </div>

      <Button
        variant="destructive"
        size="icon"
        onClick={() => deleteBinding(note)}
        className="flex-shrink-0 h-10 w-10"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

interface MidiMessage {
  note: number
  velocity: number
  timestamp: number
}

// MIDI入力待ち状態の型
type MidiCaptureState =
  | { type: 'none' }
  | { type: 'new' }  // 新規追加待ち
  | { type: 'edit', originalNote: string, binding: MIDIBinding }  // 既存編集待ち

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [midiDevices, setMidiDevices] = useState<string[]>([])
  const [obsTestResult, setObsTestResult] = useState<string>('')
  const [saveResult, setSaveResult] = useState<string>('')
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const [lastMidiMessage, setLastMidiMessage] = useState<MidiMessage | null>(null)
  const [newlyAddedNote, setNewlyAddedNote] = useState<string | null>(null)
  const [midiCaptureState, setMidiCaptureState] = useState<MidiCaptureState>({ type: 'none' })

  // useRefで最新の状態を参照（MIDIリスナーのclosure問題を回避）
  const configRef = useRef(config)
  const midiCaptureStateRef = useRef(midiCaptureState)
  useEffect(() => { configRef.current = config }, [config])
  useEffect(() => { midiCaptureStateRef.current = midiCaptureState }, [midiCaptureState])

  useEffect(() => {
    loadConfig()
    loadMidiDevices()
  }, [])

  // MIDIメッセージのリスナー（一度だけ登録し、refで最新の状態を参照）
  useEffect(() => {
    window.api.onMidiMessage((note, velocity) => {
      setLastMidiMessage({ note, velocity, timestamp: Date.now() })

      const currentConfig = configRef.current
      const currentCaptureState = midiCaptureStateRef.current

      // MIDI入力待ち状態の場合、ノート番号を設定
      if (currentCaptureState.type !== 'none' && currentConfig) {
        const noteStr = note.toString()
        // 既に使われているノート番号の場合はスキップ（自分自身以外）
        if (currentCaptureState.type === 'new') {
          if (currentConfig.midi.bindings[noteStr]) {
            // 既存のバインディングをハイライトして知らせる
            setNewlyAddedNote(noteStr)
            setTimeout(() => setNewlyAddedNote(null), 1500)
            return
          }
          // 新規追加
          setNewlyAddedNote(noteStr)
          setTimeout(() => setNewlyAddedNote(null), 3000)
          setConfig({
            ...currentConfig,
            midi: {
              ...currentConfig.midi,
              bindings: {
                ...currentConfig.midi.bindings,
                [noteStr]: { type: 'alive-studio', parameter: '' }
              }
            }
          })
        } else if (currentCaptureState.type === 'edit') {
          const { originalNote, binding } = currentCaptureState
          if (noteStr !== originalNote && currentConfig.midi.bindings[noteStr]) {
            // 既存のバインディングをハイライトして知らせる
            setNewlyAddedNote(noteStr)
            setTimeout(() => setNewlyAddedNote(null), 1500)
            return
          }
          if (noteStr !== originalNote) {
            // ノート番号を変更
            const newBindings = { ...currentConfig.midi.bindings }
            delete newBindings[originalNote]
            newBindings[noteStr] = binding
            setNewlyAddedNote(noteStr)
            setTimeout(() => setNewlyAddedNote(null), 3000)
            setConfig({
              ...currentConfig,
              midi: {
                ...currentConfig.midi,
                bindings: newBindings
              }
            })
          }
        }
        setMidiCaptureState({ type: 'none' })
      }
    })

    return () => {
      window.api.removeMidiMessageListener()
    }
  }, [])

  // 自動保存
  useEffect(() => {
    if (!config) return

    // 既存のタイマーをクリア
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    // 1秒後に自動保存
    const timer = setTimeout(async () => {
      const success = await window.api.saveConfig(config)
      if (success) {
        setSaveResult('保存しました')
        setTimeout(() => setSaveResult(''), 2000)
      }
    }, 1000)

    setAutoSaveTimer(timer)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [config])

  const loadConfig = async () => {
    try {
      const cfg = await window.api.getConfig()
      setConfig(cfg)
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }

  const loadMidiDevices = async () => {
    const devices = await window.api.getMidiDevices()
    setMidiDevices(devices)
  }

  const testOBSConnection = async () => {
    if (!config) return
    setObsTestResult('Testing...')
    const result = await window.api.testOBSConnection(config.obs)
    setObsTestResult(result.success ? 'Success!' : `Failed: ${result.error}`)
    setTimeout(() => setObsTestResult(''), 3000)
  }

  const saveConfig = async () => {
    if (!config) return
    setSaveResult('Saving...')
    const success = await window.api.saveConfig(config)
    setSaveResult(success ? 'Saved!' : 'Failed to save')
    setTimeout(() => setSaveResult(''), 3000)
  }

  const updateOBS = (key: string, value: any) => {
    if (!config) return
    setConfig({
      ...config,
      obs: { ...config.obs, [key]: value }
    })
  }

  const updateAliveStudio = (key: string, value: any) => {
    if (!config) return
    setConfig({
      ...config,
      aliveStudio: { ...config.aliveStudio, [key]: value }
    })
  }

  const updateMIDI = (key: string, value: any) => {
    if (!config) return
    setConfig({
      ...config,
      midi: { ...config.midi, [key]: value }
    })
  }

  const updateBinding = (note: string, binding: MIDIBinding) => {
    if (!config) return
    setConfig({
      ...config,
      midi: {
        ...config.midi,
        bindings: {
          ...config.midi.bindings,
          [note]: binding
        }
      }
    })
  }

  const deleteBinding = (note: string) => {
    if (!config) return
    const newBindings = { ...config.midi.bindings }
    delete newBindings[note]
    setConfig({
      ...config,
      midi: {
        ...config.midi,
        bindings: newBindings
      }
    })
  }

  const changeBindingNote = (oldNote: string, newNote: string, binding: MIDIBinding) => {
    if (!config) return
    if (oldNote === newNote) return
    // 新しいノート番号が既に使われている場合は変更しない
    if (config.midi.bindings[newNote]) return

    const newBindings = { ...config.midi.bindings }
    delete newBindings[oldNote]
    newBindings[newNote] = binding

    // 変更後のノートをハイライト
    setNewlyAddedNote(newNote)
    setTimeout(() => setNewlyAddedNote(null), 3000)

    setConfig({
      ...config,
      midi: {
        ...config.midi,
        bindings: newBindings
      }
    })
  }

  const addBinding = () => {
    if (!config) return
    // MIDI入力待ち状態にする
    setMidiCaptureState({ type: 'new' })
  }

  const startMidiCapture = (note: string) => {
    if (!config) return
    const binding = config.midi.bindings[note]
    if (binding) {
      setMidiCaptureState({ type: 'edit', originalNote: note, binding })
    }
  }

  const cancelMidiCapture = () => {
    setMidiCaptureState({ type: 'none' })
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8 max-w-6xl">
        <div className="mb-8 flex items-center gap-4">
          <img
            src="./alive-studio-logo.svg"
            alt="Alive Studio"
            className="h-16 w-auto"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              MIDI Controller
            </h1>
            <p className="text-gray-600">MIDIコントローラーでAlive StudioとOBSを操作</p>
          </div>
        </div>

        <Tabs defaultValue="bindings" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white border border-gray-200">
            <TabsTrigger value="bindings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              キー割り当て
            </TabsTrigger>
            <TabsTrigger value="obs" className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              OBS設定
            </TabsTrigger>
            <TabsTrigger value="midi" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              MIDIデバイス
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              使い方
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usage">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">使い方</CardTitle>
                <CardDescription className="text-gray-600">
                  このアプリケーションの使い方を説明します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">基本的な使い方</h3>
                  <ol className="space-y-2 list-decimal list-inside text-gray-700">
                    <li>「MIDIデバイス」タブでMIDIコントローラーを選択</li>
                    <li>「OBS設定」タブでOBS WebSocketの接続情報を入力</li>
                    <li>「キー割り当て」タブでMIDIノートにアクションを設定</li>
                    <li>設定は自動的に保存されます</li>
                  </ol>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">OBSアクションの設定</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <strong className="text-blue-700">録画切り替え / 録画開始 / 録画停止</strong>
                      <p className="text-gray-600 ml-4">OBSの録画を制御します</p>
                    </div>
                    <div>
                      <strong className="text-blue-700">配信切り替え / 配信開始 / 配信停止</strong>
                      <p className="text-gray-600 ml-4">OBSの配信を制御します</p>
                    </div>
                    <div>
                      <strong className="text-blue-700">シーン切り替え</strong>
                      <p className="text-gray-600 ml-4">指定したシーン名のシーンに切り替えます</p>
                    </div>
                    <div>
                      <strong className="text-blue-700">リプレイ保存</strong>
                      <p className="text-gray-600 ml-4">リプレイバッファの内容を保存します（OBSでリプレイバッファが有効になっている必要があります）</p>
                    </div>
                    <div>
                      <strong className="text-blue-700">音量設定</strong>
                      <p className="text-gray-600 ml-4">BGMソースの音量を指定したdB値に設定します（例: -15dB）</p>
                      <p className="text-gray-600 ml-4">秒数を0にすると即座にセット、0より大きい値で指定秒数かけてフェード</p>
                    </div>
                    <div>
                      <strong className="text-blue-700">フェードイン / フェードアウト</strong>
                      <p className="text-gray-600 ml-4">BGMソースの音量を指定秒数かけて徐々に変化させます</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Alive Studio素材の追加方法</h3>
                  <ol className="space-y-2 list-decimal list-inside text-gray-700">
                    <li>OBSでAlive Studio素材（BGM、背景など）にカーソルを合わせる</li>
                    <li>3点アイコン → 「StreamDeck設定用 パラメータ」をクリック</li>
                    <li>「コピー」ボタンでパラメータ文字列をコピー</li>
                    <li>「キー割り当て」タブで「割り当て追加」をクリック</li>
                    <li>タイプを「Alive Studio」に変更</li>
                    <li>コピーしたパラメータを貼り付け</li>
                  </ol>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-gray-600">
                      <strong className="text-blue-700">例:</strong> <code className="bg-white px-2 py-1 rounded text-xs">key=alive-studio-bgm&value=468150d9-4d37-4f85-9e13-81a86d9b0911</code>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="obs">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">OBS WebSocket設定</CardTitle>
                <CardDescription className="text-gray-600">
                  OBS Studioへの接続を設定
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="host" className="text-gray-700">ホスト</Label>
                    <Input
                      id="host"
                      value={config.obs.host}
                      onChange={(e) => updateOBS('host', e.target.value)}
                      className="border-gray-300"
                      placeholder="localhost"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port" className="text-gray-700">ポート</Label>
                    <Input
                      id="port"
                      type="number"
                      value={config.obs.port}
                      onChange={(e) => updateOBS('port', parseInt(e.target.value))}
                      className="border-gray-300"
                      placeholder="4455"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    value={config.obs.password}
                    onChange={(e) => updateOBS('password', e.target.value)}
                    className="border-gray-300"
                    placeholder="OBS WebSocketのパスワード"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bgm" className="text-gray-700">BGMソース名</Label>
                  <Input
                    id="bgm"
                    value={config.obs.bgmSourceName}
                    onChange={(e) => updateOBS('bgmSourceName', e.target.value)}
                    className="border-gray-300"
                    placeholder="[Alive]BGM"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={testOBSConnection} className="bg-blue-600 hover:bg-blue-700 text-white">
                    接続テスト
                  </Button>
                  {obsTestResult && (
                    <div className="flex items-center gap-2">
                      {obsTestResult.includes('Success') ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <span className="text-green-400">{obsTestResult}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-400" />
                          <span className="text-red-400">{obsTestResult}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="midi">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">MIDIデバイス</CardTitle>
                <CardDescription className="text-gray-600">
                  MIDIコントローラーを選択
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="device" className="text-gray-700">MIDIデバイス</Label>
                  <Select value={config.midi.device || ''} onValueChange={(val) => updateMIDI('device', val)}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="MIDIデバイスを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {midiDevices.map((device) => (
                        <SelectItem key={device} value={device}>
                          {device}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={loadMidiDevices} variant="outline" className="border-gray-300">
                  デバイスを再読み込み
                </Button>

                {/* MIDIモニター */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Label className="text-gray-700">MIDIモニター</Label>
                  <div className="mt-2 p-4 bg-gray-100 rounded-lg font-mono text-center">
                    {lastMidiMessage ? (
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-gray-900">
                          ノート: {lastMidiMessage.note} ({getMIDINoteName(lastMidiMessage.note)})
                        </div>
                        <div className="text-sm text-gray-600">
                          ベロシティ: {lastMidiMessage.velocity}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        MIDIキーを押すと表示されます
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bindings">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">キー割り当て</CardTitle>
                <CardDescription className="text-gray-600">
                  MIDIノートにアクションを紐づけます
                </CardDescription>
                {/* キー割り当て用MIDIモニター */}
                {lastMidiMessage && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                    最後に押されたノート: <span className="font-bold">{lastMidiMessage.note}</span> ({getMIDINoteName(lastMidiMessage.note)})
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {Object.entries(config.midi.bindings)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([note, binding]) => (
                    <BindingRow
                      key={note}
                      note={note}
                      binding={binding}
                      updateBinding={updateBinding}
                      deleteBinding={deleteBinding}
                      changeBindingNote={changeBindingNote}
                      isHighlighted={note === newlyAddedNote}
                      isWaitingForMidi={midiCaptureState.type === 'edit' && midiCaptureState.originalNote === note}
                      onStartMidiCapture={startMidiCapture}
                      onCancelMidiCapture={cancelMidiCapture}
                    />
                  ))}
                </div>
                {midiCaptureState.type === 'new' ? (
                  <Button
                    onClick={cancelMidiCapture}
                    variant="outline"
                    className="w-full border-yellow-400 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 animate-pulse"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    MIDIキーを押してください（クリックでキャンセル）
                  </Button>
                ) : (
                  <Button onClick={addBinding} variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
                    <Plus className="w-4 h-4 mr-2" />
                    割り当て追加
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {saveResult && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{saveResult}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
