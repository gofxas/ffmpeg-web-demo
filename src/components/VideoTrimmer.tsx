import { useState, useRef, useEffect } from 'react'
import { Scissors, Download, Loader2, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useVideoProcessor } from '@/hooks/useVideoProcessor'
import type { VideoFile } from '@/hooks/useVideoProcessor'

interface VideoTrimmerProps {
  video: VideoFile
  onReset: () => void
}

export function VideoTrimmer({ video, onReset }: VideoTrimmerProps) {
  const { trimVideo, loaded, loading, ffmpegError, ffmpegProgress, load } = useVideoProcessor()
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(video.duration || 10)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!loaded && !loading) {
      load()
    }
  }, [loaded, loading, load])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  const handleTrim = async () => {
    if (!loaded) return
    setProcessing(true)
    try {
      const url = await trimVideo(video, startTime, endTime)
      setResult(url)
    } catch (error) {
      console.error('Trim failed:', error)
      alert('剪辑失败，请重试')
    } finally {
      setProcessing(false)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const downloadResult = () => {
    if (result) {
      const a = document.createElement('a')
      a.href = result
      a.download = `trimmed_${video.name}`
      a.click()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="w-5 h-5" />
          视频剪辑
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {result ? (
          <div className="space-y-4">
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
                下载剪辑结果
              </Button>
              <Button variant="outline" onClick={onReset}>
                剪辑其他视频
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video 
                ref={videoRef}
                src={URL.createObjectURL(video.file)} 
                className="w-full h-full"
                onClick={togglePlay}
              />
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
              >
                {isPlaying ? (
                  <Pause className="w-16 h-16 text-white" />
                ) : (
                  <Play className="w-16 h-16 text-white" />
                )}
              </button>
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>当前: {formatTime(currentTime)}</span>
              <span>总时长: {formatTime(video.duration || 0)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>开始时间 (秒)</Label>
                <Input
                  type="number"
                  min={0}
                  max={video.duration}
                  step={0.1}
                  value={startTime}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setStartTime(val)
                    if (videoRef.current) {
                      videoRef.current.currentTime = val
                    }
                  }}
                  disabled={processing}
                />
              </div>
              <div>
                <Label>结束时间 (秒)</Label>
                <Input
                  type="number"
                  min={startTime}
                  max={video.duration}
                  step={0.1}
                  value={endTime}
                  onChange={(e) => setEndTime(Number(e.target.value))}
                  disabled={processing}
                />
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                剪辑范围: {formatTime(startTime)} - {formatTime(endTime)}
                <br />
                剪辑时长: {formatTime(endTime - startTime)}
              </p>
            </div>

            {ffmpegError && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                <p className="font-medium mb-2">加载失败</p>
                <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-32">{ffmpegError}</pre>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => load()} 
                  className="mt-3"
                >
                  重新加载
                </Button>
              </div>
            )}

            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>处理中...</span>
                  <span>{ffmpegProgress.progress}%</span>
                </div>
                <Progress value={ffmpegProgress.progress} />
              </div>
            )}

            <Button 
              onClick={handleTrim} 
              disabled={processing || !loaded || startTime >= endTime || !!ffmpegError}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  加载 FFmpeg...
                </>
              ) : ffmpegError ? (
                <>
                  加载失败
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4 mr-2" />
                  开始剪辑
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
