import React, { useState, useEffect } from 'react'
import { Container, Typography, Box, Card, CardContent, Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Skeleton, Pagination } from '@mui/material'
import { EmojiEvents, TrendingUp } from '@mui/icons-material'
import { useTheme } from '../lib/ThemeContext'
import api from '../lib/api'

const Leaderboard: React.FC = () => {
  const { isDark } = useTheme()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const usersPerPage = 20
  
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/user/leaderboard', { headers })
      const allUsers = Array.isArray(response.data) ? response.data.slice(0, 100) : []
      setUsers(allUsers)
      
      // Find current user's rank
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      const userIndex = allUsers.findIndex(user => user.userId?._id === currentUser.id)
      if (userIndex !== -1) {
        setCurrentUserRank(userIndex + 1)
      }
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

  const startIndex = (page - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const currentUsers = users.slice(startIndex, endIndex)
  const totalPages = Math.ceil(users.length / usersPerPage)

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        {/* Header skeleton */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Skeleton variant="circular" width={48} height={48} sx={{ mx: 'auto', mb: 2 }} />
          <Skeleton variant="text" width={200} height={50} sx={{ mx: 'auto', mb: 1 }} />
          <Skeleton variant="text" width={300} height={30} sx={{ mx: 'auto' }} />
        </Box>

        {/* Table skeleton */}
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3, bgcolor: 'background.paper' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'grey.800' : 'grey.50' }}>
                <TableCell><Skeleton variant="text" width={60} height={24} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} height={24} /></TableCell>
                <TableCell><Skeleton variant="text" width={120} height={24} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} height={24} /></TableCell>
                <TableCell><Skeleton variant="text" width={60} height={24} /></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(10)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Skeleton variant="text" width={40} height={32} />
                      {index < 3 && <Skeleton variant="circular" width={24} height={24} />}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box>
                        <Skeleton variant="text" width={120} height={24} />
                        <Skeleton variant="text" width={150} height={16} />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={30} height={24} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 1 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
        {currentUserRank && (
          <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
            Your Rank: #{currentUserRank}
          </Typography>
        )}
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
            {currentUsers.map((user, index) => {
              const actualRank = startIndex + index + 1
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
              const isCurrentUser = user.userId?._id === currentUser.id
              return (
              <TableRow 
                key={user._id} 
                sx={{ 
                  '&:hover': { bgcolor: isDark ? 'grey.800' : 'grey.50' },
                  bgcolor: isCurrentUser ? 'primary.50' : actualRank <= 3 ? (isDark ? 'grey.900' : 'grey.100') : 'background.paper',
                  border: isCurrentUser ? '2px solid' : actualRank <= 3 ? '2px solid' : 'none',
                  borderColor: isCurrentUser ? 'primary.main' : actualRank <= 3 ? getRankColor(actualRank) : 'transparent'
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        color: getRankColor(actualRank),
                        minWidth: 40
                      }}
                    >
                      #{actualRank}
                    </Typography>
                    {actualRank <= 3 && <EmojiEvents sx={{ color: getRankColor(actualRank), fontSize: 24 }} />}
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
            )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination 
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
          size="large"
          showFirstButton
          showLastButton
        />
      </Box>
    </Container>
  )
}

export default Leaderboard