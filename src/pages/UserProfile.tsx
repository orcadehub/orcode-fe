import React, { useState, useEffect } from 'react'
import { Container, Typography, Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, LinearProgress } from '@mui/material'
import { TrendingUp, CheckCircle, Code, Timer, Memory, EmojiEvents } from '@mui/icons-material'
import api from '../lib/api'

interface UserProgress {
  totalCoins: number
  questionsAttempted: number
  questionsCompleted: number
  totalSubmissions: number
  successfulSubmissions: number
  completedQuestions: Array<{
    _id: string
    title: string
    difficulty: string
    points: number
  }>
  submissions: Array<{
    _id: string
    questionId: {
      _id: string
      title: string
      difficulty: string
      points: number
    }
    language: string
    status: string
    runtime: number
    memory: number
    testCasesPassed: number
    totalTestCases: number
    submittedAt: string
  }>
}

const UserProfile: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }
  
  useEffect(() => {
    fetchUserProgress()
  }, [])
  
  const fetchUserProgress = async () => {
    try {
      const response = await api.get('/user/progress', { headers })
      setProgress(response.data)
    } catch (error) {
      console.error('Error fetching user progress:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Typography>Loading profile...</Typography>
      </Container>
    )
  }
  
  if (!progress) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Typography>No progress data found</Typography>
      </Container>
    )
  }
  
  const successRate = progress.totalSubmissions > 0 ? (progress.successfulSubmissions / progress.totalSubmissions) * 100 : 0
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}>
        User Profile & Statistics
      </Typography>
      
      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 6 }}>
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <CardContent sx={{ p: 0 }}>
            <EmojiEvents sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'warning.main' }}>
              {progress.totalCoins}
            </Typography>
            <Typography variant="body1" color="text.secondary">Total Coins</Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <CardContent sx={{ p: 0 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'success.main' }}>
              {progress.questionsCompleted}
            </Typography>
            <Typography variant="body1" color="text.secondary">Questions Completed</Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <CardContent sx={{ p: 0 }}>
            <Code sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {progress.totalSubmissions}
            </Typography>
            <Typography variant="body1" color="text.secondary">Total Submissions</Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <CardContent sx={{ p: 0 }}>
            <TrendingUp sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'info.main' }}>
              {successRate.toFixed(1)}%
            </Typography>
            <Typography variant="body1" color="text.secondary">Success Rate</Typography>
          </CardContent>
        </Card>
      </Box>
      
      {/* Progress Bar */}
      <Card sx={{ p: 3, mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Overall Progress</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress.questionsAttempted > 0 ? (progress.questionsCompleted / progress.questionsAttempted) * 100 : 0}
              sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
            />
            <Typography variant="body2" color="text.secondary">
              {progress.questionsCompleted}/{progress.questionsAttempted} attempted
            </Typography>
          </Box>
        </CardContent>
      </Card>
      
      {/* Completed Questions */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>Completed Questions</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Question</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Coins Earned</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {progress.completedQuestions.map((question) => (
                  <TableRow key={question._id}>
                    <TableCell>{question.title}</TableCell>
                    <TableCell>
                      <Chip 
                        label={question.difficulty}
                        color={
                          question.difficulty === 'Easy' ? 'success' :
                          question.difficulty === 'Medium' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${question.points} coins`}
                        sx={{ bgcolor: 'warning.100', color: 'warning.800' }}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      {/* Submission History */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>Recent Submissions</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Question</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Runtime</TableCell>
                  <TableCell>Memory</TableCell>
                  <TableCell>Test Cases</TableCell>
                  <TableCell>Submitted</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {progress.submissions.slice(-10).reverse().map((submission) => (
                  <TableRow key={submission._id}>
                    <TableCell>{submission.questionId.title}</TableCell>
                    <TableCell>
                      <Chip label={submission.language.toUpperCase()} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={submission.status}
                        color={submission.status === 'accepted' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timer sx={{ fontSize: 16 }} />
                        {submission.runtime}ms
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Memory sx={{ fontSize: 16 }} />
                        {submission.memory}MB
                      </Box>
                    </TableCell>
                    <TableCell>
                      {submission.testCasesPassed}/{submission.totalTestCases}
                    </TableCell>
                    <TableCell>
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  )
}

export default UserProfile