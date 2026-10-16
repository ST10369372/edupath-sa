import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { I18nProvider } from './context/I18nContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { borderRadius: '0', background: '#1c1c1c', color: '#f4f4f0', fontSize: '13px' },
              success: { iconTheme: { primary: '#5a7a5a', secondary: '#f4f4f0' } },
              error:   { iconTheme: { primary: '#b34040', secondary: '#f4f4f0' } },
            }}
          />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
)
