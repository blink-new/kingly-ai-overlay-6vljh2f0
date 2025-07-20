import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  Mic,
  BarChart3,
  Settings,
  History,
  Play,
  Pause,
  Square,
  Eye,
  EyeOff,
  Download,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  MessageSquare
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { blink } from '../blink/client'
import { useSessionManager } from '../hooks/useSessionManager'

interface DashboardProps {
  onStartSession: () => void
  isOverlayVisible: boolean
  onToggleOverlay: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({
  onStartSession,
  isOverlayVisible,
  onToggleOverlay
}) => {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalDuration: 0,
    avgSuggestions: 0,
    successRate: 0
  })

  const {
    recentSessions,
    isLoading,
    loadRecentSessions,
    getSessionStats
  } = useSessionManager()

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  // Load real data when user is available
  useEffect(() => {
    if (user?.id) {
      loadRecentSessions(user.id, 10)
      getSessionStats(user.id).then(setStats)
    }
  }, [user?.id, loadRecentSessions, getSessionStats])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500'
      case 'sales_call': return 'bg-green-500'
      case 'interview': return 'bg-purple-500'
      case 'exam': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Kingly AI</h1>
          <p className="text-slate-400">Loading your AI assistant...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-indigo-400" />
              <div>
                <h1 className="text-xl font-bold">Kingly AI</h1>
                <p className="text-sm text-slate-400">AI-Powered Desktop Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant={isOverlayVisible ? "default" : "outline"}
                onClick={onToggleOverlay}
                className="flex items-center gap-2"
              >
                {isOverlayVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {isOverlayVisible ? 'Hide' : 'Show'} Overlay
              </Button>
              
              <Button onClick={onStartSession} className="bg-indigo-600 hover:bg-indigo-700">
                <Play className="w-4 h-4 mr-2" />
                Start Session
              </Button>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <span className="text-slate-300">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Sessions</p>
                    <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-indigo-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Time</p>
                    <p className="text-2xl font-bold text-white">{formatDuration(stats.totalDuration)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-emerald-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Avg Suggestions</p>
                    <p className="text-2xl font-bold text-white">{stats.avgSuggestions}</p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Success Rate</p>
                    <p className="text-2xl font-bold text-white">{stats.successRate}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-900 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-indigo-600">
              Recent Sessions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-indigo-600">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-indigo-600">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Start */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-indigo-400" />
                    Quick Start
                  </CardTitle>
                  <CardDescription>
                    Start a new AI-assisted session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2 border-slate-600 hover:border-blue-500"
                      onClick={onStartSession}
                    >
                      <Users className="w-6 h-6 text-blue-400" />
                      <span className="text-sm">Meeting</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2 border-slate-600 hover:border-green-500"
                      onClick={onStartSession}
                    >
                      <MessageSquare className="w-6 h-6 text-green-400" />
                      <span className="text-sm">Sales Call</span>
                    </Button>
                  </div>
                  <Button 
                    onClick={onStartSession}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    Start Custom Session
                  </Button>
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    AI Features
                  </CardTitle>
                  <CardDescription>
                    Powered by advanced AI technology
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                    <Mic className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="font-medium">Live Transcription</p>
                      <p className="text-sm text-slate-400">Real-time audio to text</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="font-medium">AI Coaching</p>
                      <p className="text-sm text-slate-400">Contextual suggestions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="font-medium">Analytics</p>
                      <p className="text-sm text-slate-400">Performance insights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  Recent Sessions
                </CardTitle>
                <CardDescription>
                  Your latest AI-assisted sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-slate-400">Loading sessions...</p>
                    </div>
                  ) : recentSessions.length > 0 ? (
                    recentSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-750 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${getSessionTypeColor(session.type)}`} />
                          <div>
                            <h3 className="font-medium">{session.title}</h3>
                            <p className="text-sm text-slate-400">
                              {session.startTime.toLocaleDateString()} • {session.duration ? formatDuration(session.duration / 1000) : 'In progress'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {session.analytics.suggestionsUsed}/{session.analytics.totalSuggestions}
                            </p>
                            <p className="text-xs text-slate-400">suggestions used</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 mb-2">No sessions yet</p>
                      <p className="text-sm text-slate-500">Start your first AI-assisted session to see it here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Analytics charts coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle>Session Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Most Active Day</span>
                      <span className="font-medium">Tuesday</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Avg Session Length</span>
                      <span className="font-medium">45 minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Top Session Type</span>
                      <Badge variant="outline">Meetings</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">AI Accuracy</span>
                      <span className="font-medium text-green-400">94%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  Overlay Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Overlay Position</label>
                    <select className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2">
                      <option>Top Right</option>
                      <option>Top Left</option>
                      <option>Bottom Right</option>
                      <option>Bottom Left</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Opacity</label>
                    <input 
                      type="range" 
                      min="50" 
                      max="100" 
                      defaultValue="95"
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Hotkeys</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Toggle Overlay</span>
                      <Badge variant="outline">Ctrl + Shift + K</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Start/Stop Recording</span>
                      <Badge variant="outline">Ctrl + Shift + R</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}