import { useState, useCallback } from 'react'
import { blink } from '../blink/client'
import { Session, SessionAnalytics } from '../types/session'

export const useSessionManager = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const createSession = useCallback(async (
    title: string,
    type: string,
    userId: string
  ): Promise<Session> => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const session: Session = {
      id: sessionId,
      title,
      type: type as any,
      startTime: new Date(now),
      status: 'active',
      transcription: [],
      aiSuggestions: [],
      analytics: {
        talkToListenRatio: 0,
        speakingTime: 0,
        listeningTime: 0,
        sentimentScore: 0,
        keyTopics: [],
        actionItems: [],
        suggestionsUsed: 0,
        totalSuggestions: 0
      },
      userId,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    }

    try {
      // Save to database
      await blink.db.sessions.create({
        id: sessionId,
        userId,
        title,
        type,
        startTime: now,
        status: 'active',
        createdAt: now,
        updatedAt: now
      })

      // Create analytics record
      await blink.db.sessionAnalytics.create({
        id: `analytics_${sessionId}`,
        sessionId,
        userId,
        talkToListenRatio: 0,
        speakingTime: 0,
        listeningTime: 0,
        sentimentScore: 0,
        keyTopics: JSON.stringify([]),
        actionItems: JSON.stringify([]),
        suggestionsUsed: 0,
        totalSuggestions: 0,
        createdAt: now,
        updatedAt: now
      })

      setCurrentSession(session)
      return session

    } catch (error) {
      console.error('Failed to create session:', error)
      throw error
    }
  }, [])

  const endSession = useCallback(async (sessionId: string) => {
    if (!currentSession) return

    const now = Date.now()
    const duration = now - currentSession.startTime.getTime()

    try {
      // Update session in database
      await blink.db.sessions.update(sessionId, {
        endTime: now,
        duration,
        status: 'completed',
        updatedAt: now
      })

      // Update current session
      const updatedSession = {
        ...currentSession,
        endTime: new Date(now),
        duration,
        status: 'completed' as const,
        updatedAt: new Date(now)
      }

      setCurrentSession(updatedSession)
      
      // Add to recent sessions
      setRecentSessions(prev => [updatedSession, ...prev.slice(0, 9)])

    } catch (error) {
      console.error('Failed to end session:', error)
      throw error
    }
  }, [currentSession])

  const loadRecentSessions = useCallback(async (userId: string, limit: number = 10) => {
    setIsLoading(true)
    try {
      const sessions = await blink.db.sessions.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit
      })

      const formattedSessions: Session[] = sessions.map(session => ({
        id: session.id,
        title: session.title,
        type: session.type as any,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
        duration: session.duration,
        status: session.status as any,
        transcription: [], // Load separately if needed
        aiSuggestions: [], // Load separately if needed
        analytics: {
          talkToListenRatio: 0,
          speakingTime: 0,
          listeningTime: 0,
          sentimentScore: 0,
          keyTopics: [],
          actionItems: [],
          suggestionsUsed: 0,
          totalSuggestions: 0
        },
        userId: session.userId,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      }))

      setRecentSessions(formattedSessions)
      return formattedSessions

    } catch (error) {
      console.error('Failed to load recent sessions:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveTranscriptionSegment = useCallback(async (
    sessionId: string,
    text: string,
    timestamp: number,
    isUserSpeaking: boolean = true
  ) => {
    const segmentId = `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      await blink.db.transcriptionSegments.create({
        id: segmentId,
        sessionId,
        text,
        timestamp,
        isUserSpeaking: isUserSpeaking ? 1 : 0,
        confidence: 0.9,
        createdAt: Date.now()
      })
    } catch (error) {
      console.error('Failed to save transcription segment:', error)
    }
  }, [])

  const saveAISuggestion = useCallback(async (
    sessionId: string,
    type: string,
    content: string,
    context: string,
    priority: string = 'medium'
  ) => {
    const suggestionId = `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      await blink.db.aiSuggestions.create({
        id: suggestionId,
        sessionId,
        type,
        content,
        context,
        timestamp: Date.now(),
        priority,
        isUsed: 0,
        createdAt: Date.now()
      })
    } catch (error) {
      console.error('Failed to save AI suggestion:', error)
    }
  }, [])

  const updateSessionAnalytics = useCallback(async (
    sessionId: string,
    analytics: Partial<SessionAnalytics>
  ) => {
    try {
      const updateData: any = {
        updatedAt: Date.now()
      }

      if (analytics.talkToListenRatio !== undefined) {
        updateData.talkToListenRatio = analytics.talkToListenRatio
      }
      if (analytics.speakingTime !== undefined) {
        updateData.speakingTime = analytics.speakingTime
      }
      if (analytics.listeningTime !== undefined) {
        updateData.listeningTime = analytics.listeningTime
      }
      if (analytics.sentimentScore !== undefined) {
        updateData.sentimentScore = analytics.sentimentScore
      }
      if (analytics.keyTopics !== undefined) {
        updateData.keyTopics = JSON.stringify(analytics.keyTopics)
      }
      if (analytics.actionItems !== undefined) {
        updateData.actionItems = JSON.stringify(analytics.actionItems)
      }
      if (analytics.suggestionsUsed !== undefined) {
        updateData.suggestionsUsed = analytics.suggestionsUsed
      }
      if (analytics.totalSuggestions !== undefined) {
        updateData.totalSuggestions = analytics.totalSuggestions
      }

      await blink.db.sessionAnalytics.update(`analytics_${sessionId}`, updateData)

    } catch (error) {
      console.error('Failed to update session analytics:', error)
    }
  }, [])

  const getSessionStats = useCallback(async (userId: string) => {
    try {
      const sessions = await blink.db.sessions.list({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      const analytics = await blink.db.sessionAnalytics.list({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      const totalSessions = sessions.length
      const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0)
      const avgSuggestions = analytics.length > 0 
        ? analytics.reduce((sum, a) => sum + (a.totalSuggestions || 0), 0) / analytics.length 
        : 0
      const successRate = analytics.length > 0
        ? (analytics.reduce((sum, a) => sum + (a.suggestionsUsed || 0), 0) / 
           analytics.reduce((sum, a) => sum + (a.totalSuggestions || 1), 0)) * 100
        : 0

      return {
        totalSessions,
        totalDuration,
        avgSuggestions: Math.round(avgSuggestions * 10) / 10,
        successRate: Math.round(successRate)
      }

    } catch (error) {
      console.error('Failed to get session stats:', error)
      return {
        totalSessions: 0,
        totalDuration: 0,
        avgSuggestions: 0,
        successRate: 0
      }
    }
  }, [])

  return {
    currentSession,
    recentSessions,
    isLoading,
    createSession,
    endSession,
    loadRecentSessions,
    saveTranscriptionSegment,
    saveAISuggestion,
    updateSessionAnalytics,
    getSessionStats
  }
}