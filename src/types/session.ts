export interface Session {
  id: string
  title: string
  type: 'meeting' | 'exam' | 'sales_call' | 'interview' | 'other'
  startTime: Date
  endTime?: Date
  duration?: number
  status: 'active' | 'paused' | 'completed'
  transcription: TranscriptionSegment[]
  aiSuggestions: AISuggestion[]
  analytics: SessionAnalytics
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface TranscriptionSegment {
  id: string
  text: string
  timestamp: number
  speaker?: string
  confidence: number
  isUserSpeaking: boolean
}

export interface AISuggestion {
  id: string
  type: 'question' | 'response' | 'action' | 'note'
  content: string
  context: string
  timestamp: number
  priority: 'low' | 'medium' | 'high'
  isUsed: boolean
}

export interface SessionAnalytics {
  talkToListenRatio: number
  speakingTime: number
  listeningTime: number
  sentimentScore: number
  keyTopics: string[]
  actionItems: string[]
  suggestionsUsed: number
  totalSuggestions: number
}

export interface OverlaySettings {
  opacity: number
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size: 'small' | 'medium' | 'large'
  autoHide: boolean
  hotkeys: {
    toggleOverlay: string
    startSession: string
    pauseSession: string
    showSuggestions: string
  }
}