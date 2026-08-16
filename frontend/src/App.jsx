import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Entry from './pages/Entry'
import Wardrobe from './pages/Wardrobe'
import ClothesDetail from './pages/ClothesDetail'
import Outfit from './pages/Outfit'
import Recommendation from './pages/Recommendation'
import TabBar from './components/TabBar'
import Login from './pages/Login'
import { useAuth } from './contexts/AuthContext'
import { UploadProvider } from './contexts/UploadContext.jsx'
import { RecommendationProvider } from './contexts/RecommendationContext.jsx'
import { LoaderCircle, LogOut } from 'lucide-react'
import './index.css'

function App() {
  const { admin, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-[var(--accent)]">
        <LoaderCircle className="animate-spin" size={34} aria-label="正在检查登录状态" />
      </div>
    )
  }

  if (!admin) return <Login />

  return (
    <UploadProvider>
      <RecommendationProvider>
        <Router>
          <div className="app-shell text-[var(--text-primary)]">
            <button
              type="button"
              onClick={logout}
              className="btn-icon fixed right-4 top-4 z-[60]"
              title={`退出 ${admin.username}`}
              aria-label="退出管理员账户"
            >
              <LogOut size={18} />
            </button>
            <div className="app-content mx-auto w-full max-w-screen-2xl pb-28 lg:pb-10 lg:pt-24 lg:px-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/entry" element={<Entry />} />
                <Route path="/wardrobe" element={<Wardrobe />} />
                <Route path="/clothes/:id" element={<ClothesDetail />} />
                <Route path="/outfit" element={<Outfit />} />
                <Route path="/recommendation" element={<Recommendation />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <TabBar />
          </div>
        </Router>
      </RecommendationProvider>
    </UploadProvider>
  )
}

export default App
