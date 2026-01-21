import React, { useState, useEffect } from 'react'
import { Container, Box, Typography, Card, CardContent, Button, IconButton, Chip, Dialog, DialogTitle, DialogContent, TextField, Select, MenuItem, FormControl, InputLabel, Grid, Avatar } from '@mui/material'
import { Add, ArrowUpward, ArrowDownward, Topic, Quiz, Settings, Dashboard, Edit } from '@mui/icons-material'
import { useTheme } from '../lib/ThemeContext'
import { useNavigate } from '../lib/router'
import axios from 'axios'

// Configure axios base URL
const apiBaseUrl = import.meta.env.MODE === 'production' 
  ? import.meta.env.VITE_API_BASE_URL_PROD 
  : import.meta.env.VITE_API_BASE_URL
axios.defaults.baseURL = apiBaseUrl

const ModeratorPractice: React.FC = () => {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [topics, setTopics] = useState<any[]>([])
  const [selectedTopic, setSelectedTopic] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [openTopicDialog, setOpenTopicDialog] = useState(false)
  const [topicForm, setTopicForm] = useState({ title: '', description: '', difficulty: 'Easy' })
  const [editingTopic, setEditingTopic] = useState<any>(null)
  const [stats, setStats] = useState({ totalTopics: 0, totalQuestions: 0, totalStudents: 0 })
  const [activities, setActivities] = useState<any[]>([])

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchTopics()
    fetchStats()
    fetchActivities()
  }, [])

  const fetchStats = async () => {
    try {
      const topicsResponse = await axios.get('/moderator/topics', { headers })
      let totalQuestions = 0
      for (const topic of topicsResponse.data) {
        const questionsResponse = await axios.get(`/moderator/topics/${topic._id}/questions`, { headers })
        totalQuestions += questionsResponse.data.length
      }
      setStats({
        totalTopics: topicsResponse.data.length,
        totalQuestions,
        totalStudents: 0 // This would need a separate API endpoint
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await axios.get('/user/activities', { headers })
      setActivities(response.data)
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  const fetchTopics = async () => {
    try {
      const response = await axios.get('/moderator/topics', { headers })
      setTopics(response.data)
    } catch (error) {
      console.error('Error fetching topics:', error)
    }
  }

  const fetchQuestions = async (topicId: string) => {
    try {
      const response = await axios.get(`/moderator/topics/${topicId}/questions`, { headers })
      setQuestions(response.data)
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const handleTopicClick = (topic: any) => {
    setSelectedTopic(topic)
    fetchQuestions(topic._id)
  }

  const createTopic = async () => {
    try {
      if (editingTopic) {
        // Update existing topic
        await axios.put(`/moderator/topics/${editingTopic._id}`, topicForm, { headers })
      } else {
        // Create new topic
        const order = topics.length + 1
        await axios.post('/moderator/topics', { ...topicForm, order }, { headers })
      }
      setOpenTopicDialog(false)
      setTopicForm({ title: '', description: '', difficulty: 'Easy' })
      setEditingTopic(null)
      fetchTopics()
      fetchStats()
      fetchActivities()
    } catch (error) {
      console.error('Error saving topic:', error)
    }
  }

  const handleEditTopic = (topic: any) => {
    setEditingTopic(topic)
    setTopicForm({
      title: topic.title,
      description: topic.description,
      difficulty: topic.difficulty
    })
    setOpenTopicDialog(true)
  }

  const handleAddTopic = () => {
    setEditingTopic(null)
    setTopicForm({ title: '', description: '', difficulty: 'Easy' })
    setOpenTopicDialog(true)
  }

  const moveItem = async (items: any[], index: number, direction: 'up' | 'down', type: 'topic' | 'question') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= items.length) return

    const newItems = [...items]
    const temp = newItems[index].order
    newItems[index].order = newItems[newIndex].order
    newItems[newIndex].order = temp
    
    try {
      if (type === 'topic') {
        await Promise.all([
          axios.put(`/moderator/topics/${newItems[index]._id}`, { order: newItems[index].order }, { headers }),
          axios.put(`/moderator/topics/${newItems[newIndex]._id}`, { order: newItems[newIndex].order }, { headers })
        ])
        fetchTopics()
      } else {
        await Promise.all([
          axios.put(`/moderator/questions/${newItems[index]._id}`, { order: newItems[index].order }, { headers }),
          axios.put(`/moderator/questions/${newItems[newIndex]._id}`, { order: newItems[newIndex].order }, { headers })
        ])
        fetchQuestions(selectedTopic._id)
      }
    } catch (error) {
      console.error('Error reordering items:', error)
    }
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 6 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
          Practice Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage practice topics and questions
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Management */}
        <Grid item xs={12} lg={8}>

          {/* Topics Management */}
          <Card sx={{ 
            mb: 3,
            borderRadius: 2, 
            border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
            boxShadow: 'none'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Topics Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddTopic}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Add Topic
                </Button>
              </Box>
              
              <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {topics.map((topic, index) => (
                  <Card 
                    key={topic._id}
                    sx={{ 
                      mb: 2, 
                      cursor: 'pointer',
                      border: selectedTopic?._id === topic._id ? '2px solid' : '1px solid',
                      borderColor: selectedTopic?._id === topic._id ? 'primary.main' : (isDark ? '#333' : '#e0e0e0'),
                      '&:hover': { borderColor: 'primary.main', boxShadow: 1 },
                      borderRadius: 2
                    }}
                    onClick={() => handleTopicClick(topic)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {topic.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                              label={topic.difficulty} 
                              size="small" 
                              color={topic.difficulty === 'Easy' ? 'success' : topic.difficulty === 'Medium' ? 'warning' : 'error'}
                            />
                            <Chip label={`Order: ${topic.order}`} size="small" variant="outlined" />
                          </Box>
                        </Box>
                        <Box>
                          <IconButton 
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleEditTopic(topic) }}
                            sx={{ mr: 1 }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); moveItem(topics, index, 'up', 'topic') }}
                            disabled={index === 0}
                          >
                            <ArrowUpward />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={(e) => { e.stopPropagation(); moveItem(topics, index, 'down', 'topic') }}
                            disabled={index === topics.length - 1}
                          >
                            <ArrowDownward />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Questions */}
        <Grid item xs={12} lg={4}>

          {/* Questions Panel */}
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
            boxShadow: 'none'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedTopic ? `${selectedTopic.title}` : 'Select a Topic'}
                </Typography>
                {selectedTopic && (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => navigate('/create-question')}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                    size="small"
                  >
                    Add
                  </Button>
                )}
              </Box>
              
              <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {selectedTopic ? (
                  questions.length > 0 ? (
                    questions.map((question, index) => (
                      <Card key={question._id} sx={{ 
                        mb: 2, 
                        border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
                        borderRadius: 2,
                        '&:hover': { boxShadow: 1 }
                      }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ flexGrow: 1, mr: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {question.title}
                              </Typography>
                              <Chip 
                                label={question.difficulty} 
                                size="small" 
                                color={question.difficulty === 'Easy' ? 'success' : question.difficulty === 'Medium' ? 'warning' : 'error'}
                              />
                            </Box>
                            <Box>
                              <IconButton 
                                size="small"
                                onClick={() => moveItem(questions, index, 'up', 'question')}
                                disabled={index === 0}
                              >
                                <ArrowUpward fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small"
                                onClick={() => moveItem(questions, index, 'down', 'question')}
                                disabled={index === questions.length - 1}
                              >
                                <ArrowDownward fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No questions in this topic
                      </Typography>
                    </Box>
                  )
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Select a topic to view questions
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create/Edit Topic Dialog */}
      <Dialog open={openTopicDialog} onClose={() => setOpenTopicDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTopic ? 'Edit Topic' : 'Create New Topic'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={topicForm.title}
            onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={topicForm.description}
            onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={topicForm.difficulty}
              onChange={(e) => setTopicForm({ ...topicForm, difficulty: e.target.value })}
            >
              <MenuItem value="Easy">Easy</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Hard">Hard</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => setOpenTopicDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={createTopic}>
              {editingTopic ? 'Update' : 'Create'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  )
}

export default ModeratorPractice