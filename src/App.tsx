import React from 'react'
import { Router, Routes, Route } from './lib/router'
import { Toaster } from 'react-hot-toast'
import Header from './components/Header'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Practice from './pages/Practice'
import TopicProblems from './pages/TopicProblems'
import Leaderboard from './pages/Leaderboard'
import ModeratorPractice from './pages/ModeratorPractice'
import CreateQuestion from './pages/CreateQuestion'
import UserProfile from './pages/UserProfile'

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname)
  
  React.useEffect(() => {
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname)
    }
    
    window.addEventListener('popstate', handleNavigation)
    
    const originalPushState = window.history.pushState
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args)
      handleNavigation()
    }
    
    return () => {
      window.removeEventListener('popstate', handleNavigation)
      window.history.pushState = originalPushState
    }
  }, [])

  const showHeader = !currentPath.includes('/practice/topic/')

  return (
    <Router>
      {showHeader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/moderator/practice" element={<ModeratorPractice />} />
        <Route path="/create-question" element={<CreateQuestion />} />
        <Route path="/practice/topic/:topicId" element={<TopicProblems />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<UserProfile />} />
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App
