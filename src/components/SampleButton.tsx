import React from 'react'
import Button from '@mui/material/Button'
import { toast } from 'react-hot-toast'

export default function SampleButton() {
  return (
    <div className="p-2">
      <Button variant="outlined" onClick={() => toast('Clicked!')}>
        MUI + Tailwind Button
      </Button>
    </div>
  )
}
