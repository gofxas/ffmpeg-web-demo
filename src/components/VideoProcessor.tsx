import { useState } from 'react'
import { Scissors, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useVideoProcessor } from '@/hooks/useVideoProcessor'
import type { VideoFile } from '@/hooks/useVideoProcessor'

interface VideoProcessorProps {
  video: VideoFile
  onReset: () => void
}

export function VideoProcessor({ video, onReset }: VideoProcessorProps) {
  const { trimVideo, convertVideo, loaded, loading, ffmpegProgress } = useVideoProcessor()
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(video.duration || 10)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [activeOperation, setActiveOperation] = useState<'trim' | 'convert'>('trim')

  const handleTrim = async () => {
    if (!loaded) return
    setProcessing(true)
    setActiveOperation('trim')
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

  const handleConvert = async () => {
    if (!loaded) return
    setProcessing(true)
    setActiveOperation('convert')
    try {
      const url = await convertVideo(video, 'mp4', 'high')
      setResult(url)
    } catch (error) {
      console.error('Convert failed:', error)
      alert('转换失败，请重试')
    } finally {
      setProcessing(false)
    }
  }

  const downloadResult = () => {
    if (result) {
      const a = document.createElement('a')
      a.href = result
      a.download = `processed_${video.name}`
      a.click()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="w-5 h-5" />
          快速处理
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
                下载结果
              </Button>
              <Button variant="outline" onClick={onReset}>
                处理其他视频
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>开始时间 (秒)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={video.duration}
                    value={startTime}
                    onChange={(e) => setStartTime(Number(e.target.value))}
                    disabled={processing}
                  />
                </div>
                <div>
                  <Label>结束时间 (秒)</Label>
                  <Input
                    type="number"
                    min={startTime}
                    max={video.duration}
                    value={endTime}
                    onChange={(e) => setEndTime(Number(e.target.value))}
                    disabled={processing}
                  />
                </div>
              </div>

              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video 
                  src={URL.createObjectURL(video.file)} 
                  controls 
                  className="w-full h-full"
                />
              </div>

              {processing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>处理中...</span>
                    <span>{ffmpegProgress.progress}%</span>
                  </div>
                  <Progress value={ffmpegProgress.progress} />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleTrim} 
                  disabled={processing || !loaded}
                  className="flex-1"
                >
                  {processing && activeOperation === 'trim' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    '剪辑视频'
                  )}
                </Button>
                <Button 
                  onClick={handleConvert} 
                  disabled={processing || !loaded}
                  variant="outline"
                >
                  {processing && activeOperation === 'convert' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    '转MP4'
                  )}
                </Button>
              </div>

              {!loaded && (
                <p className="text-sm text-muted-foreground text-center">
                  首次使用需要加载 FFmpeg，请稍候...
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
