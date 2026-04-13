import { useState, useEffect } from 'react'
import { FileAudio, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useVideoProcessor } from '@/hooks/useVideoProcessor'
import type { VideoFile } from '@/hooks/useVideoProcessor'

interface VideoConverterProps {
  video: VideoFile
  onReset: () => void
}

const FORMATS = [
  { value: 'mp4', label: 'MP4 (H.264)', description: '兼容性最好' },
  { value: 'webm', label: 'WebM (VP9)', description: 'Web 优化' },
  { value: 'mkv', label: 'MKV', description: '高质量' },
]

const QUALITIES = [
  { value: 'high', label: '高质量', description: '文件较大' },
  { value: 'medium', label: '中等质量', description: '平衡' },
  { value: 'low', label: '低质量', description: '文件较小' },
]

export function VideoConverter({ video, onReset }: VideoConverterProps) {
  const { convertVideo, loaded, loading, ffmpegProgress, load } = useVideoProcessor()
  const [format, setFormat] = useState('mp4')
  const [quality, setQuality] = useState('high')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded && !loading) {
      load()
    }
  }, [loaded, loading, load])

  const handleConvert = async () => {
    if (!loaded) return
    setProcessing(true)
    try {
      const url = await convertVideo(video, format, quality)
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
      const baseName = video.name.substring(0, video.name.lastIndexOf('.'))
      a.download = `${baseName}.${format}`
      a.click()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileAudio className="w-5 h-5" />
          格式转换
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
                下载转换结果
              </Button>
              <Button variant="outline" onClick={onReset}>
                转换其他视频
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video 
                src={URL.createObjectURL(video.file)} 
                controls 
                className="w-full h-full"
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label>输出格式</Label>
                <Select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  disabled={processing}
                >
                  {FORMATS.map(f => (
                    <option key={f.value} value={f.value}>
                      {f.label} - {f.description}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>输出质量</Label>
                <Select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  disabled={processing}
                >
                  {QUALITIES.map(q => (
                    <option key={q.value} value={q.value}>
                      {q.label} - {q.description}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                源文件: {video.name}
                <br />
                输出格式: {format.toUpperCase()}
                <br />
                质量: {QUALITIES.find(q => q.value === quality)?.label}
              </p>
            </div>

            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>转换中...</span>
                  <span>{ffmpegProgress.progress}%</span>
                </div>
                <Progress value={ffmpegProgress.progress} />
              </div>
            )}

            <Button 
              onClick={handleConvert} 
              disabled={processing || !loaded}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  转换中...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  加载 FFmpeg...
                </>
              ) : (
                <>
                  <FileAudio className="w-4 h-4 mr-2" />
                  开始转换
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
