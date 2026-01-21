import React, { useState, useEffect, useRef } from 'react'
import { Container, Typography, Box, Card, CardContent, Button, TextField, Chip, LinearProgress, IconButton, Drawer, Tabs, Tab, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { ArrowBack, Code, CheckCircle, Lock, Menu, Close, PlayArrow, LightMode, DarkMode, Add, Remove, Fullscreen, FullscreenExit, VisibilityOff, Quiz, Speed, Memory, TrendingUp, MonetizationOn, AccessTime, BugReport, ContentCopy, Check } from '@mui/icons-material'
import { useNavigate, useParams } from '../lib/router'
import { useTheme } from '../lib/ThemeContext'
import { userAPI } from '../lib/api'
import api from '../lib/api'
import toast from 'react-hot-toast'
import logo from '../logo.jpeg'


interface Question {
  _id: string
  title: string
  description: string
  constraints: string[]
  example: {
    input: string
    output: string
  }
  explanation: string
  testCases: {
    public: Array<{ input: string; output: string; explanation: string; userOutput?: string }>
    private: Array<{ input: string; output: string }>
  }
  difficulty: string
  points?: number
  completed?: boolean
}

interface Topic {
  _id: string
  title: string
  description: string
  difficulty: string
}

const TopicProblems: React.FC = () => {
  const navigate = useNavigate()
  const { topicId } = useParams<{ topicId: string }>()
  const { isDark, toggleTheme } = useTheme()
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [splitPosition, setSplitPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [compilerSplit, setCompilerSplit] = useState(60)
  const [isCompilerDragging, setIsCompilerDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [failedTestCase, setFailedTestCase] = useState<{input: string, output: string, userOutput: string, passedCount: number, totalCount: number} | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<{passed: boolean, totalTests: number, timeTaken: number} | null>(null)
  const [language, setLanguage] = useState('')
  const editorRef = useRef<any>(null)
  const monacoEl = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(14)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hideTestCases, setHideTestCases] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userCoins, setUserCoins] = useState(0)
  const [problemTabValue, setProblemTabValue] = useState(0)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyAttemptModal, setCopyAttemptModal] = useState(false)
  
  // Disable copy/paste activities
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) {
        e.preventDefault()
        setCopyAttemptModal(true)
      }
    }
    
    const handleCopy = (e) => {
      e.preventDefault()
      setCopyAttemptModal(true)
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('cut', handleCopy)
    document.addEventListener('paste', handleCopy)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('cut', handleCopy)
      document.removeEventListener('paste', handleCopy)
    }
  }, [])
  
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }
  
  useEffect(() => {
    console.log('TopicId from params:', topicId)
    if (topicId) {
      fetchTopicAndQuestions()
    } else {
      console.log('No topicId found')
      setLoading(false)
    }
    
    fetchUserCoins()
    
    // Check if user is logged in
    const checkAuth = () => {
      if (!token) {
        setIsLoggedIn(false)
        return
      }
      
      try {
        // Basic token format validation
        const tokenParts = token.split('.')
        if (tokenParts.length === 3) {
          setIsLoggedIn(true)
        } else {
          setIsLoggedIn(false)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      } catch (error) {
        setIsLoggedIn(false)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    
    checkAuth()
  }, [topicId])
  
  // Load saved code when problem or language changes
  useEffect(() => {
    if (currentProblem && isLoggedIn && language && editorRef.current) {
      loadSavedCode()
    }
    // Clear submission results when problem changes
    setSubmissionResult(null)
    setFailedTestCase(null)
  }, [currentProblemIndex, language, isLoggedIn])
  
  // Load submissions when problem changes
  useEffect(() => {
    if (currentProblem && isLoggedIn && problemTabValue === 1) {
      fetchSubmissions()
    }
  }, [currentProblemIndex, isLoggedIn, problemTabValue])
  
  const loadSavedCode = async () => {
    try {
      const response = await api.get(`/user/code/${currentProblem._id}/${language}`, { headers })
      if (response.data.code) {
        setCode(response.data.code)
        
        // Update Monaco Editor if it exists
        if (editorRef.current) {
          editorRef.current.setValue(response.data.code)
        }
      } else {
        // No saved code for this language, use template
        const template = getLanguageTemplate(language)
        setCode(template)
        if (editorRef.current) {
          editorRef.current.setValue(template)
        }
      }
    } catch (error) {
      console.error('Error loading saved code:', error)
      // Use template on error
      const template = getLanguageTemplate(language)
      setCode(template)
      if (editorRef.current) {
        editorRef.current.setValue(template)
      }
    }
  }
  
  const fetchUserCoins = async () => {
    try {
      const response = await api.get('/user/progress', { headers })
      setUserCoins(response.data.totalCoins || 0)
    } catch (error) {
      console.error('Error fetching user coins:', error)
    }
  }
  
  const fetchSubmissions = async () => {
    if (!currentProblem || !token) return
    
    setLoadingSubmissions(true)
    try {
      const response = await userAPI.getSubmissions(currentProblem._id, token)
      setSubmissions(response.data)
    } catch (error) {
      console.error('Error fetching submissions:', error)
      setSubmissions([])
    } finally {
      setLoadingSubmissions(false)
    }
  }
  
  const fetchTopicAndQuestions = async () => {
    try {
      console.log('Fetching topic and questions for topicId:', topicId)
      // Fetch topic details
      const topicsResponse = await api.get('/moderator/topics', { headers })
      console.log('Topics response:', topicsResponse.data)
      const topicData = topicsResponse.data.find((t: any) => t._id === topicId)
      console.log('Found topic:', topicData)
      setTopic(topicData)
      
      // Fetch questions for this topic
      const questionsResponse = await api.get(`/moderator/topics/${topicId}/questions`, { headers })
      console.log('Questions response:', questionsResponse.data)
      
      // Fetch user progress to mark completed questions
      let completedQuestionIds: string[] = []
      try {
        const progressResponse = await api.get('/user/progress', { headers })
        console.log('User progress:', progressResponse.data)
        completedQuestionIds = progressResponse.data.completedQuestions?.map((q: any) => 
          typeof q === 'string' ? q : q._id
        ) || []
        console.log('Completed question IDs:', completedQuestionIds)
      } catch (error) {
        console.error('Error fetching user progress:', error)
      }
      
      const questionsData = questionsResponse.data.map((q: any) => {
        const isCompleted = completedQuestionIds.includes(q._id)
        console.log(`Question ${q.title} (${q._id}): completed = ${isCompleted}`)
        return {
          ...q,
          completed: isCompleted
        }
      })
      console.log('Processed questions:', questionsData)
      setQuestions(questionsData)
      
      // Auto-open next uncompleted problem
      const nextUncompletedIndex = questionsData.findIndex((q: any) => !q.completed)
      if (nextUncompletedIndex !== -1) {
        setCurrentProblemIndex(nextUncompletedIndex)
      }
    } catch (error) {
      console.error('Error fetching topic and questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLanguageTemplate = (lang: string) => {
    switch (lang) {
      case 'cpp':
        return '// C++ Code\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}'
      case 'java':
        return '// Java Code\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code here\n        \n    }\n}'
      case 'python':
        return '# Python Code\n# Write your code here\n'
      case 'c':
        return '// C Code\n#include <stdio.h>\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}'
      default:
        return '// Write your code here'
    }
  }

  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'cpp': return 'cpp'
      case 'java': return 'java'
      case 'python': return 'python'
      case 'c': return 'c'
      default: return 'plaintext'
    }
  }

  useEffect(() => {
    if (monacoEl.current && language) {
      // Dynamic import Monaco Editor
      import('monaco-editor').then((monaco) => {
        // Dispose existing editor
        if (editorRef.current) {
          editorRef.current.dispose()
        }

        // Create new editor
        editorRef.current = monaco.editor.create(monacoEl.current!, {
          value: code || getLanguageTemplate(language),
          language: getMonacoLanguage(language),
          theme: isDark ? 'vs-dark' : 'vs',
          fontSize: fontSize,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbers: 'on',
          folding: true,
          autoIndent: 'full',
          formatOnPaste: true,
          formatOnType: true,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoSurround: 'languageDefined',
          bracketPairColorization: { enabled: true },
          contextmenu: true,
        })

        // Update code state when editor content changes
        editorRef.current.onDidChangeModelContent(() => {
          if (editorRef.current) {
            setCode(editorRef.current.getValue())
            // Auto close sidebar when user starts typing
            if (sidebarOpen) {
              setSidebarOpen(false)
            }
          }
        })

        // Add keyboard shortcuts override and paste detection
        editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
          setCopyAttemptModal(true)
        })
        editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
          setCopyAttemptModal(true)
        })
        editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {
          setCopyAttemptModal(true)
        })
        editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {
          setCopyAttemptModal(true)
        })
        
        // Override paste action
        editorRef.current.onDidPaste(() => {
          setCopyAttemptModal(true)
          // Undo the paste
          editorRef.current.trigger('keyboard', 'undo', null)
        })

        // Load saved code immediately after editor is created
        setTimeout(() => {
          if (currentProblem && isLoggedIn && editorRef.current) {
            loadSavedCode()
          }
        }, 100)

        // Add resize observer for better responsiveness
        const resizeObserver = new ResizeObserver(() => {
          if (editorRef.current) {
            editorRef.current.layout()
          }
        })
        
        if (monacoEl.current) {
          resizeObserver.observe(monacoEl.current)
        }

        // Store observer for cleanup
        editorRef.current._resizeObserver = resizeObserver
      })
    }

    return () => {
      if (editorRef.current) {
        if (editorRef.current._resizeObserver) {
          editorRef.current._resizeObserver.disconnect()
        }
        editorRef.current.dispose()
      }
    }
  }, [language, isDark, fontSize])

  const [problems, setProblems] = useState<Question[]>([])

  useEffect(() => {
    setProblems(questions)
  }, [questions])

  const currentProblem = problems[currentProblemIndex]
  const completedCount = problems.filter(p => p.completed).length
  
  // Clear submission results when problem changes
  useEffect(() => {
    setSubmissionResult(null)
    setFailedTestCase(null)
  }, [currentProblemIndex])

  const handleRunCode = async () => {
    if (!code.trim() || !language) return
    
    // Save current code to database
    try {
      await api.post('/user/save-code', {
        questionId: currentProblem._id,
        code,
        language
      }, { headers })
    } catch (error) {
      console.error('Error saving code:', error)
    }
    
    setIsRunning(true)
    setOutput('Running test cases...')
    setSubmissionResult(null)
    setFailedTestCase(null)
    
    const languageMap = {
      cpp: 'cpp',
      java: 'java',
      python: 'python',
      c: 'c'
    }

    const apis = [
      'https://emkc.org/api/v2/piston/execute'
    ]
    
    try {
      // Run test cases sequentially to avoid rate limiting
      const updatedTestCases = []
      
      for (const testCase of currentProblem.testCases.public) {
        try {
          const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: languageMap[language as keyof typeof languageMap],
              version: '*',
              files: [{ content: code }],
              stdin: testCase.input.replace('\\n', '\n')
            })
          })
          
          const result = await response.json()
          let userOutput = ''
          
          if (result.run) {
            if (result.run.stdout) {
              userOutput = result.run.stdout.trim()
            }
            if (result.run.stderr) {
              userOutput = 'Error: ' + result.run.stderr
            }
            if (result.compile && result.compile.stderr) {
              userOutput = 'Compile Error: ' + result.compile.stderr
            }
          }
          
          if (!userOutput) {
            userOutput = 'No output'
          }
          
          updatedTestCases.push({ ...testCase, userOutput })
          
          // Small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (error) {
          updatedTestCases.push({ ...testCase, userOutput: 'Connection error' })
        }
      }
      
      // Update problems with all test case results
      const updatedProblems = problems.map((problem, index) => {
        if (index === currentProblemIndex) {
          return {
            ...problem,
            testCases: {
              ...problem.testCases,
              public: updatedTestCases
            }
          }
        }
        return problem
      })
      
      setProblems(updatedProblems)
      
    } catch (error) {
      console.error('Execution error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmitSolution = async () => {
    if (!code.trim() || !language) return

    setIsSubmitting(true)
    setFailedTestCase(null)
    setSubmissionResult(null)
    
    const startTime = Date.now()
    const languageMap = {
      cpp: 'cpp',
      java: 'java', 
      python: 'python',
      c: 'c'
    }
    
    try {
      // Run all test cases (public + private)
      const allTestCases = [...currentProblem.testCases.public, ...currentProblem.testCases.private]
      let passedCount = 0
      
      for (const testCase of allTestCases) {
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            language: languageMap[language as keyof typeof languageMap],
            version: '*',
            files: [{
              content: code
            }],
            stdin: testCase.input.replace('\\n', '\n')
          })
        })
        
        const result = await response.json()
        
        let userOutput = ''
        
        if (result.run) {
          if (result.run.stdout) {
            userOutput = result.run.stdout.trim()
          }
          
          if (result.run.stderr) {
            userOutput = 'Error: ' + result.run.stderr
          }
          
          if (result.compile && result.compile.stderr) {
            userOutput = 'Compile Error: ' + result.compile.stderr
          }
        }
        
        if (!userOutput) {
          userOutput = 'No output'
        }
        
        // Check if test case failed
        if (userOutput !== testCase.output) {
          // Record failed submission
          const timeTaken = Date.now() - startTime
          await api.post('/user/submit', {
            questionId: currentProblem._id,
            code,
            language,
            status: 'failed',
            runtime: timeTaken,
            memory: Math.round(timeTaken / 200),
            testCasesPassed: passedCount,
            totalTestCases: allTestCases.length
          }, { headers })
          
          // Refresh submissions if on submissions tab
          if (problemTabValue === 1) {
            fetchSubmissions()
          }
          
          setFailedTestCase({
            input: testCase.input,
            output: testCase.output,
            userOutput: userOutput,
            passedCount: passedCount,
            totalCount: allTestCases.length
          })
          setIsSubmitting(false)
          return
        }
        
        passedCount++
      }
      
      // All test cases passed
      const timeTaken = Date.now() - startTime
      
      // Record successful submission
      await api.post('/user/submit', {
        questionId: currentProblem._id,
        code,
        language,
        status: 'accepted',
        runtime: timeTaken,
        memory: Math.round(timeTaken / 200),
        testCasesPassed: allTestCases.length,
        totalTestCases: allTestCases.length
      }, { headers })
      
      // Refresh user coins after successful submission
      fetchUserCoins()
      
      // Refresh submissions if on submissions tab
      if (problemTabValue === 1) {
        fetchSubmissions()
      }
      
      setSubmissionResult({
        passed: true,
        totalTests: allTestCases.length,
        timeTaken: timeTaken
      })
      
      const updatedProblems = problems.map((problem, index) => 
        index === currentProblemIndex ? { ...problem, completed: true } : problem
      )
      setProblems(updatedProblems)
      setQuestions(updatedProblems)
      
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canAccessProblem = (index: number): boolean => {
    if (index === 0) return true
    return problems[index - 1].completed
  }

  const handleProblemClick = (index: number) => {
    if (canAccessProblem(index)) {
      setCurrentProblemIndex(index)
      setCode('')
      setOutput('')
      setSubmissionResult(null)
      setFailedTestCase(null)
      setSidebarOpen(false)
      // Clear Monaco Editor
      if (editorRef.current) {
        editorRef.current.setValue('')
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    const container = document.querySelector('[data-split-container]') as HTMLElement
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100
    setSplitPosition(Math.min(Math.max(newPosition, 20), 80))
    
    // Force Monaco Editor to resize during drag
    if (editorRef.current) {
      editorRef.current.layout()
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    // Force Monaco Editor to resize after dragging
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.layout()
      }
    }, 100)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  const handleCompilerMouseDown = (e: React.MouseEvent) => {
    setIsCompilerDragging(true)
    e.preventDefault()
  }

  const handleCompilerMouseMove = (e: MouseEvent) => {
    if (!isCompilerDragging) return
    const container = document.querySelector('[data-compiler-container]') as HTMLElement
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    const newPosition = ((e.clientY - rect.top) / rect.height) * 100
    setCompilerSplit(Math.min(Math.max(newPosition, 20), 85))
    
    // Force Monaco Editor to resize during drag
    if (editorRef.current) {
      editorRef.current.layout()
    }
  }

  const handleCompilerMouseUp = () => {
    setIsCompilerDragging(false)
    // Force Monaco Editor to resize after dragging
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.layout()
      }
    }, 100)
  }

  useEffect(() => {
    if (isCompilerDragging) {
      document.addEventListener('mousemove', handleCompilerMouseMove)
      document.addEventListener('mouseup', handleCompilerMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleCompilerMouseMove)
        document.removeEventListener('mouseup', handleCompilerMouseUp)
      }
    }
  }, [isCompilerDragging])

  // Trigger Monaco Editor resize when compiler split changes
  useEffect(() => {
    if (editorRef.current) {
      setTimeout(() => {
        editorRef.current.layout()
      }, 0)
    }
  }, [compilerSplit])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Typography>Loading questions...</Typography>
      </Box>
    )
  }

  if (!topic || problems.length === 0) {
    if (!isLoggedIn) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h5">Login to view questions</Typography>
          <Button variant="contained" onClick={() => navigate('/login')}>Login</Button>
        </Box>
      )
    }
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5">No questions available</Typography>
        <Typography variant="body1" color="text.secondary">Questions not added yet for this topic</Typography>
        <Button variant="outlined" onClick={() => navigate('/practice')}>Back to Topics</Button>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', userSelect: 'none' }}>
      {/* Sidebar */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        sx={{
          width: sidebarOpen ? 320 : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 320,
            boxSizing: 'border-box',
            position: 'relative'
          }
        }}
      >
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 10 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {topic?.title || 'Topic'}
              </Typography>
              <IconButton 
                onClick={() => setSidebarOpen(false)} 
                sx={{ 
                  p: 1,
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                <Close />
              </IconButton>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(completedCount / problems.length) * 100}
              sx={{ 
                borderRadius: 2, 
                height: 8,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'success.main',
                  borderRadius: 2
                }
              }}
            />
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary', 
                mt: 1.5,
                fontWeight: 500
              }}
            >
              {completedCount}/{problems.length} completed
            </Typography>
          </Box>
        
          <Box sx={{ p: 2 }}>
            {problems.map((problem, index) => (
              <Card 
                key={problem._id}
                sx={{ 
                  mb: 2,
                  cursor: canAccessProblem(index) ? 'pointer' : 'not-allowed',
                  opacity: canAccessProblem(index) ? 1 : 0.6,
                  border: index === currentProblemIndex ? '2px solid' : '1px solid',
                  borderColor: index === currentProblemIndex ? 'primary.main' : 'grey.200',
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: canAccessProblem(index) ? (index === currentProblemIndex ? 'primary.main' : 'primary.300') : 'grey.200',
                    transform: canAccessProblem(index) ? 'translateY(-1px)' : 'none',
                    boxShadow: canAccessProblem(index) ? 2 : 0
                  }
                }}
                onClick={() => handleProblemClick(index)}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {problem.completed && <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />}
                    {!canAccessProblem(index) && <Lock sx={{ color: 'text.disabled', fontSize: 20 }} />}
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: '0.9rem',
                        color: problem.completed ? 'success.dark' : canAccessProblem(index) ? 'text.primary' : 'text.disabled'
                      }}
                    >
                      {index + 1}. {problem.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Chip 
                      label={problem.difficulty} 
                      color={
                        problem.difficulty === 'Easy' ? 'success' :
                        problem.difficulty === 'Medium' ? 'warning' : 'error'
                      } 
                      size="small" 
                    />
                    {problem.points && (
                      <Chip 
                        label={`${problem.points} coins`}
                        sx={{
                          bgcolor: 'warning.100',
                          color: 'warning.800',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                        size="small"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
          {!sidebarOpen && (
            <Button
              variant="contained"
              startIcon={<Menu />}
              onClick={() => setSidebarOpen(true)}
              sx={{ 
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: isDark ? 'black' : 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              Problems
            </Button>
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
            <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              backgroundColor: 'white', 
              borderRadius: 2, 
              px: 2, 
              py: 1
            }}
          >
            <img 
              src={logo} 
              alt="ORCADEHUB" 
              style={{ height: '32px', width: 'auto' }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 900,
                  color: '#6a0dad',
                  fontSize: '1.56rem'
                }}
              >
                ORC
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 900,
                  color: '#2c3e50',
                  fontSize: '1.56rem'
                }}
              >
                ODE
              </Typography>
            </Box>
            <Box sx={{ display: 'none', alignItems: 'center', gap: 1, ml: 2 }}>
              <MonetizationOn sx={{ color: 'warning.main', fontSize: '1.5rem' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {userCoins} ORCS
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {isLoggedIn ? (
            <>
              <Button
                variant="outlined"
                startIcon={<PlayArrow />}
                onClick={handleRunCode}
                disabled={!code.trim() || isRunning}
                sx={{
                  px: 3,
                  py: 1,
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: 2,
                  borderColor: 'primary.300',
                  color: 'primary.600',
                  '&:hover': { 
                    borderColor: 'primary.400',
                    bgcolor: 'primary.50'
                  },
                  '&:disabled': {
                    borderColor: 'grey.300',
                    color: 'grey.400'
                  }
                }}
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitSolution}
                disabled={!code.trim() || isSubmitting}
                sx={{
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: isDark ? 'black' : 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&:disabled': {
                    bgcolor: 'grey.300',
                    color: 'black'
                  }
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: isDark ? 'black' : 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              Login to Code
            </Button>
          )}
          
          <IconButton
            onClick={toggleTheme}
            sx={{ 
              p: 1.5,
              borderRadius: 2,
              color: isDark ? 'white' : 'text.primary',
              '&:hover': { bgcolor: isDark ? 'grey.800' : 'grey.100' }
            }}
          >
            {isDark ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }} data-split-container>
          {/* Problem Statement */}
          <Box sx={{ width: `${splitPosition}%`, borderRight: '1px solid', borderColor: 'divider', overflow: 'auto', height: '100%' }}>
            {submissionResult ? (
              // Show success metrics
              <Box sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'success.main', mb: 1 }}>
                    Accepted!
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    All test cases passed successfully
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {submissionResult.totalTests}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Test Cases
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {submissionResult.timeTaken}ms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Runtime
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      {submissionResult.timeTaken < 1000 ? Math.max(1, Math.round(submissionResult.timeTaken / 200)) : Math.round(submissionResult.timeTaken / 1000)}MB
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Memory
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="large"
                    sx={{ 
                      px: 4, 
                      py: 1.5, 
                      fontWeight: 500,
                      textTransform: 'none',
                      borderRadius: 2
                    }}
                    onClick={() => setSubmissionResult(null)}
                  >
                    View Problem
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large"
                    sx={{ 
                      px: 4, 
                      py: 1.5, 
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 2,
                      bgcolor: 'success.main',
                      '&:hover': { bgcolor: 'success.dark' }
                    }}
                    onClick={() => {
                      if (currentProblemIndex < problems.length - 1) {
                        setCurrentProblemIndex(currentProblemIndex + 1)
                        setCode('')
                        setOutput('')
                        setSubmissionResult(null)
                        if (editorRef.current) {
                          editorRef.current.setValue('')
                        }
                      } else {
                        navigate('/practice')
                      }
                    }}
                  >
                    {currentProblemIndex < problems.length - 1 ? 'Next Problem' : 'Finish'}
                  </Button>
                </Box>
              </Box>
            ) : failedTestCase ? (
              // Show failed test case
              <Box sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Close sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'error.main', mb: 1 }}>
                    Wrong Answer
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {failedTestCase.passedCount}/{failedTestCase.totalCount} test cases passed
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'grid', gap: 3, mb: 4 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                      Input
                    </Typography>
                    <Box sx={{ 
                      bgcolor: isDark ? 'grey.900' : 'grey.100', 
                      p: 3, 
                      borderRadius: 2, 
                      fontFamily: 'monospace',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}>
                      {failedTestCase.input}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
                      Your Output
                    </Typography>
                    <Box sx={{ 
                      bgcolor: isDark ? 'grey.900' : 'grey.100', 
                      p: 3, 
                      borderRadius: 2, 
                      fontFamily: 'monospace',
                      border: '2px solid',
                      borderColor: 'error.main',
                      whiteSpace: 'pre-line'
                    }}>
                      {failedTestCase.userOutput}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
                      Expected Output
                    </Typography>
                    <Box sx={{ 
                      bgcolor: isDark ? 'grey.900' : 'grey.100', 
                      p: 3, 
                      borderRadius: 2, 
                      fontFamily: 'monospace',
                      border: '2px solid',
                      borderColor: 'success.main'
                    }}>
                      {failedTestCase.output}
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    size="large"
                    sx={{ 
                      px: 4, 
                      py: 1.5, 
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 2
                    }}
                    onClick={() => setFailedTestCase(null)}
                  >
                    Try Again
                  </Button>
                </Box>
              </Box>
            ) : (
              // Show normal problem statement
              <Box>
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 10 }}>
                  <Tabs 
                    value={problemTabValue} 
                    onChange={(e, newValue) => {
                      setProblemTabValue(newValue)
                      if (newValue === 1 && currentProblem && isLoggedIn) {
                        fetchSubmissions()
                      }
                    }}
                    sx={{ 
                      '& .MuiTabs-indicator': {
                        height: 4,
                        borderRadius: '4px 4px 0 0'
                      },
                      '& .MuiTab-root': {
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        minHeight: 64,
                        px: 4,
                        py: 2
                      }
                    }}
                  >
                    <Tab 
                      label="Problem" 
                      sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        minHeight: 64,
                        px: 4,
                        py: 2
                      }}
                    />
                    <Tab 
                      label="Submissions" 
                      sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        minHeight: 64,
                        px: 4,
                        py: 2
                      }}
                    />
                  </Tabs>
                </Box>
                
                {problemTabValue === 0 ? (
                  // Problem Statement Tab
                  <Box sx={{ p: 3, pb: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Code sx={{ color: 'primary.main' }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {currentProblem.title}
                  </Typography>
                  {currentProblem.completed && (
                    <Chip label="Completed" color="success" size="small" />
                  )}
                  {currentProblem.points && (
                    <Chip 
                      label={`${currentProblem.points} coins`}
                      sx={{
                        bgcolor: 'warning.100',
                        color: 'warning.800',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}
                      size="medium"
                    />
                  )}
                </Box>
                
                {/* Description */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                    {currentProblem.description}
                  </Typography>
                </Box>

                {/* Constraints */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                    Constraints
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {currentProblem.constraints.map((constraint, index) => (
                      <Typography component="li" key={index} variant="body2" sx={{ mb: 0.5 }}>
                        {constraint}
                      </Typography>
                    ))}
                  </Box>
                </Box>

                {/* Example */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                    Example
                  </Typography>
                  <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1, mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Input:
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {currentProblem.example.input}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Output:
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {currentProblem.example.output}
                    </Typography>
                  </Box>
                </Box>

                {/* Explanation */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                    Explanation
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                    {currentProblem.explanation}
                  </Typography>
                </Box>

                {/* Sample Input/Output */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                    Sample Input/Output
                  </Typography>
                  {currentProblem.testCases.public.map((testCase, index) => (
                    <Box key={index} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        Sample {index + 1}:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>Input:</Typography>
                          <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', p: 1, borderRadius: 0.5, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {testCase.input}
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>Output:</Typography>
                          <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', p: 1, borderRadius: 0.5, fontFamily: 'monospace' }}>
                            {testCase.output}
                          </Box>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        {testCase.explanation}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                  </Box>
                ) : (
                  // Submissions Tab
                  <Box sx={{ p: 3, pb: 12 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                      Your Submissions
                    </Typography>
                    
                    {loadingSubmissions ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          Loading submissions...
                        </Typography>
                      </Box>
                    ) : submissions.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <BugReport sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          No submissions yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Submit your first solution to see it here
                        </Typography>
                      </Box>
                    ) : (
                      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1, bgcolor: 'background.paper' }}>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: isDark ? 'grey.800' : 'grey.50' }}>
                              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Status</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Language</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Runtime</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Memory</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Test Cases</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Submitted</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {submissions.map((submission, index) => (
                              <TableRow 
                                key={index}
                                sx={{ 
                                  '&:hover': { bgcolor: isDark ? 'grey.800' : 'grey.50' },
                                  cursor: 'pointer',
                                  bgcolor: 'background.paper'
                                }}
                                onClick={() => {
                                  setSelectedSubmission(submission)
                                  setCodeModalOpen(true)
                                }}
                              >
                                <TableCell>
                                  <Chip 
                                    label={submission.status === 'accepted' ? 'Accepted' : 'Failed'}
                                    color={submission.status === 'accepted' ? 'success' : 'error'}
                                    size="small"
                                    sx={{ fontWeight: 600 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={submission.language.toUpperCase()}
                                    variant="outlined"
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.primary">
                                      {submission.runtime}ms
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Memory sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.primary">
                                      {submission.memory}MB
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.primary">
                                    {submission.testCasesPassed}/{submission.totalTestCases}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {new Date(submission.submittedAt).toLocaleString()}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Resizable Divider */}
          <Box
            sx={{
              width: '4px',
              cursor: 'col-resize',
              bgcolor: isDark ? '#f39c12' : '#6a0dad',
              '&:hover': {
                bgcolor: isDark ? '#e67e22' : '#5a0b9a'
              }
            }}
            onMouseDown={handleMouseDown}
          />

          {/* Compiler */}
          <Box sx={{ 
            width: isFullscreen ? '100%' : `${100 - splitPosition}%`, 
            display: 'flex', 
            flexDirection: 'column',
            position: isFullscreen ? 'fixed' : 'relative',
            top: isFullscreen ? 0 : 'auto',
            left: isFullscreen ? 0 : 'auto',
            right: isFullscreen ? 0 : 'auto',
            bottom: isFullscreen ? 0 : 'auto',
            zIndex: isFullscreen ? 1000 : 'auto',
            bgcolor: 'background.paper'
          }} data-compiler-container>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {isFullscreen && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      backgroundColor: 'white', 
                      borderRadius: 2, 
                      px: 2, 
                      py: 1
                    }}
                  >
                  <img 
                    src={logo} 
                    alt="ORCADEHUB" 
                    style={{ height: '28px', width: 'auto' }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 900,
                        color: '#6a0dad',
                        fontSize: '1.365rem'
                      }}
                    >
                      ORC
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 900,
                        color: '#2c3e50',
                        fontSize: '1.365rem'
                      }}
                    >
                      ODE
                    </Typography>
                  </Box>
                </Box>
              )}
              {!isFullscreen && language && (
                <>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={language}
                      label="Language"
                      onChange={(e) => {
                        const newLang = e.target.value
                        setLanguage(newLang)
                        setCode(getLanguageTemplate(newLang))
                      }}
                    >
                      <MenuItem value="python">Python</MenuItem>
                      <MenuItem value="cpp">C++</MenuItem>
                      <MenuItem value="java">Java</MenuItem>
                      <MenuItem value="c">C</MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton 
                      size="small"
                      onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                      sx={{ color: 'text.secondary' }}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center', color: 'text.secondary' }}>
                      {fontSize}px
                    </Typography>
                    <IconButton 
                      size="small"
                      onClick={() => setFontSize(Math.min(50, fontSize + 2))}
                      sx={{ color: 'text.secondary' }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                </>
              )}
              {!isFullscreen && !language && (
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={language}
                    label="Language"
                    onChange={(e) => {
                      const newLang = e.target.value
                      setLanguage(newLang)
                    }}
                  >
                    <MenuItem value="python">Python</MenuItem>
                    <MenuItem value="cpp">C++</MenuItem>
                    <MenuItem value="java">Java</MenuItem>
                    <MenuItem value="c">C</MenuItem>
                  </Select>
                </FormControl>
              )}
              {isFullscreen && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton 
                    size="small"
                    onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                    sx={{ color: 'text.secondary' }}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                  <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center', color: 'text.secondary' }}>
                    {fontSize}px
                  </Typography>
                  <IconButton 
                    size="small"
                    onClick={() => setFontSize(Math.min(50, fontSize + 2))}
                    sx={{ color: 'text.secondary' }}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<PlayArrow />}
                  onClick={handleRunCode}
                  disabled={!code.trim() || isRunning}
                  size={isFullscreen ? "large" : "small"}
                  sx={{
                    display: isFullscreen && isLoggedIn ? 'flex' : 'none',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderRadius: 1,
                    px: isFullscreen ? 4 : 2,
                    py: isFullscreen ? 1.5 : 1
                  }}
                >
                  {isRunning ? 'Running...' : 'Run'}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmitSolution}
                  disabled={!code.trim() || isSubmitting}
                  size={isFullscreen ? "large" : "small"}
                  sx={{
                    display: isFullscreen && isLoggedIn ? 'flex' : 'none',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    color: isDark ? 'black' : 'white',
                    px: isFullscreen ? 4 : 2,
                    py: isFullscreen ? 1.5 : 1,
                    '&:disabled': {
                      bgcolor: 'grey.300',
                      color: 'black'
                    }
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                  size={isFullscreen ? "large" : "small"}
                  sx={{
                    display: isFullscreen && !isLoggedIn ? 'flex' : 'none',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    color: isDark ? 'black' : 'white',
                    px: isFullscreen ? 4 : 2,
                    py: isFullscreen ? 1.5 : 1
                  }}
                >
                  Login to Code
                </Button>

                <IconButton 
                  size="medium"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  sx={{ 
                    color: 'text.secondary',
                    display: language ? 'flex' : 'none'
                  }}
                >
                  {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Box>
            </Box>
            
            {/* Code Editor Section */}
            <Box sx={{ height: isFullscreen && hideTestCases ? '100%' : `${compilerSplit}%`, display: 'flex', flexDirection: 'column', borderBottom: '1px solid', borderColor: 'divider', position: 'relative', zIndex: 1 }}>
              <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {language ? (
                  <Box 
                    ref={monacoEl}
                    sx={{ 
                      flexGrow: 1,
                      minHeight: 0,
                      maxHeight: '100%',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      overflow: 'hidden',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                ) : (
                  <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 2
                  }}>
                    <Typography variant="h6" color="text.secondary">
                      Please select a programming language to start coding
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            
            {/* Resizable Divider */}
            {!(isFullscreen && hideTestCases) && (
              <Box
                sx={{
                  height: '4px',
                  cursor: 'row-resize',
                  bgcolor: isDark ? '#f39c12' : '#6a0dad',
                  position: 'relative',
                  zIndex: 200,
                  '&:hover': {
                    bgcolor: isDark ? '#e67e22' : '#5a0b9a'
                  }
                }}
                onMouseDown={handleCompilerMouseDown}
              />
            )}
            
            {/* Test Cases Section */}
            {!(isFullscreen && hideTestCases) && (
              <Box sx={{ height: `${100 - compilerSplit}%`, display: 'flex', flexDirection: 'column', zIndex: 100, position: 'relative', bgcolor: 'background.paper', minHeight: 0 }}>
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  {!(submissionResult || failedTestCase) ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Tabs 
                        value={tabValue} 
                        onChange={(e, newValue) => setTabValue(newValue)} 
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ 
                          '& .MuiTabs-indicator': {
                            height: 4,
                            borderRadius: '4px 4px 0 0'
                          },
                          '& .MuiTab-root': {
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            minHeight: 64,
                            px: 4,
                            py: 2
                          }
                        }}
                      >
                        {currentProblem.testCases.public.map((testCase, index) => {
                          const hasUserOutput = testCase.userOutput !== undefined
                          const isPassed = hasUserOutput && testCase.userOutput === testCase.output
                          const isFailed = hasUserOutput && testCase.userOutput !== testCase.output
                          
                          return (
                            <Tab 
                              key={index} 
                              label={`Test Case ${index + 1}`}
                              sx={{
                                fontWeight: 600,
                                textTransform: 'none',
                                minHeight: 48,
                                color: isFailed ? 'error.main' : isPassed ? 'success.main' : 'text.primary',
                                '&.Mui-selected': {
                                  color: isFailed ? 'error.main' : isPassed ? 'success.main' : 'primary.main'
                                },
                                '&:hover': {
                                  bgcolor: 'action.hover'
                                }
                              }}
                            />
                          )
                        })}
                      </Tabs>
                      <Button
                        startIcon={<VisibilityOff />}
                        onClick={() => setHideTestCases(true)}
                        sx={{
                          mr: 2,
                          textTransform: 'none',
                          color: 'text.secondary',
                          fontWeight: 500,
                          display: isFullscreen ? 'flex' : 'none',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        Hide testcases
                      </Button>
                    </Box>
                  ) : !isFullscreen ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Tabs 
                        value={tabValue} 
                        onChange={(e, newValue) => setTabValue(newValue)} 
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ 
                          '& .MuiTabs-indicator': {
                            height: 4,
                            borderRadius: '4px 4px 0 0'
                          },
                          '& .MuiTab-root': {
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            minHeight: 64,
                            px: 4,
                            py: 2
                          }
                        }}
                      >
                        {currentProblem.testCases.public.map((testCase, index) => {
                          const hasUserOutput = testCase.userOutput !== undefined
                          const isPassed = hasUserOutput && testCase.userOutput === testCase.output
                          const isFailed = hasUserOutput && testCase.userOutput !== testCase.output
                          
                          return (
                            <Tab 
                              key={index} 
                              label={`Test Case ${index + 1}`}
                              sx={{
                                fontWeight: 600,
                                textTransform: 'none',
                                minHeight: 48,
                                color: isFailed ? 'error.main' : isPassed ? 'success.main' : 'text.primary',
                                '&.Mui-selected': {
                                  color: isFailed ? 'error.main' : isPassed ? 'success.main' : 'primary.main'
                                },
                                '&:hover': {
                                  bgcolor: 'action.hover'
                                }
                              }}
                            />
                          )
                        })}
                      </Tabs>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
                      <Button
                        startIcon={<VisibilityOff />}
                        onClick={() => setHideTestCases(true)}
                        sx={{
                          textTransform: 'none',
                          color: 'text.secondary',
                          fontWeight: 500,
                          display: 'none',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        Hide testcases
                      </Button>
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ p: 3, flexGrow: 1, overflow: 'auto', pb: 8 }}>
                  {isFullscreen && (submissionResult || failedTestCase) ? (
                    // Show submission results in fullscreen mode
                    submissionResult ? (
                      // Show success metrics
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                            All Test Cases Passed!
                          </Typography>
                          {isFullscreen && (
                            <Button
                              startIcon={<VisibilityOff />}
                              onClick={() => setHideTestCases(true)}
                              sx={{
                                ml: 'auto',
                                textTransform: 'none',
                                color: 'text.secondary',
                                fontWeight: 500,
                                '&:hover': {
                                  bgcolor: 'action.hover'
                                }
                              }}
                            >
                              Hide testcases
                            </Button>
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3, mb: 4 }}>
                          <Card sx={{ 
                            p: 3, 
                            bgcolor: 'background.paper',
                            borderRadius: 3,
                            boxShadow: 3,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}>
                            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Test Cases</Typography>
                                <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
                              </Box>
                              <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, fontSize: '2.5rem', color: 'text.primary' }}>
                                {submissionResult.totalTests}/{submissionResult.totalTests}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>All Passed</Typography>
                            </CardContent>
                          </Card>
                          
                          <Card sx={{ 
                            p: 3, 
                            bgcolor: 'background.paper',
                            borderRadius: 3,
                            boxShadow: 3,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}>
                            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Runtime</Typography>
                                <Box sx={{ 
                                  width: 48, 
                                  height: 48, 
                                  borderRadius: '50%', 
                                  bgcolor: 'primary.main', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center' 
                                }}>
                                  <Speed sx={{ fontSize: 28, color: 'primary.contrastText' }} />
                                </Box>
                              </Box>
                              <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, fontSize: '2.5rem', color: 'text.primary' }}>
                                {submissionResult.timeTaken}ms
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>Lightning Fast</Typography>
                            </CardContent>
                          </Card>
                          
                          <Card sx={{ 
                            p: 3, 
                            bgcolor: 'background.paper',
                            borderRadius: 3,
                            boxShadow: 3,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}>
                            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Complexity</Typography>
                                <Box sx={{ 
                                  width: 48, 
                                  height: 48, 
                                  borderRadius: '50%', 
                                  bgcolor: 'warning.main', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center' 
                                }}>
                                  <TrendingUp sx={{ fontSize: 28, color: 'warning.contrastText' }} />
                                </Box>
                              </Box>
                              <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, fontSize: '2.5rem', color: 'text.primary' }}>
                                O(1)
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 500 }}>Time Complexity</Typography>
                            </CardContent>
                          </Card>
                          
                          <Card sx={{ 
                            p: 3, 
                            bgcolor: 'background.paper',
                            borderRadius: 3,
                            boxShadow: 3,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}>
                            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Memory</Typography>
                                <Box sx={{ 
                                  width: 48, 
                                  height: 48, 
                                  borderRadius: '50%', 
                                  bgcolor: 'secondary.main', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center' 
                                }}>
                                  <Memory sx={{ fontSize: 28, color: 'secondary.contrastText' }} />
                                </Box>
                              </Box>
                              <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, fontSize: '2.5rem', color: 'text.primary' }}>
                                {submissionResult.timeTaken < 1000 ? Math.max(1, Math.round(submissionResult.timeTaken / 200)) : Math.round(submissionResult.timeTaken / 1000)}MB
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'secondary.main', fontWeight: 500 }}>Peak Usage</Typography>
                            </CardContent>
                          </Card>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Button 
                            variant="outlined" 
                            size="large"
                            sx={{ 
                              px: 4, 
                              py: 1.5, 
                              fontWeight: 500,
                              textTransform: 'none',
                              borderRadius: 2,
                              borderColor: 'grey.300',
                              color: 'grey.700',
                              '&:hover': { 
                                borderColor: 'grey.400',
                                bgcolor: 'grey.50'
                              }
                            }}
                            onClick={() => setSubmissionResult(null)}
                          >
                            View Problem Again
                          </Button>
                          <Button 
                            variant="contained" 
                            size="large"
                            sx={{ 
                              px: 4, 
                              py: 1.5, 
                              fontWeight: 600,
                              textTransform: 'none',
                              borderRadius: 2,
                              bgcolor: 'success.main',
                              '&:hover': { bgcolor: 'success.dark' }
                            }}
                            onClick={() => {
                              if (currentProblemIndex < problems.length - 1) {
                                setCurrentProblemIndex(currentProblemIndex + 1)
                                setCode('')
                                setOutput('')
                                setSubmissionResult(null)
                                // Clear Monaco Editor
                                if (editorRef.current) {
                                  editorRef.current.setValue('')
                                }
                              } else {
                                navigate('/practice')
                              }
                            }}
                          >
                            {currentProblemIndex < problems.length - 1 ? 'Next Problem' : 'Finish'}
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      // Show failed test case
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, p: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                          <Button 
                            variant="outlined" 
                            startIcon={<ArrowBack />}
                            sx={{
                              px: 3,
                              py: 1,
                              fontWeight: 500,
                              textTransform: 'none',
                              borderRadius: 2,
                              borderColor: 'grey.300',
                              color: 'text.primary',
                              '&:hover': { 
                                borderColor: 'grey.400',
                                bgcolor: 'action.hover'
                              }
                            }}
                            onClick={() => setFailedTestCase(null)}
                          >
                            Back to Problem
                          </Button>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                            Test Case Failed
                          </Typography>
                          <Chip 
                            label={`${failedTestCase.passedCount}/${failedTestCase.totalCount} Passed`} 
                            sx={{
                              bgcolor: failedTestCase.passedCount > 0 ? 'warning.100' : 'error.100',
                              color: failedTestCase.passedCount > 0 ? 'warning.800' : 'error.800',
                              fontWeight: 600,
                              fontSize: '0.875rem'
                            }}
                          />
                          {isFullscreen && (
                            <Button
                              startIcon={<VisibilityOff />}
                              onClick={() => setHideTestCases(true)}
                              sx={{
                                ml: 'auto',
                                textTransform: 'none',
                                color: 'text.secondary',
                                fontWeight: 500,
                                '&:hover': {
                                  bgcolor: 'action.hover'
                                }
                              }}
                            >
                              Hide testcases
                            </Button>
                          )}
                        </Box>
                        
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                            Input:
                          </Typography>
                          <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {failedTestCase.input}
                          </Box>
                        </Box>
                        
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
                            Your Output:
                          </Typography>
                          <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'error.main', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
                            {failedTestCase.userOutput}
                          </Box>
                        </Box>
                        
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
                            Expected Output:
                          </Typography>
                          <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'success.main', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
                            {failedTestCase.output}
                          </Box>
                        </Box>
                      </Box>
                    )
                  ) : (
                    // Show normal test case content
                    currentProblem.testCases.public[tabValue] && (
                      <Box>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                            Input
                          </Typography>
                          <Box sx={{ 
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider',
                            p: 2.5,
                            borderRadius: 2,
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            fontSize: '0.9rem'
                          }}>
                            {currentProblem.testCases.public[tabValue].input}
                          </Box>
                        </Box>
                        
                        {currentProblem.testCases.public[tabValue].userOutput && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                              Your Output
                            </Typography>
                            <Box sx={{ 
                              bgcolor: 'background.default',
                              border: '2px solid',
                              borderColor: currentProblem.testCases.public[tabValue].userOutput === currentProblem.testCases.public[tabValue].output ? 'success.main' : 'error.main',
                              p: 2.5,
                              borderRadius: 2,
                              fontFamily: 'monospace',
                              fontSize: '0.9rem'
                            }}>
                              {currentProblem.testCases.public[tabValue].userOutput}
                            </Box>
                          </Box>
                        )}
                        
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                            Expected Output
                          </Typography>
                          <Box sx={{ 
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider',
                            p: 2.5,
                            borderRadius: 2,
                            fontFamily: 'monospace',
                            fontSize: '0.9rem'
                          }}>
                            {currentProblem.testCases.public[tabValue].output}
                          </Box>
                        </Box>
                      </Box>
                    )
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Code Modal */}
      <Dialog 
        open={codeModalOpen} 
        onClose={() => {
          setCodeModalOpen(false)
          setCopied(false)
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Code sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Submitted Code
              </Typography>
              {selectedSubmission && (
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  <Chip 
                    label={selectedSubmission.status === 'accepted' ? 'Accepted' : 'Failed'}
                    color={selectedSubmission.status === 'accepted' ? 'success' : 'error'}
                    size="small"
                  />
                  <Chip 
                    label={selectedSubmission.language.toUpperCase()}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={() => {
              if (selectedSubmission) {
                navigator.clipboard.writeText(selectedSubmission.code)
                setCopied(true)
                toast.success('Code copied to clipboard!')
                setTimeout(() => setCopied(false), 2000)
              }
            }}
            sx={{ color: copied ? 'success.main' : 'text.secondary' }}
          >
            {copied ? <Check /> : <ContentCopy />}
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedSubmission && (
            <Box sx={{ 
              bgcolor: isDark ? 'grey.900' : 'grey.50',
              p: 3,
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
              maxHeight: '60vh',
              color: 'text.primary'
            }}>
              {selectedSubmission.code}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => {
              setCodeModalOpen(false)
              setCopied(false)
            }}
            sx={{ textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Copy Attempt Warning Modal */}
      <Dialog 
        open={copyAttemptModal} 
        onClose={() => setCopyAttemptModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '2px solid #ff4444'
          }
        }}
      >
        <DialogContent sx={{ p: 0, textAlign: 'center' }}>
          <Box sx={{ 
            bgcolor: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
            background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
            color: 'white',
            p: 4,
            borderRadius: '12px 12px 0 0'
          }}>
            <Typography variant="h2" sx={{ fontSize: '4rem', mb: 1 }}>🚫</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              COPY/PASTE BLOCKED
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Nice try, but we're watching! 👀
            </Typography>
          </Box>
          
          <Box sx={{ p: 4, bgcolor: 'background.paper' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
              Seriously? Trying to cheat already? 🤔
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.6 }}>
              Copy-paste is for recipes, not for coding skills! This is your chance to actually learn something. 
              Stop looking for shortcuts and start building your brain muscles! 💪
            </Typography>
            <Box sx={{ 
              bgcolor: isDark ? 'grey.900' : 'grey.50', 
              p: 3, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                "The only way to learn programming is to program. Copying code is like trying to learn swimming by watching YouTube." 🏊‍♂️
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          justifyContent: 'center', 
          p: 3, 
          bgcolor: 'background.paper',
          borderRadius: '0 0 12px 12px'
        }}>
          <Button 
            onClick={() => setCopyAttemptModal(false)}
            variant="contained"
            size="large"
            sx={{ 
              px: 6, 
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              bgcolor: '#ff4444',
              '&:hover': { bgcolor: '#cc0000' }
            }}
          >
            Fine, I'll Code Properly! 😤
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Test Cases Toggle Button - Bottom Right */}
      {isFullscreen && hideTestCases && (
        <Button
          variant="contained"
          startIcon={<Quiz />}
          onClick={() => setHideTestCases(false)}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1001,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Test Cases
        </Button>
      )}
    </Box>
  )
}

export default TopicProblems