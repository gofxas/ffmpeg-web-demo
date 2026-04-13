import { Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Home } from '@/pages/Home'
import { VideoProcess } from '@/pages/VideoProcess'
import { BatchProcess } from '@/pages/BatchProcess'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/process" element={<VideoProcess />} />
          <Route path="/batch" element={<BatchProcess />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
