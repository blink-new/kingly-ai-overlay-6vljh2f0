import { useState, useCallback, useRef } from 'react'

export interface ScreenCaptureData {
  screenshot: string
  timestamp: number
  windowTitle?: string
  activeApplication?: string
}

export function useScreenCapture() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureData, setCaptureData] = useState<ScreenCaptureData[]>([])
  const intervalRef = useRef<NodeJS.Timeout>()

  const stopCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsCapturing(false)
  }, [])

  const startCapture = useCallback(async () => {
    try {
      // Request screen capture permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })

      const video = document.createElement('video')
      video.srcObject = stream
      video.play()

      setIsCapturing(true)

      // Capture screenshots every 3 seconds
      intervalRef.current = setInterval(async () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (ctx && video.videoWidth > 0) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)
          
          const screenshot = canvas.toDataURL('image/jpeg', 0.8)
          
          const captureItem: ScreenCaptureData = {
            screenshot,
            timestamp: Date.now(),
            windowTitle: document.title,
            activeApplication: 'Browser'
          }
          
          setCaptureData(prev => [...prev.slice(-10), captureItem]) // Keep last 10 captures
        }
      }, 3000)

      // Handle stream end
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopCapture()
      })

    } catch (error) {
      console.error('Screen capture failed:', error)
      setIsCapturing(false)
    }
  }, [stopCapture])

  const getLatestCapture = useCallback(() => {
    return captureData[captureData.length - 1]
  }, [captureData])

  return {
    isCapturing,
    captureData,
    startCapture,
    stopCapture,
    getLatestCapture
  }
}