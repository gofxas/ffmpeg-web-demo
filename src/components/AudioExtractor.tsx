import { useState, useEffect } from 'react'
import { Music, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useVideoProcessor } from '@/hooks/useVideoProcessor'
import type { VideoFile } from '@/hooks/useVideoProcessor'

interface AudioExtractorProps {
  video: VideoFile
  onReset: () => void
}

const AUDIO_FORMATS = [
  { value: 'mp3', label: 'MP3', description: '最常用' },
  { value: 'aac', label: 'AAC', description: '高质量' },
  { value: 'wav', label: 'WAV', description: '无损' },
  { value: 'ogg', label: 'OGG', description: '开源' },
]

export function AudioExtractor({ video, onReset }: AudioExtractorProps) {
  const { extractAudio, loaded, loading, ffmpegProgress, load } = useVideoProcessor()
  const [format, setFormat] = useState('mp3')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded && !loading) {
      load()
    }
  }, [loaded, loading, load])

  const handleExtract = async () => {
    if (!loaded) return
    setProcessing(true)
    try {
      const url = await extractAudio(video, format)
      setResult(url)
    } catch (error) {
      console.error('Extract failed:', error)
      alert('提取失败，请重试')
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
          <Music className="w-5 h-5" />
          音频提取
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {result ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <audio 
                src={result} 
                controls 
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={downloadResult} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                下载音频文件
              </Button>
              <Button variant="outline" onClick={onReset}>
                提取其他视频
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

            <div>
              <Label>输出格式</Label>
              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                disabled={processing}
              >
                {AUDIO_FORMATS.map(f => (
                  <option key={f.value} value={f.value}>
                    {f.label} - {f.description}
                  </option>
                ))}
              </Select>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                源文件: {video.name}
                <br />
                输出格式: {format.toUpperCase()}
                <br />
                预计输出: {video.name.substring(0, video.name.lastIndexOf('.'))}.{format}
              </p>
            </div>

            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>提取中...</span>
                  <span>{ffmpegProgress.progress}%</span>
                </div>
                <Progress value={ffmpegProgress.progress} />
              </div>
            )}

            <Button 
              onClick={handleExtract} 
              disabled={processing || !loaded}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  提取中...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  加载 FFmpeg...
                </>
              ) : (
                <>
                  <Music className="w-4 h-4 mr-2" />
                  提取音频
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
