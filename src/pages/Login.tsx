import React, { useState } from 'react'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material'
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material'
import { useNavigate } from '../lib/router'
import { toast } from 'react-hot-toast'
import { authAPI } from '../lib/api'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [resetStep, setResetStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [resetData, setResetData] = useState({
    email: '',
    otp: '',
    newPassword: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetData({
      ...resetData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await authAPI.login(formData)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      toast.success('Login successful!')
      window.location.href = '/dashboard'
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    try {
      await authAPI.forgotPassword(resetData.email)
      toast.success('Reset code sent to your email')
      setResetStep(2)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset code')
    }
  }

  const handleResetPassword = async () => {
    try {
      await authAPI.resetPassword(resetData)
      toast.success('Password reset successfully')
      setForgotPasswordOpen(false)
      setResetStep(1)
      setResetData({ email: '', otp: '', newPassword: '' })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    }
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Paper 
        elevation={3}
        sx={{ 
          borderRadius: 4,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: 4,
          textAlign: 'center'
        }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8 }}>
            Sign in to your account
          </Typography>
        </Box>
        
        <Box sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3
                }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3
                }
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                mt: 4, 
                mb: 3,
                py: 1.5,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none'
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            <Box textAlign="center" sx={{ mb: 2 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setForgotPasswordOpen(true)}
                sx={{
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Forgot Password?
              </Link>
            </Box>
            <Box textAlign="center">
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/signup')}
                sx={{
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>
        </Box>
      </Paper>
      
      <Dialog open={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {resetStep === 1 ? (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                value={resetData.email}
                onChange={handleResetChange}
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleForgotPassword}
              >
                Send Reset Code
              </Button>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Reset Code"
                name="otp"
                value={resetData.otp}
                onChange={handleResetChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={resetData.newPassword}
                onChange={handleResetChange}
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleResetPassword}
              >
                Reset Password
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  )
}

export default Login