import { useState, useRef, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

export interface FFmpegProgress {
  progress: number
  time: number
}

export function useFFmpeg() {
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<FFmpegProgress>({ progress: 0, time: 0 })
  const ffmpegRef = useRef<FFmpeg | null>(null)

  const load = useCallback(async () => {
    if (loaded || loading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const ffmpeg = new FFmpeg()
      
      ffmpeg.on('progress', ({ progress, time }) => {
        setProgress({ progress: Math.round(progress * 100), time })
      })

      ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg log:', message)
      })

      // 使用本地 public 目录下的 ffmpeg-core 文件
      const baseURL = '/ffmpeg-core/esm'
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript')
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')

      await ffmpeg.load({
        coreURL,
        wasmURL,
      })

      ffmpegRef.current = ffmpeg
      setLoaded(true)
      console.log('FFmpeg loaded successfully from local files')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load FFmpeg'
      console.error('Failed to load FFmpeg:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [loaded, loading])

  const runFFmpeg = useCallback(async (args: string[]) => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded')
    }
    
    setProgress({ progress: 0, time: 0 })
    const result = await ffmpegRef.current.exec(args)
    return result
  }, [])

  const writeFile = useCallback(async (name: string, data: Uint8Array) => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded')
    }
    await ffmpegRef.current.writeFile(name, data)
  }, [])

  const readFile = useCallback(async (name: string) => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded')
    }
    const data = await ffmpegRef.current.readFile(name)
    return data as Uint8Array
  }, [])

  const deleteFile = useCallback(async (name: string) => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded')
    }
    await ffmpegRef.current.deleteFile(name)
  }, [])

  return {
    loaded,
    loading,
    error,
    progress,
    load,
    runFFmpeg,
    writeFile,
    readFile,
    deleteFile,
  }
}
