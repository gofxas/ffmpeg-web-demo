import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Video, 
  Scissors, 
  Combine, 
  FileAudio, 
  ArrowRight, 
  Zap,
  Shield,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VideoUploader } from '@/components/VideoUploader'
import { VideoProcessor } from '@/components/VideoProcessor'
import type { VideoFile } from '@/hooks/useVideoProcessor'

export function Home() {
  const [demoVideo, setDemoVideo] = useState<VideoFile | null>(null)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              在线视频处理工具
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              基于 FFmpeg.wasm 的浏览器端视频处理解决方案。
              <br />
              无需上传，本地处理，保护隐私。
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/process">
                <Button size="lg" className="gap-2">
                  <Video className="w-5 h-5" />
                  开始处理视频
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/batch">
                <Button size="lg" variant="outline" className="gap-2">
                  <Combine className="w-5 h-5" />
                  批量处理
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">功能特性</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Scissors className="w-10 h-10 text-primary mb-4" />
                <CardTitle>视频剪辑</CardTitle>
                <CardDescription>
                  精确裁剪视频片段，支持时间轴选择和预览
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Combine className="w-10 h-10 text-primary mb-4" />
                <CardTitle>视频合并</CardTitle>
                <CardDescription>
                  将多个视频文件合并为一个完整的视频
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <FileAudio className="w-10 h-10 text-primary mb-4" />
                <CardTitle>格式转换</CardTitle>
                <CardDescription>
                  支持 MP4、WebM、MKV 等多种视频格式转换
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="w-10 h-10 text-primary mb-4" />
                <CardTitle>音频提取</CardTitle>
                <CardDescription>
                  从视频中提取音频，支持 MP3、AAC 等格式
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">技术栈</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <Globe className="w-10 h-10 text-primary mb-4" />
                <CardTitle>React + Vite</CardTitle>
                <CardDescription>
                  现代化的前端框架，提供流畅的用户体验
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Video className="w-10 h-10 text-primary mb-4" />
                <CardTitle>FFmpeg.wasm</CardTitle>
                <CardDescription>
                  WebAssembly 版本的 FFmpeg，在浏览器中运行
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="w-10 h-10 text-primary mb-4" />
                <CardTitle>本地处理</CardTitle>
                <CardDescription>
                  所有处理在本地完成，视频不会上传到服务器
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">立即试用</h2>
          <p className="text-center text-muted-foreground mb-12">
            上传视频文件，体验强大的视频处理功能
          </p>
          <div className="max-w-3xl mx-auto">
            {!demoVideo ? (
              <VideoUploader onVideoSelect={setDemoVideo} />
            ) : (
              <VideoProcessor 
                video={demoVideo} 
                onReset={() => setDemoVideo(null)} 
              />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>FFmpeg Web - 在线视频处理工具</p>
          <p className="text-sm mt-2">
            基于 FFmpeg.wasm 构建，所有处理在本地完成
          </p>
        </div>
      </footer>
    </div>
  )
}
