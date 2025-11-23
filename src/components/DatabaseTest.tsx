import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Alert, Spin } from 'antd'

export function DatabaseTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test connection by attempting to fetch from tags table
        const { error } = await supabase.from('tags').select('id').limit(1)

        if (error) {
          throw error
        }

        setStatus('success')
        setMessage('Database connection successful! RLS is working.')
      } catch (error) {
        setStatus('error')
        setMessage(`Database error: ${(error as Error).message}`)
      }
    }

    testConnection()
  }, [])

  if (status === 'loading') {
    return <Spin tip="Testing database connection..." />
  }

  return (
    <Alert
      message={status === 'success' ? 'Database Connected' : 'Database Error'}
      description={message}
      type={status === 'success' ? 'success' : 'error'}
      showIcon
    />
  )
}
