import { useState, useCallback } from 'react'
import { blink } from '../blink/client'

export interface VisualAnalysis {
  id: string
  timestamp: number
  screenshot: string
  analysis: {
    content: string
    elements: string[]
    context: string
    suggestions: string[]
    urgency: 'low' | 'medium' | 'high'
  }
  feedback: {
    type: 'coaching' | 'warning' | 'suggestion' | 'insight'
    message: string
    actionable: boolean
  }[]
}

export function useVisualAnalysis() {
  const [analyses, setAnalyses] = useState<VisualAnalysis[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzeScreen = useCallback(async (screenshot: string, context?: string) => {
    setIsAnalyzing(true)
    
    try {
      // Analyze the screenshot with AI
      const { text } = await blink.ai.generateText({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this screen capture and provide intelligent feedback. Context: ${context || 'General screen analysis'}

Please analyze:
1. What content/application is visible
2. Key UI elements and their purpose
3. Current user context and activity
4. Potential improvements or suggestions
5. Any issues or opportunities

Respond in JSON format:
{
  "content": "Brief description of what's shown",
  "elements": ["list", "of", "key", "ui", "elements"],
  "context": "Current activity/situation",
  "suggestions": ["actionable", "suggestions"],
  "urgency": "low|medium|high",
  "feedback": [
    {
      "type": "coaching|warning|suggestion|insight",
      "message": "Specific feedback message",
      "actionable": true/false
    }
  ]
}`
              },
              {
                type: "image",
                image: screenshot
              }
            ]
          }
        ],
        model: 'gpt-4o'
      })

      // Parse AI response
      let analysisData
      try {
        analysisData = JSON.parse(text)
      } catch {
        // Fallback if JSON parsing fails
        analysisData = {
          content: "Screen analysis completed",
          elements: ["Various UI elements detected"],
          context: context || "General screen activity",
          suggestions: ["Continue current activity"],
          urgency: "low",
          feedback: [{
            type: "insight",
            message: text.slice(0, 200) + "...",
            actionable: false
          }]
        }
      }

      const analysis: VisualAnalysis = {
        id: `analysis_${Date.now()}`,
        timestamp: Date.now(),
        screenshot,
        analysis: {
          content: analysisData.content || "Screen content analyzed",
          elements: analysisData.elements || [],
          context: analysisData.context || context || "Unknown context",
          suggestions: analysisData.suggestions || [],
          urgency: analysisData.urgency || 'low'
        },
        feedback: analysisData.feedback || []
      }

      setAnalyses(prev => [...prev.slice(-20), analysis]) // Keep last 20 analyses
      return analysis

    } catch (error) {
      console.error('Visual analysis failed:', error)
      
      // Return basic analysis on error
      const fallbackAnalysis: VisualAnalysis = {
        id: `analysis_${Date.now()}`,
        timestamp: Date.now(),
        screenshot,
        analysis: {
          content: "Screen capture received",
          elements: ["Screen content"],
          context: context || "Screen activity",
          suggestions: ["Analysis temporarily unavailable"],
          urgency: 'low'
        },
        feedback: [{
          type: "insight",
          message: "Visual analysis is processing...",
          actionable: false
        }]
      }
      
      setAnalyses(prev => [...prev.slice(-20), fallbackAnalysis])
      return fallbackAnalysis
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const getLatestAnalysis = useCallback(() => {
    return analyses[analyses.length - 1]
  }, [analyses])

  const getRecentFeedback = useCallback((minutes: number = 5) => {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return analyses
      .filter(a => a.timestamp > cutoff)
      .flatMap(a => a.feedback)
      .filter(f => f.actionable)
  }, [analyses])

  return {
    analyses,
    isAnalyzing,
    analyzeScreen,
    getLatestAnalysis,
    getRecentFeedback
  }
}