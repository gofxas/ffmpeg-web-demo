import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return true
      }
      return false
    }

    if (checkInstalled()) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showPrompt || isInstalled) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4">
      <Card className="shadow-lg border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">安装到桌面</h3>
              <p className="text-xs text-muted-foreground mt-1">
                添加到桌面即可离线使用，更便捷的视频处理体验
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleInstall} className="flex-1">
                  安装
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
