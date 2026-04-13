import { useState, useEffect } from 'react'
import { Combine, Download, Loader2, GripVertical, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { VideoUploader } from './VideoUploader'
import { useVideoProcessor } from '@/hooks/useVideoProcessor'
import type { VideoFile } from '@/hooks/useVideoProcessor'

interface VideoMergerProps {
  videos: VideoFile[]
  onVideosChange: (videos: VideoFile[]) => void
}

export function VideoMerger({ videos, onVideosChange }: VideoMergerProps) {
  const { mergeVideos, loaded, loading, ffmpegProgress, load } = useVideoProcessor()
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded && !loading) {
      load()
    }
  }, [loaded, loading, load])

  const handleVideoAdd = (video: VideoFile) => {
    onVideosChange([...videos, video])
  }

  const removeVideo = (index: number) => {
    onVideosChange(videos.filter((_, i) => i !== index))
  }

  const moveVideo = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= videos.length) return
    const newVideos = [...videos]
    const [moved] = newVideos.splice(fromIndex, 1)
    newVideos.splice(toIndex, 0, moved)
    onVideosChange(newVideos)
  }

  const handleMerge = async () => {
    if (!loaded || videos.length < 2) return
    setProcessing(true)
    try {
      const url = await mergeVideos(videos)
      setResult(url)
    } catch (error) {
      console.error('Merge failed:', error)
      alert('合并失败，请重试')
    } finally {
      setProcessing(false)
    }
  }

  const downloadResult = () => {
    if (result) {
      const a = document.createElement('a')
      a.href = result
      a.download = `merged_${Date.now()}.mp4`
      a.click()
    }
  }

  const reset = () => {
    setResult(null)
    onVideosChange([])
  }

  const formatTime = (seconds?: number) => {
    if (!seconds) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Combine className="w-5 h-5" />
            合并完成
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video 
              src={result} 
              controls 
              className="w-full h-full"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadResult} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              下载合并结果
            </Button>
            <Button variant="outline" onClick={reset}>
              合并其他视频
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <Card>
          <CardHeader>
            <CardTitle>添加视频</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoUploader 
              onVideoSelect={handleVideoAdd}
              allowMultiple={true}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>合并设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>已添加视频: {videos.length}</p>
              <p>总时长: {formatTime(videos.reduce((acc, v) => acc + (v.duration || 0), 0))}</p>
            </div>
            
            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>合并中...</span>
                  <span>{ffmpegProgress.progress}%</span>
                </div>
                <Progress value={ffmpegProgress.progress} />
              </div>
            )}

            <Button 
              onClick={handleMerge} 
              disabled={processing || !loaded || videos.length < 2}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  合并中...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  加载 FFmpeg...
                </>
              ) : (
                <>
                  <Combine className="w-4 h-4 mr-2" />
                  开始合并
                </>
              )}
            </Button>

            {videos.length < 2 && (
              <p className="text-sm text-muted-foreground text-center">
                请至少添加 2 个视频进行合并
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>视频列表 (按此顺序合并)</CardTitle>
          </CardHeader>
          <CardContent>
            {videos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>点击左侧添加视频文件</p>
                <p className="text-sm mt-2">支持拖拽调整顺序</p>
              </div>
            ) : (
              <div className="space-y-2">
                {videos.map((video, index) => (
                  <div 
                    key={video.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                    <span className="text-sm font-medium w-6">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{video.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(video.duration)} · {(video.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => moveVideo(index, index - 1)}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => moveVideo(index, index + 1)}
                        disabled={index === videos.length - 1}
                      >
                        ↓
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeVideo(index)}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
