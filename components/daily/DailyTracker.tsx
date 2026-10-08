'use client'
import { useEffect } from 'react'
import { recordRead, recordVisit } from '@/lib/daily-client'

// Invisible: opening a story page counts the visit and the read.
export function DailyTracker({ storyId }: { storyId: string }) {
  useEffect(() => {
    recordVisit()
    recordRead(storyId)
  }, [storyId])
  return null
}
