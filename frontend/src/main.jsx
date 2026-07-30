import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import { store } from './store'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <App />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#374151',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
              fontWeight: 'bold',
            },
            success: {
              iconTheme: {
                primary: '#6BCB77',
                secondary: '#fff',
              },
            },
          }}
        />
      </HelmetProvider>
    </Provider>
  </React.StrictMode>,
)
