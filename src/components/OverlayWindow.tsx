import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  Settings, 
  Minimize2, 
  Maximize2,
  Brain,
  FileText,
  BarChart3,
  X
} from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { useAudioCapture } from '../hooks/useAudioCapture'
import { useAICoaching } from '../hooks/useAICoaching'

interface OverlayWindowProps {
  isVisible: boolean
  onToggleVisibility: () => void
  sessionType: string
  onSessionTypeChange: (type: string) => void
}

export const OverlayWindow: React.FC<OverlayWindowProps> = ({
  isVisible,
  onToggleVisibility,
  sessionType,
  onSessionTypeChange
}) => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState<'transcription' | 'suggestions' | 'analytics'>('transcription')
  
  const {
    isRecording,
    transcription,
    error: audioError,
    startRecording,
    stopRecording,
    clearTranscription
  } = useAudioCapture()

  const {
    suggestions,
    isGenerating,
    generateSuggestions,
    markSuggestionUsed,
    getRecentSuggestions
  } = useAICoaching()

  // Auto-generate suggestions when transcription updates
  useEffect(() => {
    if (transcription.length > 50) {
      const words = transcription.split(' ')
      const recentWords = words.slice(-20).join(' ')
      generateSuggestions('Live session context', sessionType, recentWords)
    }
  }, [transcription, sessionType, generateSuggestions])

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed top-4 right-4 z-50"
      >
        <Card className="bg-slate-900/95 backdrop-blur-md border-slate-700 text-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <span className="font-medium text-sm">Kingly AI</span>
              <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-400">
                {sessionType}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7 p-0 hover:bg-slate-700"
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleVisibility}
                className="h-7 w-7 p-0 hover:bg-slate-700"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              {/* Controls */}
              <div className="p-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Button
                    variant={isRecording ? "destructive" : "default"}
                    size="sm"
                    onClick={handleToggleRecording}
                    className="flex items-center gap-2"
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isRecording ? 'Stop' : 'Start'}
                  </Button>
                  
                  {isRecording && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-2 h-2 bg-red-500 rounded-full"
                    />
                  )}
                  
                  <select
                    value={sessionType}
                    onChange={(e) => onSessionTypeChange(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="exam">Exam</option>
                    <option value="sales_call">Sales Call</option>
                    <option value="interview">Interview</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-700">
                {[
                  { id: 'transcription', label: 'Live', icon: FileText },
                  { id: 'suggestions', label: 'AI', icon: Brain },
                  { id: 'analytics', label: 'Stats', icon: BarChart3 }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex-1 flex items-center justify-center gap-1 p-2 text-xs transition-colors ${
                      activeTab === id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-3 h-48 overflow-y-auto">
                {activeTab === 'transcription' && (
                  <div className="space-y-2">
                    {audioError && (
                      <div className="text-red-400 text-xs p-2 bg-red-900/20 rounded">
                        {audioError}
                      </div>
                    )}
                    
                    {transcription ? (
                      <div className="text-xs text-slate-300 leading-relaxed">
                        {transcription}
                      </div>
                    ) : (
                      <div className="text-slate-500 text-xs text-center py-8">
                        {isRecording ? 'Listening...' : 'Start recording to see live transcription'}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'suggestions' && (
                  <div className="space-y-2">
                    {isGenerating && (
                      <div className="text-indigo-400 text-xs flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full"
                        />
                        Generating suggestions...
                      </div>
                    )}
                    
                    {getRecentSuggestions(3).map((suggestion) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-2 rounded text-xs border transition-colors cursor-pointer ${
                          suggestion.isUsed
                            ? 'bg-slate-800 border-slate-600 text-slate-500'
                            : 'bg-indigo-900/20 border-indigo-700 text-indigo-200 hover:bg-indigo-900/40'
                        }`}
                        onClick={() => markSuggestionUsed(suggestion.id)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.type}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${
                            suggestion.priority === 'high' ? 'border-red-500 text-red-400' :
                            suggestion.priority === 'medium' ? 'border-yellow-500 text-yellow-400' :
                            'border-green-500 text-green-400'
                          }`}>
                            {suggestion.priority}
                          </Badge>
                        </div>
                        <div>{suggestion.content}</div>
                      </motion.div>
                    ))}
                    
                    {suggestions.length === 0 && !isGenerating && (
                      <div className="text-slate-500 text-xs text-center py-8">
                        AI suggestions will appear here during your session
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-800 p-2 rounded">
                        <div className="text-xs text-slate-400">Speaking</div>
                        <div className="text-sm font-medium text-emerald-400">
                          {isRecording ? '45%' : '0%'}
                        </div>
                      </div>
                      <div className="bg-slate-800 p-2 rounded">
                        <div className="text-xs text-slate-400">Listening</div>
                        <div className="text-sm font-medium text-blue-400">
                          {isRecording ? '55%' : '0%'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-800 p-2 rounded">
                      <div className="text-xs text-slate-400 mb-1">Session Duration</div>
                      <div className="text-sm font-medium">
                        {isRecording ? '12:34' : '00:00'}
                      </div>
                    </div>
                    
                    <div className="bg-slate-800 p-2 rounded">
                      <div className="text-xs text-slate-400 mb-1">AI Suggestions Used</div>
                      <div className="text-sm font-medium">
                        {suggestions.filter(s => s.isUsed).length} / {suggestions.length}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}