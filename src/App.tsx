import { ConfigProvider, theme } from 'antd'
import { DatabaseTest } from '@/components/DatabaseTest'

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3B82F6', // Blue-500 from Tailwind
          borderRadius: 8,
          fontSize: 14,
        },
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">DoTheThing</h1>
          <p className="text-gray-600 mb-6">Database setup verification</p>

          <DatabaseTest />
        </div>
      </div>
    </ConfigProvider>
  )
}

export default App
