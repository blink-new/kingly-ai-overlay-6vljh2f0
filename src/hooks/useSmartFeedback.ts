import { useState, useCallback, useEffect } from 'react'
import { blink } from '../blink/client'

export interface SmartFeedback {
  id: string
  timestamp: number
  type: 'coaching' | 'warning' | 'suggestion' | 'insight' | 'action'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  actionable: boolean
  context: {
    sessionType: string
    duration: number
    activity: string
  }
  suggestions?: string[]
  dismissed?: boolean
}

export function useSmartFeedback() {
  const [feedbacks, setFeedbacks] = useState<SmartFeedback[]>([])
  const [activeFeedback, setActiveFeedback] = useState<SmartFeedback | null>(null)

  const generateContextualFeedback = useCallback(async (
    transcription: string,
    visualContext: string,
    sessionType: string,
    duration: number
  ) => {
    try {
      const { text } = await blink.ai.generateText({
        prompt: `You are Kingly, an AI coaching assistant. Analyze this real-time context and provide intelligent feedback:

TRANSCRIPTION (last 30 seconds): "${transcription}"
VISUAL CONTEXT: "${visualContext}"
SESSION TYPE: ${sessionType}
DURATION: ${Math.floor(duration / 60)} minutes

Provide contextual coaching based on:
1. Speaking patterns and communication effectiveness
2. Visual cues from screen content
3. Session type best practices
4. Time management and pacing

Respond in JSON format:
{
  "type": "coaching|warning|suggestion|insight|action",
  "priority": "low|medium|high|urgent",
  "title": "Brief feedback title",
  "message": "Detailed feedback message",
  "actionable": true/false,
  "suggestions": ["specific", "actionable", "steps"]
}

Examples:
- For meetings: "You've been speaking for 3 minutes straight. Consider asking a question to engage others."
- For sales calls: "The prospect mentioned budget concerns. Address this directly."
- For interviews: "Great technical answer! Now connect it to business impact."
- For exams: "You're spending too long on this question. Consider moving to easier ones first."`,
        model: 'gpt-4o-mini'
      })

      let feedbackData
      try {
        feedbackData = JSON.parse(text)
      } catch {
        return null
      }

      const feedback: SmartFeedback = {
        id: `feedback_${Date.now()}`,
        timestamp: Date.now(),
        type: feedbackData.type || 'insight',
        priority: feedbackData.priority || 'medium',
        title: feedbackData.title || 'AI Insight',
        message: feedbackData.message || text.slice(0, 200),
        actionable: feedbackData.actionable || false,
        context: {
          sessionType,
          duration,
          activity: visualContext
        },
        suggestions: feedbackData.suggestions || [],
        dismissed: false
      }

      setFeedbacks(prev => [...prev.slice(-50), feedback])
      
      // Set as active if high priority
      if (feedback.priority === 'high' || feedback.priority === 'urgent') {
        setActiveFeedback(feedback)
      }

      return feedback

    } catch (error) {
      console.error('Smart feedback generation failed:', error)
      return null
    }
  }, [])

  const generateMeetingInsights = useCallback(async (
    talkTime: number,
    listenTime: number,
    keyTopics: string[],
    participantCount: number
  ) => {
    const talkRatio = talkTime / (talkTime + listenTime)
    
    const insights: SmartFeedback[] = []

    // Talk-to-listen ratio feedback
    if (talkRatio > 0.7) {
      insights.push({
        id: `insight_${Date.now()}_talk`,
        timestamp: Date.now(),
        type: 'coaching',
        priority: 'medium',
        title: 'Speaking Balance',
        message: `You've been speaking ${Math.round(talkRatio * 100)}% of the time. Consider asking questions to engage others more.`,
        actionable: true,
        context: {
          sessionType: 'meeting',
          duration: talkTime + listenTime,
          activity: 'discussion'
        },
        suggestions: [
          'Ask "What are your thoughts on this?"',
          'Pause for questions after key points',
          'Use "How does this align with your experience?"'
        ]
      })
    } else if (talkRatio < 0.2) {
      insights.push({
        id: `insight_${Date.now()}_listen`,
        timestamp: Date.now(),
        type: 'suggestion',
        priority: 'medium',
        title: 'Participation Opportunity',
        message: `You've been mostly listening. Consider sharing your perspective on the key topics discussed.`,
        actionable: true,
        context: {
          sessionType: 'meeting',
          duration: talkTime + listenTime,
          activity: 'discussion'
        },
        suggestions: [
          'Share a relevant experience',
          'Ask clarifying questions',
          'Offer your perspective on key points'
        ]
      })
    }

    // Topic engagement feedback
    if (keyTopics.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_topics`,
        timestamp: Date.now(),
        type: 'insight',
        priority: 'low',
        title: 'Key Topics Identified',
        message: `Main discussion points: ${keyTopics.slice(0, 3).join(', ')}`,
        actionable: false,
        context: {
          sessionType: 'meeting',
          duration: talkTime + listenTime,
          activity: 'topic_analysis'
        }
      })
    }

    setFeedbacks(prev => [...prev.slice(-50), ...insights])
    return insights
  }, [])

  const dismissFeedback = useCallback((feedbackId: string) => {
    setFeedbacks(prev => 
      prev.map(f => f.id === feedbackId ? { ...f, dismissed: true } : f)
    )
    if (activeFeedback?.id === feedbackId) {
      setActiveFeedback(null)
    }
  }, [activeFeedback])

  const getActiveFeedbacks = useCallback(() => {
    return feedbacks.filter(f => !f.dismissed && f.priority !== 'low')
  }, [feedbacks])

  const getRecentInsights = useCallback((minutes: number = 10) => {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return feedbacks.filter(f => f.timestamp > cutoff && !f.dismissed)
  }, [feedbacks])

  // Auto-dismiss low priority feedbacks after 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFeedbacks(prev => 
        prev.map(f => {
          if (f.priority === 'low' && Date.now() - f.timestamp > 30000) {
            return { ...f, dismissed: true }
          }
          return f
        })
      )
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  return {
    feedbacks,
    activeFeedback,
    generateContextualFeedback,
    generateMeetingInsights,
    dismissFeedback,
    getActiveFeedbacks,
    getRecentInsights,
    setActiveFeedback
  }
}