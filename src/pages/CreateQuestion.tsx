import React, { useState, useEffect } from 'react'
import { Box, Typography, Card, CardContent, TextField, Select, MenuItem, FormControl, InputLabel, Button, Chip, IconButton, Switch, FormControlLabel, Divider, Paper, Container, Grid, Alert } from '@mui/material'
import { ArrowBack, Add, Delete, Code, Quiz, Visibility, VisibilityOff, Save } from '@mui/icons-material'
import { useNavigate } from '../lib/router'
import { useTheme } from '../lib/ThemeContext'
import axios from 'axios'

// Configure axios base URL
const apiBaseUrl = import.meta.env.MODE === 'production' 
  ? import.meta.env.VITE_API_BASE_URL_PROD 
  : import.meta.env.VITE_API_BASE_URL
axios.defaults.baseURL = apiBaseUrl

const CreateQuestion: React.FC = () => {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [questionForm, setQuestionForm] = useState({
    title: '', 
    description: '', 
    difficulty: 'Easy', 
    points: 10,
    topicId: '',
    constraints: [''], 
    example: { input: '', output: '' }, 
    explanation: '',
    testCases: [{ input: '', output: '', explanation: '', isPublic: true }]
  })

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      const response = await axios.get('/api/moderator/topics', { headers })
      setTopics(response.data)
    } catch (error) {
      console.error('Error fetching topics:', error)
      setError('Failed to load topics')
    }
  }

  const addConstraint = () => {
    setQuestionForm({
      ...questionForm,
      constraints: [...questionForm.constraints, '']
    })
  }

  const updateConstraint = (index: number, value: string) => {
    const newConstraints = [...questionForm.constraints]
    newConstraints[index] = value
    setQuestionForm({ ...questionForm, constraints: newConstraints })
  }

  const removeConstraint = (index: number) => {
    const newConstraints = questionForm.constraints.filter((_, i) => i !== index)
    setQuestionForm({ ...questionForm, constraints: newConstraints })
  }

  const createQuestion = async () => {
    if (!questionForm.title || !questionForm.description || !questionForm.topicId || !questionForm.points) {
      setError('Please fill in all required fields')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      // Separate test cases into public and private
      const publicTestCases = questionForm.testCases.filter(tc => tc.isPublic).map(tc => ({
        input: tc.input,
        output: tc.output,
        explanation: tc.explanation
      }))
      const privateTestCases = questionForm.testCases.filter(tc => !tc.isPublic).map(tc => ({
        input: tc.input,
        output: tc.output
      }))
      
      const payload = {
        ...questionForm,
        order: 1, // Add default order
        testCases: {
          public: publicTestCases,
          private: privateTestCases
        }
      }
      
      await axios.post('/api/moderator/questions', payload, { headers })
      navigate('/practice')
    } catch (error: any) {
      console.error('Error creating question:', error)
      setError(error.response?.data?.message || 'Failed to create question')
    } finally {
      setLoading(false)
    }
  }

  const addTestCase = () => {
    setQuestionForm({
      ...questionForm,
      testCases: [...questionForm.testCases, { input: '', output: '', explanation: '', isPublic: true }]
    })
  }

  const removeTestCase = (index: number) => {
    const newTestCases = questionForm.testCases.filter((_, i) => i !== index)
    setQuestionForm({ ...questionForm, testCases: newTestCases })
  }

  const updateTestCase = (index: number, field: string, value: string | boolean) => {
    const newTestCases = [...questionForm.testCases]
    newTestCases[index] = { ...newTestCases[index], [field]: value }
    setQuestionForm({ ...questionForm, testCases: newTestCases })
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/practice')}
          sx={{ mb: 2, textTransform: 'none' }}
        >
          Back to Practice
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Create New Question
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Add a new coding problem to the practice collection
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Main Form */}
        <Grid item xs={12} lg={8}>
          {/* Basic Information */}
          <Card sx={{ mb: 3, borderRadius: 2, border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Quiz sx={{ color: 'primary.main' }} />
                Basic Information
              </Typography>
              
              <TextField
                fullWidth
                label="Question Title *"
                placeholder="e.g., Two Sum"
                value={questionForm.title}
                onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="Problem Description *"
                placeholder="Describe the problem in detail..."
                multiline
                rows={6}
                value={questionForm.description}
                onChange={(e) => setQuestionForm({ ...questionForm, description: e.target.value })}
                sx={{ mb: 3 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Topic *</InputLabel>
                    <Select
                      value={questionForm.topicId}
                      onChange={(e) => setQuestionForm({ ...questionForm, topicId: e.target.value })}
                      label="Topic *"
                    >
                      {topics.map((topic) => (
                        <MenuItem key={topic._id} value={topic._id}>
                          {topic.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={questionForm.difficulty}
                      onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                      label="Difficulty"
                    >
                      <MenuItem value="Easy">Easy</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Points *"
                    type="number"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 0 })}
                    inputProps={{ min: 1, max: 1000 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Example */}
          <Card sx={{ mb: 3, borderRadius: 2, border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Example
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Input"
                    placeholder="[2,7,11,15], 9"
                    multiline
                    rows={3}
                    value={questionForm.example.input}
                    onChange={(e) => setQuestionForm({ 
                      ...questionForm, 
                      example: { ...questionForm.example, input: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Output"
                    placeholder="[0,1]"
                    multiline
                    rows={3}
                    value={questionForm.example.output}
                    onChange={(e) => setQuestionForm({ 
                      ...questionForm, 
                      example: { ...questionForm.example, output: e.target.value }
                    })}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Explanation"
                placeholder="Explain how the example works..."
                multiline
                rows={3}
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* Constraints */}
          <Card sx={{ mb: 3, borderRadius: 2, border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Constraints
                </Typography>
                <Button 
                  startIcon={<Add />} 
                  onClick={addConstraint} 
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  Add Constraint
                </Button>
              </Box>
              
              {questionForm.constraints.map((constraint, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder={`e.g., 2 ≤ nums.length ≤ 10^4`}
                    value={constraint}
                    onChange={(e) => updateConstraint(index, e.target.value)}
                    size="small"
                  />
                  <IconButton 
                    onClick={() => removeConstraint(index)} 
                    disabled={questionForm.constraints.length === 1}
                    color="error"
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Test Cases */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Test Cases
                </Typography>
                <Button 
                  startIcon={<Add />} 
                  onClick={addTestCase} 
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  Add
                </Button>
              </Box>
              
              <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                {questionForm.testCases.map((testCase, index) => (
                  <Paper key={index} sx={{ 
                    p: 2, 
                    mb: 2, 
                    border: '1px solid',
                    borderColor: testCase.isPublic ? 'success.main' : 'warning.main',
                    borderRadius: 2
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {testCase.isPublic ? <Visibility color="success" fontSize="small" /> : <VisibilityOff color="warning" fontSize="small" />}
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Test {index + 1}
                        </Typography>
                        <Chip 
                          label={testCase.isPublic ? 'Public' : 'Private'} 
                          color={testCase.isPublic ? 'success' : 'warning'} 
                          size="small" 
                        />
                      </Box>
                      <IconButton 
                        onClick={() => removeTestCase(index)} 
                        disabled={questionForm.testCases.length === 1}
                        color="error"
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    <TextField
                      fullWidth
                      label="Input"
                      multiline
                      rows={2}
                      value={testCase.input}
                      onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                      sx={{ mb: 2 }}
                      size="small"
                    />
                    
                    <TextField
                      fullWidth
                      label="Expected Output"
                      multiline
                      rows={2}
                      value={testCase.output}
                      onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                      sx={{ mb: 2 }}
                      size="small"
                    />
                    
                    {testCase.isPublic && (
                      <TextField
                        fullWidth
                        label="Explanation"
                        placeholder="Explain this test case..."
                        value={testCase.explanation}
                        onChange={(e) => updateTestCase(index, 'explanation', e.target.value)}
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    )}
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={testCase.isPublic}
                          onChange={(e) => updateTestCase(index, 'isPublic', e.target.checked)}
                          color={testCase.isPublic ? 'success' : 'warning'}
                          size="small"
                        />
                      }
                      label="Public"
                    />
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
        <Button 
          onClick={() => navigate('/practice')}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          startIcon={<Save />}
          onClick={createQuestion}
          disabled={loading || !questionForm.title || !questionForm.description || !questionForm.topicId || !questionForm.points}
          sx={{ textTransform: 'none' }}
        >
          {loading ? 'Creating...' : 'Create Question'}
        </Button>
      </Box>
    </Container>
  )
}

export default CreateQuestion