import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.addEventListener('error', (event) => {
  document.body.innerHTML = `
    <div style="background:#fff;color:#b00020;padding:25px;font-family:Arial;direction:ltr;min-height:100vh">
      <h1 style="color:#b00020">UNTHA ERROR</h1>
      <h2>JavaScript Error</h2>
      <pre style="white-space:pre-wrap;background:#f5f5f5;padding:15px;border-radius:10px">${String(event.error?.stack || event.message || event.error)}</pre>
      <p>File: ${event.filename || 'unknown'}</p>
      <p>Line: ${event.lineno || 'unknown'} : ${event.colno || 'unknown'}</p>
    </div>
  `
})

window.addEventListener('unhandledrejection', (event) => {
  document.body.innerHTML = `
    <div style="background:#fff;color:#b00020;padding:25px;font-family:Arial;direction:ltr;min-height:100vh">
      <h1 style="color:#b00020">UNTHA ERROR</h1>
      <h2>Unhandled Promise Rejection</h2>
      <pre style="white-space:pre-wrap;background:#f5f5f5;padding:15px;border-radius:10px">${String(event.reason?.stack || event.reason)}</pre>
    </div>
  `
})

try {
  createRoot(document.getElementById('root')).render(<App />)
} catch (error) {
  document.body.innerHTML = `
    <div style="background:#fff;color:#b00020;padding:25px;font-family:Arial;direction:ltr;min-height:100vh">
      <h1 style="color:#b00020">UNTHA FATAL ERROR</h1>
      <pre style="white-space:pre-wrap;background:#f5f5f5;padding:15px;border-radius:10px">${String(error?.stack || error)}</pre>
    </div>
  `
}
