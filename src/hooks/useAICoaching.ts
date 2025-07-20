import { useState, useCallback } from 'react'
import { blink } from '../blink/client'
import { AISuggestion } from '../types/session'

export const useAICoaching = () => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generateSuggestion = useCallback(async (
    context: string,
    sessionType: string
  ) => {
    if (!context.trim()) return

    setIsGenerating(true)
    
    try {
      const prompt = `You are an AI coaching assistant for ${sessionType}. Based on the following context, provide 3-5 helpful suggestions.

Context: ${context}

Provide suggestions in the following categories:
1. Questions to ask
2. Key points to mention
3. Action items to note
4. Response improvements

Format as JSON array with objects containing: type, content, priority (low/medium/high)`

      const { text } = await blink.ai.generateText({
        prompt,
        maxTokens: 500
      })

      // Parse AI response and create suggestions
      try {
        const aiSuggestions = JSON.parse(text)
        const formattedSuggestions: AISuggestion[] = aiSuggestions.map((suggestion: any, index: number) => ({
          id: `suggestion_${Date.now()}_${index}`,
          type: suggestion.type || 'note',
          content: suggestion.content,
          context: context,
          timestamp: Date.now(),
          priority: suggestion.priority || 'medium',
          isUsed: false
        }))

        setSuggestions(prev => [...prev, ...formattedSuggestions])
      } catch (parseError) {
        // Fallback: create a single suggestion from the raw text
        const fallbackSuggestion: AISuggestion = {
          id: `suggestion_${Date.now()}`,
          type: 'note',
          content: text,
          context: context,
          timestamp: Date.now(),
          priority: 'medium',
          isUsed: false
        }
        setSuggestions(prev => [...prev, fallbackSuggestion])
      }

    } catch (error) {
      console.error('Failed to generate AI suggestions:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const markSuggestionUsed = useCallback((suggestionId: string) => {
    setSuggestions(prev => 
      prev.map(suggestion => 
        suggestion.id === suggestionId 
          ? { ...suggestion, isUsed: true }
          : suggestion
      )
    )
  }, [])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
  }, [])

  const getRecentSuggestions = useCallback((limit: number = 5) => {
    return suggestions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }, [suggestions])

  return {
    suggestions,
    isGenerating,
    generateSuggestion,
    markSuggestionUsed,
    clearSuggestions,
    getRecentSuggestions
  }
}