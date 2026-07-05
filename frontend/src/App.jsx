import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Entry from './pages/Entry'
import Wardrobe from './pages/Wardrobe'
import ClothesDetail from './pages/ClothesDetail'
import Outfit from './pages/Outfit'
import Recommendation from './pages/Recommendation'
import TabBar from './components/TabBar'
import './index.css'

function App() {
  return (
    <Router>
      <div className="app-shell text-[var(--text-primary)]">
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
  )
}

export default App
