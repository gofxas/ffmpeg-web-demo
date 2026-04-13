import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { VideoUploader } from '@/components/VideoUploader'
import { VideoTrimmer } from '@/components/VideoTrimmer'
import { VideoConverter } from '@/components/VideoConverter'
import { VideoMerger } from '@/components/VideoMerger'
import { AudioExtractor } from '@/components/AudioExtractor'
import type { VideoFile } from '@/hooks/useVideoProcessor'

export function VideoProcess() {
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [selectedVideos, setSelectedVideos] = useState<VideoFile[]>([])
  const [activeTab, setActiveTab] = useState('trim')

  const handleVideoSelect = (video: VideoFile) => {
    setSelectedVideo(video)
  }

  const handleVideosSelect = (videos: VideoFile[]) => {
    setSelectedVideos(videos)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">视频处理</h1>
      <p className="text-muted-foreground mb-8">
        选择视频文件进行处理，支持剪辑、合并、转换等多种操作
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-fit">
          <TabsTrigger value="trim">视频剪辑</TabsTrigger>
          <TabsTrigger value="merge">视频合并</TabsTrigger>
          <TabsTrigger value="convert">格式转换</TabsTrigger>
          <TabsTrigger value="extract">音频提取</TabsTrigger>
        </TabsList>

        <TabsContent value="trim" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">选择视频</h3>
              <VideoUploader 
                onVideoSelect={handleVideoSelect}
                selectedVideo={selectedVideo}
              />
            </div>
            <div>
              {selectedVideo ? (
                <VideoTrimmer 
                  video={selectedVideo}
                  onReset={() => setSelectedVideo(null)}
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <p className="text-muted-foreground">请先上传视频</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="merge" className="mt-6">
          <VideoMerger 
            videos={selectedVideos}
            onVideosChange={handleVideosSelect}
          />
        </TabsContent>

        <TabsContent value="convert" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">选择视频</h3>
              <VideoUploader 
                onVideoSelect={handleVideoSelect}
                selectedVideo={selectedVideo}
              />
            </div>
            <div>
              {selectedVideo ? (
                <VideoConverter 
                  video={selectedVideo}
                  onReset={() => setSelectedVideo(null)}
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <p className="text-muted-foreground">请先上传视频</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="extract" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">选择视频</h3>
              <VideoUploader 
                onVideoSelect={handleVideoSelect}
                selectedVideo={selectedVideo}
              />
            </div>
            <div>
              {selectedVideo ? (
                <AudioExtractor 
                  video={selectedVideo}
                  onReset={() => setSelectedVideo(null)}
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <p className="text-muted-foreground">请先上传视频</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
