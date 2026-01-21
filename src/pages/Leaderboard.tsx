import React, { useState, useEffect } from 'react'
import { Container, Typography, Box, Card, CardContent, Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import { EmojiEvents, TrendingUp } from '@mui/icons-material'
import { useTheme } from '../lib/ThemeContext'
import api from '../lib/api'

const Leaderboard: React.FC = () => {
  const { isDark } = useTheme()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/user/leaderboard', { headers })
      setUsers(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'
      case 2: return '#C0C0C0'
      case 3: return '#CD7F32'
      default: return 'text.secondary'
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Typography>Loading leaderboard...</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <EmojiEvents sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Leaderboard
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          Top performers in ORCODE
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3, bgcolor: 'background.paper' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: isDark ? 'grey.800' : 'grey.50' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>Rank</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>Problems Solved</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>Accuracy</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>Points</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, index) => (
              <TableRow 
                key={user._id} 
                sx={{ 
                  '&:hover': { bgcolor: isDark ? 'grey.800' : 'grey.50' },
                  bgcolor: index < 3 ? (isDark ? 'grey.900' : 'grey.100') : 'background.paper',
                  border: index < 3 ? '2px solid' : 'none',
                  borderColor: index < 3 ? getRankColor(index + 1) : 'transparent'
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        color: getRankColor(index + 1),
                        minWidth: 40
                      }}
                    >
                      #{index + 1}
                    </Typography>
                    {index < 3 && <EmojiEvents sx={{ color: getRankColor(index + 1), fontSize: 24 }} />}
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      {user.userId?.firstName?.[0]}{user.userId?.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {user.userId?.firstName} {user.userId?.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.userId?.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {user.questionsCompleted || 0}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Chip 
                    label={`${user.accuracy || 0}%`}
                    color={user.accuracy >= 80 ? 'success' : user.accuracy >= 60 ? 'warning' : 'error'}
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                
                <TableCell>
                  <Chip 
                    label={`${user.totalCoins || 0} pts`}
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  )
}

export default Leaderboard