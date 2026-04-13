import { useState, useCallback } from 'react'
import { useFFmpeg } from './useFFmpeg'

export interface VideoFile {
  file: File
  id: string
  name: string
  size: number
  duration?: number
  thumbnail?: string
}

export interface ProcessingTask {
  id: string
  type: 'trim' | 'merge' | 'convert' | 'extract'
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  inputFiles: string[]
  outputFile?: string
  error?: string
  options: Record<string, unknown>
}

// 分块读取大文件，避免内存问题
async function readFileInChunks(file: File, chunkSize: number = 64 * 1024 * 1024): Promise<Uint8Array> {
  // 如果文件小于 100MB，直接读取
  if (file.size < 100 * 1024 * 1024) {
    return new Uint8Array(await file.arrayBuffer())
  }
  
  // 大文件分块读取
  const chunks: Uint8Array[] = []
  let offset = 0
  
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize)
    const arrayBuffer = await chunk.arrayBuffer()
    chunks.push(new Uint8Array(arrayBuffer))
    offset += chunkSize
  }
  
  // 合并所有块
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let position = 0
  
  for (const chunk of chunks) {
    result.set(chunk, position)
    position += chunk.length
  }
  
  return result
}

export function useVideoProcessor() {
  const { loaded, loading, error: ffmpegError, progress: ffmpegProgress, load, runFFmpeg, writeFile, readFile, deleteFile } = useFFmpeg()
  const [tasks, setTasks] = useState<ProcessingTask[]>([])

  const addTask = useCallback((task: Omit<ProcessingTask, 'id' | 'status' | 'progress'>) => {
    const newTask: ProcessingTask = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0,
    }
    setTasks(prev => [...prev, newTask])
    return newTask.id
  }, [])

  const updateTask = useCallback((taskId: string, updates: Partial<ProcessingTask>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ))
  }, [])

  const trimVideo = useCallback(async (inputFile: VideoFile, startTime: number, endTime: number) => {
    if (!loaded) await load()

    const taskId = addTask({
      type: 'trim',
      inputFiles: [inputFile.name],
      options: { startTime, endTime },
    })

    try {
      updateTask(taskId, { status: 'processing' })

      const inputData = await readFileInChunks(inputFile.file)
      await writeFile(inputFile.name, inputData)

      const outputName = `trimmed_${inputFile.name}`
      await runFFmpeg([
        '-i', inputFile.name,
        '-ss', startTime.toString(),
        '-t', (endTime - startTime).toString(),
        '-c', 'copy',
        outputName
      ])

      const outputData = await readFile(outputName)
      const blob = new Blob([outputData.buffer as ArrayBuffer], { type: inputFile.file.type })
      const url = URL.createObjectURL(blob)

      await deleteFile(inputFile.name)
      await deleteFile(outputName)

      updateTask(taskId, { 
        status: 'completed', 
        progress: 100,
        outputFile: url 
      })

      return url
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      updateTask(taskId, { status: 'error', error: errorMessage })
      throw error
    }
  }, [loaded, load, addTask, updateTask, runFFmpeg, writeFile, readFile, deleteFile])

  const convertVideo = useCallback(async (inputFile: VideoFile, outputFormat: string, quality: string = 'high') => {
    if (!loaded) await load()

    const taskId = addTask({
      type: 'convert',
      inputFiles: [inputFile.name],
      options: { outputFormat, quality },
    })

    try {
      updateTask(taskId, { status: 'processing' })

      // 使用分块读取避免内存问题
      const inputData = await readFileInChunks(inputFile.file)
      await writeFile(inputFile.name, inputData)

      const baseName = inputFile.name.substring(0, inputFile.name.lastIndexOf('.'))
      const outputName = `${baseName}.${outputFormat}`

      // 根据质量和格式设置编码参数
      let crf = '23'
      let preset = 'medium'
      
      if (quality === 'low') {
        crf = '28'
        preset = 'superfast'
      } else if (quality === 'high') {
        crf = '18'
        preset = 'slow'
      }

      // 构建 FFmpeg 参数
      const args: string[] = ['-i', inputFile.name]
      
      // 对于大文件，限制内存使用
      if (inputFile.size > 100 * 1024 * 1024) {
        args.push('-threads', '1')
      }
      
      // 视频编码设置
      if (outputFormat === 'mp4') {
        args.push(
          '-c:v', 'libx264',
          '-preset', preset,
          '-crf', crf,
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart'
        )
      } else if (outputFormat === 'webm') {
        args.push(
          '-c:v', 'libvpx-vp9',
          '-crf', crf,
          '-b:v', '0',
          '-deadline', quality === 'high' ? 'good' : 'realtime'
        )
      } else {
        args.push('-c:v', 'copy')
      }
      
      // 音频编码
      if (outputFormat === 'webm') {
        args.push('-c:a', 'libopus', '-b:a', '128k')
      } else {
        args.push('-c:a', 'aac', '-b:a', '128k')
      }
      
      // 输出文件
      args.push(outputName)

      await runFFmpeg(args)

      const outputData = await readFile(outputName)
      const mimeType = `video/${outputFormat === 'mp4' ? 'mp4' : outputFormat === 'webm' ? 'webm' : 'x-matroska'}`
      const blob = new Blob([outputData.buffer as ArrayBuffer], { type: mimeType })
      const url = URL.createObjectURL(blob)

      await deleteFile(inputFile.name)
      await deleteFile(outputName)

      updateTask(taskId, { 
        status: 'completed', 
        progress: 100,
        outputFile: url 
      })

      return url
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      updateTask(taskId, { status: 'error', error: errorMessage })
      throw error
    }
  }, [loaded, load, addTask, updateTask, runFFmpeg, writeFile, readFile, deleteFile])

  const mergeVideos = useCallback(async (inputFiles: VideoFile[]) => {
    if (!loaded) await load()

    const taskId = addTask({
      type: 'merge',
      inputFiles: inputFiles.map(f => f.name),
      options: {},
    })

    try {
      updateTask(taskId, { status: 'processing' })

      const listContent = inputFiles.map(f => `file '${f.name}'`).join('\n')
      const listName = 'input_list.txt'
      
      await writeFile(listName, new TextEncoder().encode(listContent))

      for (const videoFile of inputFiles) {
        const inputData = await readFileInChunks(videoFile.file)
        await writeFile(videoFile.name, inputData)
      }

      const outputName = `merged_${Date.now()}.mp4`
      await runFFmpeg([
        '-f', 'concat',
        '-safe', '0',
        '-i', listName,
        '-c', 'copy',
        outputName
      ])

      const outputData = await readFile(outputName)
      const blob = new Blob([outputData.buffer as ArrayBuffer], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)

      await deleteFile(listName)
      for (const videoFile of inputFiles) {
        await deleteFile(videoFile.name)
      }
      await deleteFile(outputName)

      updateTask(taskId, { 
        status: 'completed', 
        progress: 100,
        outputFile: url 
      })

      return url
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      updateTask(taskId, { status: 'error', error: errorMessage })
      throw error
    }
  }, [loaded, load, addTask, updateTask, runFFmpeg, writeFile, readFile, deleteFile])

  const extractAudio = useCallback(async (inputFile: VideoFile, audioFormat: string = 'mp3') => {
    if (!loaded) await load()

    const taskId = addTask({
      type: 'extract',
      inputFiles: [inputFile.name],
      options: { audioFormat },
    })

    try {
      updateTask(taskId, { status: 'processing' })

      const inputData = await readFileInChunks(inputFile.file)
      await writeFile(inputFile.name, inputData)

      const baseName = inputFile.name.substring(0, inputFile.name.lastIndexOf('.'))
      const outputName = `${baseName}.${audioFormat}`

      const args: string[] = ['-i', inputFile.name, '-vn']
      
      // 音频编码设置
      if (audioFormat === 'mp3') {
        args.push('-c:a', 'libmp3lame', '-q:a', '2')
      } else if (audioFormat === 'aac') {
        args.push('-c:a', 'aac', '-b:a', '192k')
      } else if (audioFormat === 'wav') {
        args.push('-c:a', 'pcm_s16le')
      } else {
        args.push('-c:a', 'copy')
      }
      
      args.push(outputName)

      await runFFmpeg(args)

      const outputData = await readFile(outputName)
      const mimeType = `audio/${audioFormat === 'mp3' ? 'mpeg' : audioFormat}`
      const blob = new Blob([outputData.buffer as ArrayBuffer], { type: mimeType })
      const url = URL.createObjectURL(blob)

      await deleteFile(inputFile.name)
      await deleteFile(outputName)

      updateTask(taskId, { 
        status: 'completed', 
        progress: 100,
        outputFile: url 
      })

      return url
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      updateTask(taskId, { status: 'error', error: errorMessage })
      throw error
    }
  }, [loaded, load, addTask, updateTask, runFFmpeg, writeFile, readFile, deleteFile])

  return {
    loaded,
    loading,
    ffmpegError,
    ffmpegProgress,
    tasks,
    load,
    trimVideo,
    convertVideo,
    mergeVideos,
    extractAudio,
  }
}
