import { useState, useCallback } from 'react'
import { Plus, Trash2, Play, Download, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { VideoUploader } from '@/components/VideoUploader'
import { useVideoProcessor, type VideoFile } from '@/hooks/useVideoProcessor'

interface BatchTask {
  id: string
  video: VideoFile
  operation: 'convert' | 'extract'
  options: {
    format?: string
    quality?: string
    audioFormat?: string
  }
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  result?: string
  error?: string
}

export function BatchProcess() {
  const [tasks, setTasks] = useState<BatchTask[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { convertVideo, extractAudio, loaded, loading, load } = useVideoProcessor()

  const addTask = useCallback((video: VideoFile) => {
    const newTask: BatchTask = {
      id: Math.random().toString(36).substr(2, 9),
      video,
      operation: 'convert',
      options: { format: 'mp4', quality: 'high' },
      status: 'pending',
      progress: 0,
    }
    setTasks(prev => [...prev, newTask])
  }, [])

  const removeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }, [])

  const updateTask = useCallback((taskId: string, updates: Partial<BatchTask>) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    ))
  }, [])

  const handleVideoSelect = useCallback((video: VideoFile) => {
    addTask(video)
  }, [addTask])

  const processBatch = async () => {
    if (!loaded) {
      await load()
    }

    setIsProcessing(true)
    const pendingTasks = tasks.filter(t => t.status === 'pending')

    for (const task of pendingTasks) {
      updateTask(task.id, { status: 'processing' })

      try {
        let result: string

        if (task.operation === 'convert') {
          result = await convertVideo(
            task.video,
            task.options.format || 'mp4',
            task.options.quality || 'high'
          )
        } else {
          result = await extractAudio(
            task.video,
            task.options.audioFormat || 'mp3'
          )
        }

        updateTask(task.id, { 
          status: 'completed', 
          progress: 100,
          result 
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '处理失败'
        updateTask(task.id, { 
          status: 'error', 
          error: errorMessage 
        })
      }
    }

    setIsProcessing(false)
  }

  const downloadResult = (task: BatchTask) => {
    if (task.result) {
      const a = document.createElement('a')
      a.href = task.result
      a.download = `processed_${task.video.name}`
      a.click()
    }
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length
  const errorCount = tasks.filter(t => t.status === 'error').length

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">批量处理</h1>
      <p className="text-muted-foreground mb-8">
        批量处理多个视频文件，支持格式转换和音频提取
      </p>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>添加视频</CardTitle>
            </CardHeader>
            <CardContent>
              <VideoUploader 
                onVideoSelect={handleVideoSelect}
                allowMultiple={true}
              />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>批量操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>总任务: {tasks.length}</p>
                <p>已完成: {completedCount}</p>
                {errorCount > 0 && (
                  <p className="text-destructive">失败: {errorCount}</p>
                )}
              </div>
              <Button 
                className="w-full"
                disabled={tasks.length === 0 || isProcessing || tasks.every(t => t.status !== 'pending')}
                onClick={processBatch}
              >
                {loading ? (
                  '加载 FFmpeg...'
                ) : isProcessing ? (
                  '处理中...'
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    开始批量处理
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>任务列表</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>点击左侧添加视频文件</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div 
                      key={task.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {task.video.name.split('.').pop()?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[200px]">
                              {task.video.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(task.video.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.status === 'completed' && task.result && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => downloadResult(task)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => removeTask(task.id)}
                            disabled={isProcessing}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">操作</Label>
                          <Select
                            value={task.operation}
                            onChange={(e) => updateTask(task.id, { 
                              operation: e.target.value as 'convert' | 'extract' 
                            })}
                            disabled={isProcessing || task.status === 'processing'}
                          >
                            <option value="convert">格式转换</option>
                            <option value="extract">音频提取</option>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">
                            {task.operation === 'convert' ? '输出格式' : '音频格式'}
                          </Label>
                          <Select
                            value={task.operation === 'convert' ? task.options.format : task.options.audioFormat}
                            onChange={(e) => updateTask(task.id, { 
                              options: { 
                                ...task.options, 
                                [task.operation === 'convert' ? 'format' : 'audioFormat']: e.target.value 
                              } 
                            })}
                            disabled={isProcessing || task.status === 'processing'}
                          >
                            {task.operation === 'convert' ? (
                              <>
                                <option value="mp4">MP4</option>
                                <option value="webm">WebM</option>
                                <option value="mkv">MKV</option>
                              </>
                            ) : (
                              <>
                                <option value="mp3">MP3</option>
                                <option value="aac">AAC</option>
                                <option value="wav">WAV</option>
                              </>
                            )}
                          </Select>
                        </div>
                      </div>

                      {task.operation === 'convert' && (
                        <div>
                          <Label className="text-xs">质量</Label>
                          <Select
                            value={task.options.quality}
                            onChange={(e) => updateTask(task.id, { 
                              options: { ...task.options, quality: e.target.value } 
                            })}
                            disabled={isProcessing || task.status === 'processing'}
                          >
                            <option value="high">高质量</option>
                            <option value="medium">中等质量</option>
                            <option value="low">低质量（文件更小）</option>
                          </Select>
                        </div>
                      )}

                      {task.status === 'processing' && (
                        <Progress value={task.progress} className="h-2" />
                      )}

                      {task.status === 'error' && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{task.error || '处理失败'}</span>
                        </div>
                      )}

                      {task.status === 'completed' && (
                        <p className="text-sm text-green-600">处理完成</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
