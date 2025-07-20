import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Brain, AlertTriangle, Lightbulb, X, Maximize2, Minimize2 } from 'lucide-react'
import { useScreenCapture } from '../hooks/useScreenCapture'
import { useVisualAnalysis } from '../hooks/useVisualAnalysis'
import { useSmartFeedback } from '../hooks/useSmartFeedback'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'

interface ScreenAnalysisOverlayProps {
  isActive: boolean
  sessionType: string
  onClose: () => void
}

export function ScreenAnalysisOverlay({ isActive, sessionType, onClose }: ScreenAnalysisOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0)
  
  const { 
    isCapturing, 
    startCapture, 
    stopCapture, 
    getLatestCapture 
  } = useScreenCapture()
  
  const { 
    analyses, 
    isAnalyzing, 
    analyzeScreen, 
    getLatestAnalysis 
  } = useVisualAnalysis()
  
  const { 
    activeFeedback, 
    generateContextualFeedback, 
    dismissFeedback, 
    getActiveFeedbacks 
  } = useSmartFeedback()

  // Auto-start screen capture when overlay becomes active
  useEffect(() => {
    if (isActive && !isCapturing) {
      startCapture()
    } else if (!isActive && isCapturing) {
      stopCapture()
    }
  }, [isActive, isCapturing, startCapture, stopCapture])

  // Analyze screen every 10 seconds
  useEffect(() => {
    if (!isActive || !isCapturing) return

    const interval = setInterval(async () => {
      const latestCapture = getLatestCapture()
      if (latestCapture && Date.now() - lastAnalysisTime > 8000) {
        await analyzeScreen(latestCapture.screenshot, sessionType)
        setLastAnalysisTime(Date.now())
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [isActive, isCapturing, getLatestCapture, analyzeScreen, sessionType, lastAnalysisTime])

  // Generate contextual feedback based on analysis
  useEffect(() => {
    const latestAnalysis = getLatestAnalysis()
    if (latestAnalysis) {
      generateContextualFeedback(
        latestAnalysis.analysis.content,
        latestAnalysis.analysis.context,
        sessionType,
        Date.now() - (latestAnalysis.timestamp - 60000) // Approximate session duration
      )
    }
  }, [analyses, generateContextualFeedback, sessionType, getLatestAnalysis])

  const activeFeedbacks = getActiveFeedbacks()
  const latestAnalysis = getLatestAnalysis()

  if (!isActive) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <Card className="bg-slate-900/95 backdrop-blur-md border-slate-700 text-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Eye className="w-4 h-4 text-indigo-400" />
                {isCapturing && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-sm font-medium">Screen Analysis</span>
              {isAnalyzing && (
                <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="p-3 border-b border-slate-700">
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={isCapturing ? "default" : "secondary"} className="text-xs">
                {isCapturing ? "Capturing" : "Inactive"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {sessionType}
              </Badge>
              {latestAnalysis && (
                <span className="text-slate-400">
                  Last: {new Date(latestAnalysis.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Active Feedback */}
          <AnimatePresence>
            {activeFeedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-slate-700"
              >
                <div className="p-3">
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
                        <Badge 
                          variant={activeFeedback.priority === 'urgent' ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {activeFeedback.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {activeFeedback.message}
                      </p>
                      {activeFeedback.suggestions && activeFeedback.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-400 mb-1">Suggestions:</p>
                          <ul className="text-xs text-slate-300 space-y-1">
                            {activeFeedback.suggestions.slice(0, 2).map((suggestion, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 space-y-3">
                  {/* Recent Analysis */}
                  {latestAnalysis && (
                    <div>
                      <h4 className="text-xs font-medium text-slate-400 mb-2">Latest Analysis</h4>
                      <div className="text-xs text-slate-300 space-y-1">
                        <p><span className="text-slate-400">Content:</span> {latestAnalysis.analysis.content}</p>
                        <p><span className="text-slate-400">Context:</span> {latestAnalysis.analysis.context}</p>
                        {latestAnalysis.analysis.elements.length > 0 && (
                          <p><span className="text-slate-400">Elements:</span> {latestAnalysis.analysis.elements.slice(0, 3).join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Active Feedbacks List */}
                  {activeFeedbacks.length > 1 && (
                    <div>
                      <h4 className="text-xs font-medium text-slate-400 mb-2">
                        Other Insights ({activeFeedbacks.length - 1})
                      </h4>
                      <div className="space-y-2">
                        {activeFeedbacks.slice(1, 4).map((feedback) => (
                          <div key={feedback.id} className="flex items-start gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {feedback.type}
                            </Badge>
                            <span className="text-slate-300 flex-1">{feedback.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex gap-2 pt-2 border-t border-slate-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isCapturing ? stopCapture : startCapture}
                      className="flex-1 h-7 text-xs"
                    >
                      {isCapturing ? "Stop" : "Start"} Capture
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const capture = getLatestCapture()
                        if (capture) {
                          await analyzeScreen(capture.screenshot, sessionType)
                        }
                      }}
                      disabled={isAnalyzing || !getLatestCapture()}
                      className="flex-1 h-7 text-xs"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Now"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}