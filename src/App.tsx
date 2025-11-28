import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Music, Settings, Wifi, CheckCircle2, XCircle, Trash2, Plus, BookOpen, Volume2, Loader2 } from 'lucide-react'
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

  // 音量バランス調整用の状態
  const [micSources, setMicSources] = useState<string[]>([])
  const [bgmSources, setBgmSources] = useState<string[]>([])
  const [micSource, setMicSource] = useState<string>('')
  const [bgmSource, setBgmSource] = useState<string>('')
  const [bgmActionParam, setBgmActionParam] = useState<string>('')  // BGM再生用Alive Studioパラメータ
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [measureResult, setMeasureResult] = useState<{
    mic?: { peakDb: number; rmsDb: number; inputPeakDb: number; faderDb: number; sampleCount: number };
    bgm?: { peakDb: number; rmsDb: number; inputPeakDb: number; faderDb: number; sampleCount: number };
    suggestedMicFaderDb?: number;  // 推奨フェーダー設定
    suggestedBgmFaderDb?: number;
  } | null>(null)
  const [volumeAdjustStatus, setVolumeAdjustStatus] = useState<string>('')

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

  // 音量バランス調整用の関数
  const loadAudioSources = async () => {
    try {
      const { micSources: mics, bgmSources: bgms } = await window.api.getAudioSources()
      setMicSources(mics)
      setBgmSources(bgms)
      // マイクが1つだけなら自動選択
      if (mics.length === 1 && !micSource) {
        setMicSource(mics[0])
      }
      // BGMソース名がOBS設定にあれば自動選択
      if (config?.obs.bgmSourceName && bgms.includes(config.obs.bgmSourceName)) {
        setBgmSource(config.obs.bgmSourceName)
      }
    } catch (error) {
      console.error('Failed to load audio sources:', error)
    }
  }

  const startMeasurement = async () => {
    if (!micSource || !bgmSource) {
      setVolumeAdjustStatus('マイクとBGMのソースを選択してください')
      setTimeout(() => setVolumeAdjustStatus(''), 3000)
      return
    }

    setIsMeasuring(true)
    setMeasureResult(null)
    setVolumeAdjustStatus('BGMを再生中...')

    // BGMアクションが設定されている場合、自動再生
    if (bgmActionParam) {
      try {
        await window.api.triggerAliveStudioAction(bgmActionParam)
      } catch (error) {
        console.error('Failed to trigger BGM:', error)
      }
    }

    setVolumeAdjustStatus('音量を測定中... (10秒間)')

    try {
      const result = await window.api.startVolumeMeasure([micSource, bgmSource], 10000)

      // 測定完了後、BGMを停止（同じアクションを再度送ると停止する）
      if (bgmActionParam) {
        try {
          await window.api.triggerAliveStudioAction(bgmActionParam)
        } catch (error) {
          console.error('Failed to stop BGM:', error)
        }
      }

      if (result.success && result.results) {
        const micResult = result.results[micSource]
        const bgmResult = result.results[bgmSource]

        // OBS公式の音量レベル基準:
        // - 緑: -50 〜 -20 dBFS
        // - 黄: -20 〜 -9 dBFS (PML = Permitted Maximum Level)
        // - 赤: -9 〜 -0.5 dBFS
        //
        // マイクのピーク目標: -9 dBFS (黄/赤境界、最大許容レベル)
        // BGMのピーク目標: -18 dBFS (マイクより約9dB低く、緑上部〜黄下部)
        const MIC_PEAK_TARGET = -9
        const BGM_PEAK_TARGET = -18

        // 調整計算: 新しいフェーダー値 = 現在のフェーダー + (目標ピーク - 測定ピーク)
        // 例: 現在-6dB、測定ピーク-15dB、目標-9dB
        //     → 新フェーダー = -6 + (-9 - (-15)) = -6 + 6 = 0dB
        let suggestedMicFaderDb: number | undefined
        let suggestedBgmFaderDb: number | undefined

        if (micResult && micResult.peakDb > -Infinity && micResult.sampleCount > 0) {
          const adjustment = MIC_PEAK_TARGET - micResult.peakDb
          suggestedMicFaderDb = micResult.faderDb + adjustment
        }

        if (bgmResult && bgmResult.peakDb > -Infinity && bgmResult.sampleCount > 0) {
          const adjustment = BGM_PEAK_TARGET - bgmResult.peakDb
          suggestedBgmFaderDb = bgmResult.faderDb + adjustment
        }

        setMeasureResult({
          mic: micResult,
          bgm: bgmResult,
          suggestedMicFaderDb,
          suggestedBgmFaderDb
        })

        if (!micResult?.sampleCount || !bgmResult?.sampleCount) {
          setVolumeAdjustStatus('測定完了（音声が検出されませんでした）')
        } else {
          setVolumeAdjustStatus('測定完了')
        }
      } else {
        setVolumeAdjustStatus(`測定失敗: ${result.error}`)
      }
    } catch (error) {
      setVolumeAdjustStatus(`エラー: ${error}`)
    } finally {
      setIsMeasuring(false)
      setTimeout(() => setVolumeAdjustStatus(''), 3000)
    }
  }

  const applyVolumeAdjustments = async () => {
    if (!measureResult) return

    setVolumeAdjustStatus('音量を調整中...')

    try {
      // マイクの調整
      if (measureResult.suggestedMicFaderDb !== undefined) {
        const micRes = await window.api.setSourceVolume(micSource, measureResult.suggestedMicFaderDb)
        if (!micRes.success) {
          setVolumeAdjustStatus(`マイク調整失敗: ${micRes.error}`)
          return
        }
      }

      // BGMの調整
      if (measureResult.suggestedBgmFaderDb !== undefined) {
        const bgmRes = await window.api.setSourceVolume(bgmSource, measureResult.suggestedBgmFaderDb)
        if (!bgmRes.success) {
          setVolumeAdjustStatus(`BGM調整失敗: ${bgmRes.error}`)
          return
        }
      }

      setVolumeAdjustStatus('音量調整完了!')
      // 結果は消さずに表示したままにする（確認用）
    } catch (error) {
      setVolumeAdjustStatus(`エラー: ${error}`)
    } finally {
      setTimeout(() => setVolumeAdjustStatus(''), 3000)
    }
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
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white border border-gray-200">
            <TabsTrigger value="bindings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              キー割り当て
            </TabsTrigger>
            <TabsTrigger value="obs" className="flex items-center gap-2" onClick={loadAudioSources}>
              <Wifi className="w-4 h-4" />
              OBS設定
            </TabsTrigger>
            <TabsTrigger value="midi" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              MIDIデバイス
            </TabsTrigger>
            <TabsTrigger value="volume" className="flex items-center gap-2" onClick={loadAudioSources}>
              <Volume2 className="w-4 h-4" />
              音量バランス
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              使い方
            </TabsTrigger>
          </TabsList>

          <TabsContent value="volume">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">音量バランス調整</CardTitle>
                <CardDescription className="text-gray-600">
                  マイクとBGMの音量バランスを自動調整します（OBS公式基準: マイク -9dBFS/黄赤境界, BGM -18dBFS/緑上部）
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">マイクソース</Label>
                    <Select value={micSource} onValueChange={setMicSource}>
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="マイクソースを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {micSources.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {micSources.length === 0 && (
                      <p className="text-xs text-gray-500">マイクソースが見つかりません</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">BGMソース</Label>
                    <Select value={bgmSource} onValueChange={setBgmSource}>
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="BGMソースを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {bgmSources.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {bgmSources.length === 0 && (
                      <p className="text-xs text-gray-500">BGMソースが見つかりません</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">BGM自動再生（キー割り当てから選択）</Label>
                  <Select value={bgmActionParam || '__none__'} onValueChange={(val) => setBgmActionParam(val === '__none__' ? '' : val)}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="測定開始時に再生するBGMを選択（任意）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">BGMを自動再生しない</SelectItem>
                      {Object.entries(config.midi.bindings)
                        .filter(([, binding]) =>
                          binding.type === 'alive-studio' &&
                          binding.parameter &&
                          binding.parameter.toLowerCase().includes('bgm')
                        )
                        .map(([note, binding]) => (
                          <SelectItem key={note} value={binding.parameter!}>
                            ノート {note} ({getMIDINoteName(parseInt(note))})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    キー割り当てで設定したAlive StudioのBGMアクションを使用します
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={startMeasurement}
                    disabled={isMeasuring || !micSource || !bgmSource}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isMeasuring ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        測定中...
                      </>
                    ) : (
                      '音量を測定'
                    )}
                  </Button>
                  <Button onClick={loadAudioSources} variant="outline" className="border-gray-300">
                    ソース一覧を再読込
                  </Button>
                </div>

                {!isMeasuring && !measureResult && (
                  <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {bgmActionParam ? (
                        <>測定ボタンを押すとBGMが自動再生されます。表示される文章を読み上げてください。</>
                      ) : (
                        <>測定前に<span className="font-semibold">BGMを再生</span>してください。
                        測定ボタンを押したら、表示される文章を読み上げてください。</>
                      )}
                    </p>
                  </div>
                )}

                {isMeasuring && (
                  <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg animate-pulse">
                    <p className="text-sm font-medium text-yellow-800 mb-2">以下の文章を読み上げてください:</p>
                    <p className="text-lg text-yellow-900 leading-relaxed">
                      「みなさんこんにちは！今日も配信に来てくれてありがとうございます。
                      ゆっくりしていってくださいね。コメントもお待ちしています！」
                    </p>
                  </div>
                )}

                {measureResult && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900">測定結果</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {measureResult.mic && measureResult.mic.sampleCount > 0 && (
                        <div className="space-y-2 p-3 bg-white rounded border">
                          <div className="text-sm font-medium text-gray-700">マイク ({micSource})</div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>ピーク:</span>
                              <span className={`font-mono ${measureResult.mic.peakDb > -9 ? 'text-red-600' : measureResult.mic.peakDb > -20 ? 'text-yellow-600' : 'text-green-600'}`}>
                                {measureResult.mic.peakDb.toFixed(1)} dBFS
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>RMS (体感):</span>
                              <span className="font-mono">{measureResult.mic.rmsDb.toFixed(1)} dBFS</span>
                            </div>
                            <div className="flex justify-between">
                              <span>現在フェーダー:</span>
                              <span className="font-mono">{measureResult.mic.faderDb.toFixed(1)} dB</span>
                            </div>
                            {measureResult.suggestedMicFaderDb !== undefined && (
                              <div className="mt-2 pt-2 border-t flex justify-between text-blue-700">
                                <span>推奨フェーダー:</span>
                                <span className="font-mono font-semibold">{measureResult.suggestedMicFaderDb.toFixed(1)} dB</span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">目標: -9 dBFS (黄/赤境界)</div>
                        </div>
                      )}
                      {measureResult.mic && measureResult.mic.sampleCount === 0 && (
                        <div className="p-3 bg-white rounded border">
                          <div className="text-sm font-medium text-gray-700">マイク ({micSource})</div>
                          <div className="text-sm text-gray-500 mt-2">音声が検出されませんでした</div>
                        </div>
                      )}
                      {measureResult.bgm && measureResult.bgm.sampleCount > 0 && (
                        <div className="space-y-2 p-3 bg-white rounded border">
                          <div className="text-sm font-medium text-gray-700">BGM ({bgmSource})</div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>ピーク:</span>
                              <span className={`font-mono ${measureResult.bgm.peakDb > -9 ? 'text-red-600' : measureResult.bgm.peakDb > -20 ? 'text-yellow-600' : 'text-green-600'}`}>
                                {measureResult.bgm.peakDb.toFixed(1)} dBFS
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>RMS (体感):</span>
                              <span className="font-mono">{measureResult.bgm.rmsDb.toFixed(1)} dBFS</span>
                            </div>
                            <div className="flex justify-between">
                              <span>現在フェーダー:</span>
                              <span className="font-mono">{measureResult.bgm.faderDb.toFixed(1)} dB</span>
                            </div>
                            {measureResult.suggestedBgmFaderDb !== undefined && (
                              <div className="mt-2 pt-2 border-t flex justify-between text-blue-700">
                                <span>推奨フェーダー:</span>
                                <span className="font-mono font-semibold">{measureResult.suggestedBgmFaderDb.toFixed(1)} dB</span>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">目標: -18 dBFS (緑上部)</div>
                        </div>
                      )}
                      {measureResult.bgm && measureResult.bgm.sampleCount === 0 && (
                        <div className="p-3 bg-white rounded border">
                          <div className="text-sm font-medium text-gray-700">BGM ({bgmSource})</div>
                          <div className="text-sm text-gray-500 mt-2">音声が検出されませんでした</div>
                        </div>
                      )}
                    </div>
                    {(measureResult.suggestedMicFaderDb !== undefined || measureResult.suggestedBgmFaderDb !== undefined) && (
                      <Button
                        onClick={applyVolumeAdjustments}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        推奨値を適用
                      </Button>
                    )}
                  </div>
                )}

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">使い方</h4>
                  <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                    <li>OBSに接続していることを確認</li>
                    <li>マイクソースとBGMソースを選択</li>
                    <li>マイクに向かって話しながら「音量を測定」をクリック</li>
                    <li>5秒間の音量を測定し、最適な調整値を計算</li>
                    <li>「推奨値を適用」で自動調整</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                  <Select value={config.obs.bgmSourceName || ''} onValueChange={(val) => updateOBS('bgmSourceName', val)}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="BGMソースを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {bgmSources.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

        {/* トースト通知 */}
        {saveResult && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{saveResult}</span>
            </div>
          </div>
        )}
        {volumeAdjustStatus && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
              volumeAdjustStatus.includes('完了') ? 'bg-green-600 text-white' :
              volumeAdjustStatus.includes('失敗') || volumeAdjustStatus.includes('エラー') ? 'bg-red-600 text-white' :
              'bg-blue-600 text-white'
            }`}>
              {volumeAdjustStatus.includes('完了') ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : volumeAdjustStatus.includes('失敗') || volumeAdjustStatus.includes('エラー') ? (
                <XCircle className="w-5 h-5" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
              <span className="font-medium">{volumeAdjustStatus}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
