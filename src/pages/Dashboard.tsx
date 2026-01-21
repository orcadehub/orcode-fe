import React, { useEffect, useState } from 'react'
import { Container, Typography, Box, Card, CardContent, Grid, Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, LinearProgress, IconButton, Snackbar, Alert } from '@mui/material'
import { Code, TrendingUp, EmojiEvents, MonetizationOn, AccessTime, CheckCircle, Person, Timeline, Share, ContentCopy } from '@mui/icons-material'
import { useTheme } from '../lib/ThemeContext'
import { userAPI } from '../lib/api'
import axios from 'axios'

const Dashboard: React.FC = () => {
  const { isDark } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [rank, setRank] = useState<any>(null)
  const [streak, setStreak] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [copySuccess, setCopySuccess] = useState(false)
  
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchDashboardData()
  }, [])
  
  const fetchDashboardData = async () => {
    try {
      const progressResponse = await axios.get('/api/user/progress', { headers })
      setProgress(progressResponse.data)
      
      if (token) {
        const rankResponse = await userAPI.getRank(token)
        setRank(rankResponse.data)
        
        const streakResponse = await userAPI.getStreak(token)
        setStreak(streakResponse.data)
        
        const activitiesResponse = await userAPI.getActivities(token)
        setActivities(activitiesResponse.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
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
  
  const copyProfileUrl = async () => {
    const profileUrl = `${window.location.origin}/profile/${user?.email}`
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopySuccess(true)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }
  
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3, mb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Typography variant="h6" color="text.secondary">Loading dashboard...</Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 6 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
          Welcome back, {user?.firstName}!
        </Typography>
        {user?.role !== 'moderator' && (
          <Typography variant="body1" color="text.secondary">
            Track your progress and achievements
          </Typography>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Stats */}
        <Grid item xs={12} lg={8}>
          {/* Quick Stats - Only for students */}
          {user?.role !== 'moderator' && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}>
                <Card sx={{ 
                  borderRadius: 2, 
                  border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 2 }
                }}>
                  <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                    <Code sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {progress?.questionsCompleted || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Solved
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Card sx={{ 
                  borderRadius: 2, 
                  border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 2 }
                }}>
                  <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {progress?.accuracy || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Accuracy
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Card sx={{ 
                  borderRadius: 2, 
                  border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 2 }
                }}>
                  <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                    <TrendingUp sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {streak?.currentStreak || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Streak
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Card sx={{ 
                  borderRadius: 2, 
                  border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 2 }
                }}>
                  <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                    <MonetizationOn sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {progress?.totalCoins || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Orcs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Recent Activity */}
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
            boxShadow: 'none'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Timeline sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Activity
                </Typography>
              </Box>
              
              {activities.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent activity
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, border: 'none', pb: 1 }}>Problem</TableCell>
                          <TableCell sx={{ fontWeight: 600, border: 'none', pb: 1 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600, border: 'none', pb: 1 }}>Time</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activities
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((activity, index) => (
                          <TableRow key={index} sx={{ 
                            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' },
                            '&:last-child td': { border: 'none' }
                          }}>
                            <TableCell sx={{ border: 'none', py: 1.5 }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {activity.type === 'moderator_action' ? activity.action : activity.questionTitle}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {activity.type === 'moderator_action' ? activity.description : `${activity.topicTitle} • ${activity.difficulty}`}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ border: 'none', py: 1.5 }}>
                              <Chip 
                                label={activity.type === 'moderator_action' ? 'Action' : activity.status} 
                                size="small"
                                color={activity.type === 'moderator_action' ? 'primary' : (activity.status === 'Solved' ? 'success' : 'default')}
                                sx={{ fontSize: '0.75rem' }}
                              />
                            </TableCell>
                            <TableCell sx={{ border: 'none', py: 1.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {getTimeAgo(activity.createdAt)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <TablePagination
                    component="div"
                    count={activities.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10))
                      setPage(0)
                    }}
                    rowsPerPageOptions={[5, 10]}
                    sx={{ borderTop: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, mt: 2, pt: 2 }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Profile & Progress */}
        <Grid item xs={12} lg={4}>
          {/* Profile Card */}
          <Card sx={{ 
            mb: 3,
            borderRadius: 2, 
            border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
            boxShadow: 'none'
          }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <IconButton 
                  onClick={copyProfileUrl}
                  sx={{ 
                    position: 'absolute', 
                    top: -8, 
                    right: -8,
                    bgcolor: isDark ? 'grey.700' : 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: isDark ? 'grey.600' : 'primary.dark' },
                    width: 32,
                    height: 32
                  }}
                >
                  <ContentCopy sx={{ fontSize: 16 }} />
                </IconButton>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: 'primary.main',
                    fontSize: '2rem',
                    fontWeight: 700,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {user?.email}
              </Typography>
              {user?.role !== 'moderator' && (
                <Chip 
                  label={`Rank #${rank?.rank || 'N/A'}`} 
                  color="primary" 
                  sx={{ fontWeight: 600 }}
                />
              )}
              {user?.role === 'moderator' && (
                <Chip 
                  label="Moderator" 
                  color="primary" 
                  sx={{ fontWeight: 600 }}
                />
              )}
            </CardContent>
          </Card>

          {/* Progress Overview - Only for students */}
          {user?.role !== 'moderator' && (
            <Card sx={{ 
              borderRadius: 2, 
              border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
              boxShadow: 'none'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Progress Overview
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Accuracy Rate
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {progress?.accuracy || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress?.accuracy || 0} 
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: `1px solid ${isDark ? '#333' : '#e0e0e0'}` }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Submissions
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {progress?.totalSubmissions || 0}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: `1px solid ${isDark ? '#333' : '#e0e0e0'}` }}>
                  <Typography variant="body2" color="text.secondary">
                    Successful Submissions
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {progress?.successfulSubmissions || 0}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Longest Streak
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {streak?.longestStreak || 0} days
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
      
      <Snackbar 
        open={copySuccess} 
        autoHideDuration={3000} 
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopySuccess(false)} severity="success">
          Profile URL copied to clipboard!
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default Dashboard