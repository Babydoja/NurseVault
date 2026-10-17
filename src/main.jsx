import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'
try { const s = localStorage.getItem('nv-theme'); document.documentElement.dataset.theme = s || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') } catch {}
createRoot(document.getElementById('root')).render(<BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>)
