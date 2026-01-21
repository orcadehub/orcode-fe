import React, { useState, createContext, useContext, useEffect } from 'react'

interface RouterContextType {
  currentPath: string
  navigate: (path: string) => void
}

const RouterContext = createContext<RouterContextType | undefined>(undefined)

export const useNavigate = () => {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useNavigate must be used within a Router')
  }
  return context.navigate
}

export const useParams = <T extends Record<string, string>>(): T => {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useParams must be used within a Router')
  }
  
  const params: Record<string, string> = {}
  const pathParts = context.currentPath.split('/')
  
  // Simple param extraction for /practice/topic/:topicId pattern
  if (pathParts[1] === 'practice' && pathParts[2] === 'topic' && pathParts[3]) {
    params.topicId = pathParts[3]
  }
  
  return params as T
}

interface RouterProps {
  children: React.ReactNode
}

export const Router: React.FC<RouterProps> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  const navigate = (path: string) => {
    setCurrentPath(path)
    window.history.pushState({}, '', path)
  }

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

interface RouteProps {
  path: string
  element: React.ReactElement
}

export const Route: React.FC<RouteProps> = ({ path, element }) => {
  const context = useContext(RouterContext)
  if (!context) return null
  
  // Handle dynamic routes
  if (path.includes(':')) {
    const pathPattern = path.split('/')
    const currentPathParts = context.currentPath.split('/')
    
    if (pathPattern.length !== currentPathParts.length) return null
    
    const matches = pathPattern.every((part, index) => {
      return part.startsWith(':') || part === currentPathParts[index]
    })
    
    return matches ? element : null
  }
  
  return context.currentPath === path ? element : null
}

interface RoutesProps {
  children: React.ReactNode
}

export const Routes: React.FC<RoutesProps> = ({ children }) => {
  return <>{children}</>
}