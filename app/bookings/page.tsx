'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ManageBooking from '@/components/ManageBooking'

export default function BookingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    }
    checkSession()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#12261E] flex items-center justify-center text-[#F3EFE0]">
        <div className="text-lg uppercase tracking-[0.25em] animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#12261E] text-[#F3EFE0]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">My Bookings</h1>
        <ManageBooking />
      </div>
    </main>
  )
}
