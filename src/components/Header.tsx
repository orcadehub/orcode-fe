import React, { useState, useEffect } from 'react'
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, Avatar } from '@mui/material'
import { LightMode, DarkMode, AccountCircle } from '@mui/icons-material'
import { useNavigate } from '../lib/router'
import { useTheme } from '../lib/ThemeContext'
import logo from '../assets/logo.jpeg'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    handleMenuClose()
    navigate('/')
  }

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        top: 0,
        zIndex: 1100,
        mt: 2,
        width: '95%',
        mx: 'auto',
        borderRadius: 4,
        boxShadow: 3,
        bgcolor: 'background.paper'
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              backgroundColor: 'white', 
              borderRadius: 2, 
              px: 2, 
              py: 1,
              cursor: 'pointer'
            }}
            onClick={() => navigate(user ? '/dashboard' : '/')}
          >
            <img 
              src={logo} 
              alt="ORCADEHUB" 
              style={{ height: '40px', width: 'auto' }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 900,
                  color: '#6a0dad',
                  fontSize: '1.95rem'
                }}
              >
                ORC
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 900,
                  color: '#2c3e50',
                  fontSize: '1.95rem'
                }}
              >
                ODE
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {user ? (
            <>
              <Button 
                onClick={() => navigate('/practice')}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  fontWeight: 500,
                  color: 'text.primary'
                }}
              >
                Practice
              </Button>
              {user.role !== 'moderator' && (
                <Button 
                  onClick={() => navigate('/leaderboard')}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1,
                    fontWeight: 500,
                    color: 'text.primary'
                  }}
                >
                  Leaderboard
                </Button>
              )}
              <Button 
                onClick={() => navigate('/dashboard')}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  fontWeight: 500,
                  color: 'text.primary'
                }}
              >
                Dashboard
              </Button>
              <IconButton
                onClick={handleMenuOpen}
                sx={{ color: 'text.primary' }}
              >
                <AccountCircle />
              </IconButton>
              <IconButton 
                onClick={toggleTheme}
                sx={{ color: 'text.primary' }}
              >
                {isDark ? <LightMode /> : <DarkMode />}
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem disabled>
                  {user.firstName} {user.lastName}
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button 
                onClick={() => navigate('/login')}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  fontWeight: 500,
                  color: 'text.primary'
                }}
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate('/signup')}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  color: 'text.primary',
                  borderColor: 'text.primary'
                }}
              >
                Sign Up
              </Button>
              <IconButton 
                onClick={toggleTheme}
                sx={{ color: 'text.primary' }}
              >
                {isDark ? <LightMode /> : <DarkMode />}
              </IconButton>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header