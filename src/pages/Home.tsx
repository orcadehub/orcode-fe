import React from 'react'
import { Container, Box, Typography, Button, Grid, Card, CardContent } from '@mui/material'
import { Code, School, TrendingUp } from '@mui/icons-material'
import { useNavigate } from '../lib/router'

const Home: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box textAlign="center" sx={{ mb: 6 }}>
        <Typography variant="h2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
          ConceptPractice
        </Typography>
        <Typography variant="h5" sx={{ color: 'text.secondary', mb: 4 }}>
          Master Programming Concepts Through Practice
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/signup')}
            sx={{ px: 4, py: 1.5, borderRadius: 3 }}
          >
            Get Started
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
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Code sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Practice Coding
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Solve problems and improve your programming skills with hands-on exercises
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <School sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Learn Concepts
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Understand fundamental programming concepts through interactive lessons
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <TrendingUp sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Track Progress
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor your learning journey and see your improvement over time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default Home
