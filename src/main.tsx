// main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ConfigProvider, theme } from 'antd'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0062E4',   // azul médio
          colorInfo: '#0062E4',
          fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
          colorBgLayout: '#F8F9FA',
          borderRadius: 12,
          boxShadow:
            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
        components: {
          Card: {
            headerFontSize: 16,
            colorBgContainer: '#fff',
            borderRadiusLG: 12,
            boxShadowTertiary:
              '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
          Statistic: {
            titleFontSize: 18,
          },
          Layout: {
            headerBg: '#fff',
            headerPadding: 16,
          },
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
