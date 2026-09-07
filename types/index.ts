export interface Story {
  id: string
  created_at: string
  title: string
  body: string
  transcript: string | null
  audio_upload_path: string | null
  cover_image_url: string | null
  author_name: string
  author_email: string | null
  tip_count: number
  tip_total: number
  status: 'pending' | 'approved' | 'rejected'
  featured: boolean
  view_count: number
}

export interface Tip {
  id: string
  story_id: string
  amount: number
  fee_processor: number
  net_amount: number
  processor: 'stripe' | 'paypal'
  status: 'pending' | 'completed' | 'failed'
}
