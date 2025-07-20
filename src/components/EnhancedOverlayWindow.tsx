import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  Eye, 
  Brain, 
  BarChart3, 
  Settings, 
  X, 
  Minimize2,
  Play,
  Pause,
  Square,
  Monitor,
  MessageSquare,
  Lightbulb,
  AlertTriangle
} from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { useAudioCapture } from '../hooks/useAudioCapture'
import { useAICoaching } from '../hooks/useAICoaching'
import { useScreenCapture } from '../hooks/useScreenCapture'
import { useVisualAnalysis } from '../hooks/useVisualAnalysis'
import { useSmartFeedback } from '../hooks/useSmartFeedback'
import { useSessionManager } from '../hooks/useSessionManager'
import { ScreenAnalysisOverlay } from './ScreenAnalysisOverlay'
import { blink } from '../blink/client'

interface EnhancedOverlayWindowProps {
  isVisible: boolean
  onClose: () => void
  sessionType: string
  onSessionTypeChange: (type: string) => void
}

export function EnhancedOverlayWindow({ 
  isVisible, 
  onClose, 
  sessionType, 
  onSessionTypeChange 
}: EnhancedOverlayWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState('live')
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [showScreenAnalysis, setShowScreenAnalysis] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const { 
    isRecording, 
    transcript, 
    startRecording, 
    stopRecording, 
    audioLevel 
  } = useAudioCapture()
  
  const { 
    suggestions, 
    generateSuggestion, 
    isGenerating 
  } = useAICoaching()
  
  const { 
    isCapturing, 
    captureData, 
    startCapture, 
    stopCapture 
  } = useScreenCapture()
  
  const { 
    analyses, 
    isAnalyzing, 
    getLatestAnalysis 
  } = useVisualAnalysis()
  
  const { 
    activeFeedback, 
    getActiveFeedbacks, 
    getRecentInsights,
    dismissFeedback 
  } = useSmartFeedback()

  const {
    currentSession,
    createSession,
    endSession,
    saveTranscriptionSegment,
    saveAISuggestion
  } = useSessionManager()

  // Get user auth state
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const sessionDuration = sessionStartTime ? Date.now() - sessionStartTime : 0
  const activeFeedbacks = getActiveFeedbacks()
  const recentInsights = getRecentInsights(5)
  const latestAnalysis = getLatestAnalysis()

  // Auto-generate suggestions based on transcript
  useEffect(() => {
    if (transcript && transcript.length > 100) {
      const words = transcript.split(' ')
      if (words.length % 50 === 0) { // Every 50 words
        generateSuggestion(transcript, sessionType)
      }
    }
  }, [transcript, sessionType, generateSuggestion])

  // Save transcription segments to database
  useEffect(() => {
    if (transcript && currentSession && sessionStartTime) {
      const debounceTimer = setTimeout(() => {
        saveTranscriptionSegment(
          currentSession.id,
          transcript,
          Date.now(),
          true
        )
      }, 2000) // Debounce for 2 seconds

      return () => clearTimeout(debounceTimer)
    }
  }, [transcript, currentSession, sessionStartTime, saveTranscriptionSegment])

  // Save AI suggestions to database
  useEffect(() => {
    if (suggestions.length > 0 && currentSession) {
      const latestSuggestion = suggestions[suggestions.length - 1]
      if (latestSuggestion && !latestSuggestion.isUsed) {
        saveAISuggestion(
          currentSession.id,
          latestSuggestion.type,
          latestSuggestion.content,
          latestSuggestion.context,
          latestSuggestion.priority
        )
      }
    }
  }, [suggestions, currentSession, saveAISuggestion])

  // Session management
  const startSession = async () => {
    if (!user?.id) return
    
    try {
      const session = await createSession(
        `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Session`,
        sessionType,
        user.id
      )
      
      setSessionStartTime(Date.now())
      startRecording()
      if (showScreenAnalysis) {
        startCapture()
      }
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  const stopSession = async () => {
    if (currentSession) {
      try {
        await endSession(currentSession.id)
      } catch (error) {
        console.error('Failed to end session:', error)
      }
    }
    
    setSessionStartTime(null)
    stopRecording()
    stopCapture()
  }

  const toggleScreenAnalysis = () => {
    setShowScreenAnalysis(!showScreenAnalysis)
    if (!showScreenAnalysis && sessionStartTime) {
      startCapture()
    } else {
      stopCapture()
    }
  }

  if (!isVisible) return null

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="fixed top-4 right-4 z-40 w-96"
        >
          <Card className="bg-slate-900/95 backdrop-blur-md border-slate-700 text-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                  {sessionStartTime && (
                    <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">Kingly AI Assistant</h3>
                  <p className="text-xs text-slate-400">
                    {sessionStartTime ? 'Active Session' : 'Ready'} • {sessionType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <div className="p-4">
                {/* Session Controls */}
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    onClick={sessionStartTime ? stopSession : startSession}
                    variant={sessionStartTime ? "destructive" : "default"}
                    size="sm"
                    className="flex-1"
                  >
                    {sessionStartTime ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Stop Session
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Session
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={toggleScreenAnalysis}
                    variant={showScreenAnalysis ? "default" : "outline"}
                    size="sm"
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                </div>

                {/* Session Stats */}
                {sessionStartTime && (
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-slate-800 rounded-lg p-2">
                      <div className="text-xs text-slate-400">Duration</div>
                      <div className="text-sm font-medium">
                        {Math.floor(sessionDuration / 60000)}:{String(Math.floor((sessionDuration % 60000) / 1000)).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-2">
                      <div className="text-xs text-slate-400">Audio</div>
                      <div className="flex items-center justify-center gap-1">
                        {isRecording ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-slate-400" />}
                        <div className="w-8 h-1 bg-slate-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-400 transition-all duration-100"
                            style={{ width: `${audioLevel}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-2">
                      <div className="text-xs text-slate-400">Screen</div>
                      <div className="flex items-center justify-center">
                        {isCapturing ? <Eye className="w-3 h-3 text-blue-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
                        {isAnalyzing && <Brain className="w-3 h-3 text-indigo-400 animate-pulse ml-1" />}
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Feedback Alert */}
                <AnimatePresence>
                  {activeFeedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4"
                    >
                      <Card className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/30 p-3">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {activeFeedback.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                            {activeFeedback.type === 'suggestion' && <Lightbulb className="w-4 h-4 text-blue-400" />}
                            {activeFeedback.type === 'coaching' && <Brain className="w-4 h-4 text-indigo-400" />}
                            {activeFeedback.type === 'insight' && <Eye className="w-4 h-4 text-green-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-white">{activeFeedback.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {activeFeedback.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {activeFeedback.message}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissFeedback(activeFeedback.id)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                    <TabsTrigger value="live" className="text-xs">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Live
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="text-xs">
                      <Brain className="w-3 h-3 mr-1" />
                      AI
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="text-xs">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Stats
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="live" className="mt-4 space-y-3">
                    {/* Live Transcription */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Mic className="w-4 h-4" />
                        Live Transcription
                        {isRecording && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                      </h4>
                      <div className="bg-slate-800 rounded-lg p-3 h-24 overflow-y-auto">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {transcript || (isRecording ? "Listening..." : "Start recording to see transcription")}
                        </p>
                      </div>
                    </div>

                    {/* Screen Context */}
                    {latestAnalysis && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Screen Context
                        </h4>
                        <div className="bg-slate-800 rounded-lg p-3">
                          <p className="text-xs text-slate-300 mb-2">{latestAnalysis.analysis.content}</p>
                          <div className="flex flex-wrap gap-1">
                            {latestAnalysis.analysis.elements.slice(0, 3).map((element, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {element}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="ai" className="mt-4 space-y-3">
                    {/* AI Suggestions */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        AI Coaching
                        {isGenerating && <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />}
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {suggestions.slice(-3).map((suggestion) => (
                          <Card key={suggestion.id} className="bg-slate-800 border-slate-700 p-3">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-slate-300 leading-relaxed">{suggestion.content}</p>
                            </div>
                          </Card>
                        ))}
                        {suggestions.length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-4">
                            AI suggestions will appear here during your session
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Recent Insights */}
                    {recentInsights.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Recent Insights</h4>
                        <div className="space-y-1">
                          {recentInsights.slice(0, 3).map((insight) => (
                            <div key={insight.id} className="flex items-center gap-2 text-xs">
                              <Badge variant="outline" className="text-xs">
                                {insight.type}
                              </Badge>
                              <span className="text-slate-300 truncate">{insight.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="stats" className="mt-4 space-y-3">
                    {/* Session Analytics */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Session Analytics</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Speaking Time</span>
                            <span className="text-white">
                              {sessionStartTime ? Math.floor(sessionDuration / 60000) : 0}m
                            </span>
                          </div>
                          <Progress value={sessionStartTime ? 65 : 0} className="h-1" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">AI Suggestions</span>
                            <span className="text-white">{suggestions.length}</span>
                          </div>
                          <Progress value={(suggestions.length / 10) * 100} className="h-1" />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Screen Analyses</span>
                            <span className="text-white">{analyses.length}</span>
                          </div>
                          <Progress value={(analyses.length / 5) * 100} className="h-1" />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Active Insights</span>
                            <span className="text-white">{activeFeedbacks.length}</span>
                          </div>
                          <Progress value={(activeFeedbacks.length / 3) * 100} className="h-1" />
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-slate-800 rounded-lg p-2">
                        <div className="text-xs text-slate-400">Engagement</div>
                        <div className="text-lg font-bold text-green-400">85%</div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-2">
                        <div className="text-xs text-slate-400">Clarity</div>
                        <div className="text-lg font-bold text-blue-400">92%</div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Screen Analysis Overlay */}
      <ScreenAnalysisOverlay
        isActive={showScreenAnalysis && sessionStartTime !== null}
        sessionType={sessionType}
        onClose={() => setShowScreenAnalysis(false)}
      />
    </>
  )
}