import React, { useState, useEffect } from 'react'
import { Container, Typography, Box, Card, CardContent, Button, Chip, LinearProgress } from '@mui/material'
import { Lock, CheckCircle, PlayArrow, MonetizationOn } from '@mui/icons-material'
import { useNavigate } from '../lib/router'
import ModeratorPractice from './ModeratorPractice'
import axios from 'axios'

// Configure axios base URL
const apiBaseUrl = import.meta.env.MODE === 'production' 
  ? import.meta.env.VITE_API_BASE_URL_PROD 
  : import.meta.env.VITE_API_BASE_URL
axios.defaults.baseURL = apiBaseUrl

interface Question {
  _id: string
  title: string
  description: string
  difficulty: string
  completed?: boolean
}

interface Topic {
  _id: string
  title: string
  description: string
  difficulty: string
  order: number
  questions?: Question[]
  completed: boolean
  unlocked: boolean
}

const Practice: React.FC = () => {
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState<string>('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [userCoins, setUserCoins] = useState(0)
  
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }
  
  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setUserRole(userData.role || 'student')
    }
    fetchTopics()
    fetchUserCoins()
  }, [])
  
  const fetchUserCoins = async () => {
    try {
      const response = await axios.get('/user/progress', { headers })
      setUserCoins(response.data.totalCoins || 0)
    } catch (error) {
      console.error('Error fetching user coins:', error)
    }
  }
  
  const fetchTopics = async () => {
    try {
      const response = await axios.get('/moderator/topics', { headers })
      
      // Fetch user progress to mark completed questions
      let completedQuestionIds: string[] = []
      try {
        const progressResponse = await axios.get('/user/progress', { headers })
        completedQuestionIds = progressResponse.data.completedQuestions?.map((q: any) => 
          typeof q === 'string' ? q : q._id
        ) || []
      } catch (error) {
        console.error('Error fetching user progress:', error)
      }
      
      const topicsData = response.data.map((topic: any, index: number) => ({
        ...topic,
        questions: [],
        completed: false,
        unlocked: index === 0 // Only first topic unlocked initially
      }))
      setTopics(topicsData)
      
      // Fetch questions for each topic and update unlock status
      for (let i = 0; i < topicsData.length; i++) {
        await fetchQuestionsForTopic(topicsData[i]._id, completedQuestionIds, i)
      }
    } catch (error) {
      console.error('Error fetching topics:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchQuestionsForTopic = async (topicId: string, completedQuestionIds: string[], topicIndex: number) => {
    try {
      const response = await axios.get(`/moderator/topics/${topicId}/questions`, { headers })
      const questionsWithCompletion = response.data.map((q: any) => ({
        ...q,
        completed: completedQuestionIds.includes(q._id)
      }))
      
      const completedCount = questionsWithCompletion.filter((q: any) => q.completed).length
      const totalCount = questionsWithCompletion.length
      const isTopicCompleted = totalCount > 0 && completedCount === totalCount
      
      setTopics(prev => prev.map((topic, index) => {
        if (topic._id === topicId) {
          return {
            ...topic,
            questions: questionsWithCompletion,
            completed: isTopicCompleted
          }
        }
        // Unlock next topic if current topic is completed
        if (index === topicIndex + 1 && isTopicCompleted) {
          return { ...topic, unlocked: true }
        }
        return topic
      }))
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }
  
  // Show moderator practice page if user is moderator
  if (userRole === 'moderator') {
    return <ModeratorPractice />
  }

  const getCompletedCount = (topic: Topic): number => {
    return topic.questions?.filter(q => q.completed).length || 0
  }

  const handleTopicClick = (topic: Topic) => {
    if (!topic.unlocked) return
    navigate(`/practice/topic/${topic._id}`)
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Typography>Loading topics...</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Practice Topics
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
          Complete topics sequentially to unlock new challenges
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <MonetizationOn sx={{ color: 'warning.main', fontSize: '1.5rem' }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
            {userCoins} ORCS
          </Typography>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)'
        },
        gap: 3
      }}>
        {topics.map((topic) => {
          const completedCount = getCompletedCount(topic)
          const totalCount = topic.questions?.length || 0
          const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

          return (
            <Card 
              key={topic._id}
              sx={{ 
                borderRadius: 3,
                cursor: topic.unlocked ? 'pointer' : 'not-allowed',
                opacity: topic.unlocked ? 1 : 0.6,
                border: topic.completed ? '2px solid' : '1px solid',
                borderColor: topic.completed ? 'success.main' : 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': topic.unlocked ? { 
                  boxShadow: 6,
                  transform: 'translateY(-4px)'
                } : {}
              }}
              onClick={() => handleTopicClick(topic)}
            >
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Chip 
                    label={topic.difficulty} 
                    color={
                      topic.difficulty === 'Easy' ? 'success' :
                      topic.difficulty === 'Medium' ? 'warning' : 'error'
                    } 
                    size="small" 
                  />
                  <Box>
                    {!topic.unlocked && <Lock sx={{ color: 'text.secondary', fontSize: 24 }} />}
                    {topic.completed && <CheckCircle sx={{ color: 'success.main', fontSize: 24 }} />}
                    {topic.unlocked && !topic.completed && <PlayArrow sx={{ color: 'primary.main', fontSize: 24 }} />}
                  </Box>
                </Box>
                
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, minHeight: '3rem', display: 'flex', alignItems: 'center' }}>
                  {topic.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1, lineHeight: 1.5 }}>
                  {topic.description}
                </Typography>
                
                <Box sx={{ mt: 'auto' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress}
                    sx={{ borderRadius: 1, height: 8, mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {completedCount}/{totalCount} problems completed
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )
        })}
      </Box>
    </Container>
  )
}

export default Practice