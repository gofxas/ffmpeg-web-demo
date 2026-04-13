import { useCallback, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VideoFile } from '@/hooks/useVideoProcessor'

interface VideoUploaderProps {
  onVideoSelect: (video: VideoFile) => void
  selectedVideo?: VideoFile | null
  allowMultiple?: boolean
  className?: string
}

export function VideoUploader({ 
  onVideoSelect, 
  selectedVideo, 
  allowMultiple = false,
  className 
}: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('video/')) {
        alert('请选择视频文件')
        continue
      }

      const videoFile: VideoFile = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
      }

      // Get video duration
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        videoFile.duration = video.duration
        URL.revokeObjectURL(video.src)
      }
      video.src = URL.createObjectURL(file)

      onVideoSelect(videoFile)
      
      if (!allowMultiple) break
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [onVideoSelect, allowMultiple])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('video/')) {
        alert('请选择视频文件')
        continue
      }

      const videoFile: VideoFile = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
      }

      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        videoFile.duration = video.duration
        URL.revokeObjectURL(video.src)
      }
      video.src = URL.createObjectURL(file)

      onVideoSelect(videoFile)
      
      if (!allowMultiple) break
    }
  }, [onVideoSelect, allowMultiple])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          "hover:border-primary hover:bg-muted/50",
          selectedVideo ? "border-primary bg-muted/50" : "border-muted-foreground/25"
        )}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">
          点击或拖拽上传视频
        </p>
        <p className="text-sm text-muted-foreground">
          支持 MP4、WebM、MKV 等格式
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple={allowMultiple}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {selectedVideo && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {selectedVideo.name.split('.').pop()?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium truncate max-w-[200px]">
                {selectedVideo.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {(selectedVideo.size / 1024 / 1024).toFixed(2)} MB
                {selectedVideo.duration && (
                  <> · {Math.round(selectedVideo.duration)}s</>
                )}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onVideoSelect(null as unknown as VideoFile)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
