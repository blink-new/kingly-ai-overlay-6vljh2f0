import React, { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { EnhancedOverlayWindow } from './components/EnhancedOverlayWindow'
import { Toaster } from './components/ui/toaster'
import { blink } from './blink/client'
import './App.css'

function App() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)
  const [sessionType, setSessionType] = useState('meeting')
  const [currentView, setCurrentView] = useState<'dashboard' | 'session'>('dashboard')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setIsLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + Shift + K: Toggle overlay
      if (event.ctrlKey && event.shiftKey && event.key === 'K') {
        event.preventDefault()
        setIsOverlayVisible(prev => !prev)
      }
      
      // Ctrl + Shift + R: Start/stop session (when overlay is visible)
      if (event.ctrlKey && event.shiftKey && event.key === 'R' && isOverlayVisible) {
        event.preventDefault()
        // This would trigger recording in the overlay component
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOverlayVisible])

  const handleStartSession = () => {
    setIsOverlayVisible(true)
    setCurrentView('session')
  }

  const handleToggleOverlay = () => {
    setIsOverlayVisible(prev => !prev)
  }

  const handleSessionTypeChange = (type: string) => {
    setSessionType(type)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Kingly AI</h1>
          <p className="text-slate-400">Initializing your AI assistant...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Welcome to Kingly AI</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Your undetectable AI-powered desktop assistant for real-time coaching, 
            note-taking, and analytics during meetings, exams, and sales calls.
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-3 rounded-lg transition-colors"
          >
            Get Started
          </button>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-xs text-slate-400">Live Transcription</p>
            </div>
            <div className="p-4">
              <div className="w-8 h-8 bg-purple-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-xs text-slate-400">AI Coaching</p>
            </div>
            <div className="p-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-xs text-slate-400">Analytics</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Dashboard
        onStartSession={handleStartSession}
        isOverlayVisible={isOverlayVisible}
        onToggleOverlay={handleToggleOverlay}
      />
      
      <EnhancedOverlayWindow
        isVisible={isOverlayVisible}
        onClose={() => setIsOverlayVisible(false)}
        sessionType={sessionType}
        onSessionTypeChange={handleSessionTypeChange}
      />
      
      <Toaster />
    </div>
  )
}

export default App