'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface UserProfile {
  full_name?: string
  username?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const checkSessionAndFetchProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          router.push('/login')
          return
        }

        const currentUser = session.user
        setUser(currentUser)

        // Try to fetch profile from the database
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, username')
          .eq('id', currentUser.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }
      } catch (err) {
        console.error('Error loading session or profile:', err)
      } finally {
        setLoading(false)
      }
    }

    checkSessionAndFetchProfile()
  }, [router])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Successfully logged out.')
      router.push('/login')
    } catch (err: any) {
      console.error('Logout error:', err)
      toast.error(err.message || 'Failed to logout.')
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#12261E] flex items-center justify-center text-[#F3EFE0]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D96B43] border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <div className="text-sm uppercase tracking-[0.25em] animate-pulse">authenticating...</div>
        </div>
      </div>
    )
  }

  // Determine display name
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'guest'

  return (
    <main className="relative min-h-screen w-full bg-[#12261E] text-[#F3EFE0] overflow-hidden font-sans antialiased">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#EEB261]/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#D96B43]/10 blur-[130px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 md:py-12 flex flex-col min-h-screen">
        
        {/* Navigation Bar */}
        <header className="flex items-center justify-between mb-12 md:mb-16 pb-6 border-b border-white/5">
          <div className="flex items-center">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <Image 
                src="/logo.png" 
                alt="Maaz Logo" 
                width={180} 
                height={60} 
                className="w-28 md:w-36 h-auto object-contain"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-5 py-2 rounded-full border border-white/10 hover:border-[#D96B43] bg-white/5 hover:bg-[#D96B43]/15 transition-all text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
            >
              {loggingOut ? 'logging out...' : 'logout'}
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start flex-grow">
          
          {/* Welcome Card (Large Span) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="p-8 md:p-10 bg-[#1A3329]/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D96B43]/5 rounded-bl-[100%] pointer-events-none" />
              
              <p className="text-xs font-semibold text-[#D96B43] uppercase tracking-[0.25em] mb-4">account dashboard</p>
              
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-[#F3EFE0] lowercase mb-6 leading-tight">
                welcome back,<br />
                <span className="text-[#D96B43]">{displayName}</span>
              </h1>
              
              <p className="text-base text-[#F3EFE0]/70 max-w-lg leading-relaxed mb-8">
                managing your curated structural designs and vintage-inspired consultation schedules all in one place.
              </p>

              {/* Profile Details mini list */}
              <div className="pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="block text-xs text-[#F3EFE0]/40 uppercase tracking-widest mb-1">email address</span>
                  <span className="font-medium truncate block">{user?.email}</span>
                </div>
                <div>
                  <span className="block text-xs text-[#F3EFE0]/40 uppercase tracking-widest mb-1">provider</span>
                  <span className="font-medium capitalize block">{user?.app_metadata?.provider || 'email'}</span>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <span className="block text-xs text-[#F3EFE0]/40 uppercase tracking-widest mb-1">session status</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    active session
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Consultation Status Display */}
            <div className="p-8 bg-[#1A3329]/30 border border-white/5 rounded-[2.5rem] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#F3EFE0] tracking-tight">Your Consultations</h3>
                <span className="text-xs text-[#D96B43] hover:underline cursor-pointer">
                  <Link href="/bookings">Manage Bookings &rarr;</Link>
                </span>
              </div>
              <p className="text-sm text-[#F3EFE0]/60 mb-6">
                schedule a premium vintage architectural on-site assessment for your upcoming projects.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/book"
                  className="flex-1 px-6 py-4 bg-[#D96B43] hover:bg-[#c55d37] text-[#12261E] font-bold rounded-2xl transition-all text-center text-sm shadow-lg shadow-[#D96B43]/15"
                >
                  Book New Consultation
                </Link>
                <Link
                  href="/bookings"
                  className="flex-1 px-6 py-4 bg-[#1F302A] border border-white/10 hover:border-[#D96B43] text-white hover:bg-white/5 font-semibold rounded-2xl transition-all text-center text-sm"
                >
                  View My Scheduled Bookings
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar Info/Branding Card */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <div className="p-8 bg-[#1F302A] border border-white/10 rounded-[2.5rem] shadow-xl text-[#F3EFE0] relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D96B43] to-[#A34E2E] flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Maaz Enterprise</h3>
                <p className="text-sm text-[#F3EFE0]/70 leading-relaxed mb-6">
                  where vintage soul embraces modern engineering. we combine heritage architecture with structural optimization.
                </p>
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-[#F3EFE0]/40">Studio Office</span>
                    <span className="font-semibold text-right">Mumbai, India</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-[#F3EFE0]/40">Helplines</span>
                    <span className="font-semibold text-right">8002211786 / 9699332786</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#F3EFE0]/40">Support Email</span>
                    <span className="font-semibold text-right truncate">maazenterprisemum@gmail.com</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Back button to landing */}
            <div className="text-center">
              <Link 
                href="/" 
                className="inline-flex items-center text-xs text-[#F3EFE0]/50 hover:text-[#D96B43] transition-colors gap-1 uppercase tracking-widest font-semibold"
              >
                &larr; Back to main site
              </Link>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/5 text-center text-xs text-[#F3EFE0]/40">
          <p>&copy; {new Date().getFullYear()} Maaz Enterprise. All rights reserved.</p>
        </footer>

      </div>
    </main>
  )
}
