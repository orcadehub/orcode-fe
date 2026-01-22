import React, { useState, useEffect } from 'react'
import { Container, Box, Typography, Button, Grid, Card, CardContent, Chip } from '@mui/material'
import { Code, School, TrendingUp, EmojiEvents, Group, Speed, Toll, Leaderboard } from '@mui/icons-material'
import { useNavigate } from '../lib/router'
import api from '../lib/api'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [totalStudents, setTotalStudents] = useState(0)
  
  useEffect(() => {
    fetchStudentCount()
  }, [])
  
  const fetchStudentCount = async () => {
    try {
      const response = await api.get('/user/student-count-public')
      setTotalStudents(response.data.totalStudents || 0)
    } catch (error) {
      console.error('Error fetching student count:', error)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box textAlign="center" sx={{ mb: 6 }}>
        <Typography variant="h2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
          ORCODE
        </Typography>
        <Typography variant="h5" sx={{ color: 'text.secondary', mb: 2 }}>
          Master Programming Concepts Through Practice
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: 600, mx: 'auto' }}>
          {totalStudents > 0 ? `${totalStudents} students are already ahead of you!` : 'Thousands of students are competing!'} Start your coding journey now, solve problems, earn ORCS, and climb the leaderboard.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/signup')}
            sx={{ px: 4, py: 1.5, borderRadius: 3 }}
          >
            Start Competing
          </Button>
          <Button 
            variant="outlined" 
            size="large"
            onClick={() => navigate('/login')}
            sx={{ px: 4, py: 1.5, borderRadius: 3 }}
          >
            Sign In
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Chip icon={<EmojiEvents />} label="Competitive Programming" variant="outlined" />
          <Chip icon={<Toll />} label="Earn ORCS" variant="outlined" />
          <Chip icon={<Leaderboard />} label="Real-time Leaderboard" variant="outlined" />
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Code sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Solve & Compete
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Challenge yourself with programming problems and compete with students worldwide
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <EmojiEvents sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Earn Rewards
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Collect ORCS for every problem solved and unlock achievements
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <TrendingUp sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Climb Rankings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track your progress and see how you rank against other competitive programmers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default Home
