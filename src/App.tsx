import { ConfigProvider, theme } from 'antd'

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
          <h1 className="text-3xl font-bold text-gray-900">DoTheThing</h1>
          <p className="mt-2 text-gray-600">
            Vite + React + TypeScript + Tailwind v4 + Ant Design - Setup complete!
          </p>
        </div>
      </div>
    </ConfigProvider>
  )
}

export default App
