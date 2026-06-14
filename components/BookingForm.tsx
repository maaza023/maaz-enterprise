// components/BookingForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TIME_SLOTS } from '@/lib/bookingSlots'
import { toast } from 'react-hot-toast'

export default function BookingForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form Fields
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [pincode, setPincode] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  
  // Real-time Availability State
  const [minDate, setMinDate] = useState('')
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  // Calculate today's date for the minimum date lock and fetch logged-in user's email
  useEffect(() => {
    setMinDate(new Date().toISOString().split('T')[0])
    
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setEmail(user.email)
      }
    }
    fetchUserEmail()
  }, [])

  // LIVE CHECK: Fetch taken slots whenever the user selects a new Date
  useEffect(() => {
    if (!date) {
      setBookedSlots([])
      return
    }

    const fetchAvailability = async () => {
      setCheckingAvailability(true)
      
      const { data, error } = await supabase
        .from('bookings')
        .select('consultation_time')
        .eq('consultation_date', date)

      if (data) {
        // Extract just the time strings into an array we can easily check against
        const takenTimes = data.map(booking => booking.consultation_time)
        setBookedSlots(takenTimes)
      }
      
      setCheckingAvailability(false)
      setTime('') // Reset their time selection if they change the date
    }

    fetchAvailability()
  }, [date])

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert("Please log in to confirm your booking")
      window.location.href = '/login'
      return
    }
    
    if (!time) {
      setError('Please select an available time slot.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: insertError } = await supabase
        .from('bookings')
        .insert([{
            user_id: user.id,
            email,
            phone,
            address,
            pincode,
            consultation_date: date,
            consultation_time: time,
        }])

      if (insertError) {
        // Postgres error 23505 means Unique Violation (someone beat them to it)
        if (insertError.code === '23505') {
          throw new Error('This slot was just booked by someone else! Please pick another.')
        }
        throw insertError
      }

      // Retrieve customer name from profile or metadata
      let clientName = user.user_metadata?.full_name
      if (!clientName) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        if (profileData?.full_name) {
          clientName = profileData.full_name
        }
      }
      if (!clientName) {
        clientName = user.email?.split('@')[0] || 'Valued Client'
      }

      // Send confirmation email asynchronously
      fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail: email,
          date,
          time,
          type: 'confirmation',
        }),
      }).catch((err) => console.error('Failed to send confirmation email:', err))

      setSuccess(true)
      toast.success('Consultation successfully scheduled!')
      setAddress('')
      setPincode('')
      setDate('')
      setTime('')
      setPhone('')
      setBookedSlots([])

    } catch (err: any) {
      console.error('Booking insertion failed:', err)
      const msg = err.message || 'Failed to schedule booking. Your session may have expired or you may be unauthorized.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0B1C15] flex items-center justify-center overflow-hidden p-6 font-sans antialiased text-white">
      
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#D96B43] opacity-20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#D96B43] opacity-15 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-[#12261E]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl z-10">
        
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D96B43] to-[#A34E2E] flex items-center justify-center shadow-lg mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#D96B43] lowercase">
            book free consultation
          </h1>
          <p className="text-xs text-gray-400 mt-2 tracking-wide uppercase">
            schedule an on-site structural assessment for your vintage build
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/20 text-red-200 text-xs rounded-xl mb-4 text-center animate-pulse">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-[#162E24] border border-[#D96B43]/30 text-[#D96B43] text-sm rounded-xl mb-6 text-center animate-bounce">
            Consultation successfully scheduled! We will review the site details and confirm shortly.
          </div>
        )}

        <form onSubmit={handleBooking} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input 
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-4 py-3 bg-[#1A3329] border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:border-[#D96B43]/50 transition-colors" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel" required pattern="[0-9]{10}" placeholder="1234567890"
                value={phone} onChange={(e) => setPhone(e.target.value)} 
                className="w-full px-4 py-3 bg-[#1A3329] border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:border-[#D96B43]/50 transition-colors" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Site Address</label>
            <textarea 
              required rows={2} placeholder="Full site location details..."
              value={address} onChange={(e) => setAddress(e.target.value)} 
              className="w-full px-4 py-3 bg-[#1A3329] border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:border-[#D96B43]/50 transition-colors resize-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Pincode</label>
              <input 
                type="text" required maxLength={6} placeholder="000000"
                value={pincode} onChange={(e) => setPincode(e.target.value)} 
                className="w-full px-4 py-3 bg-[#1A3329] border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:border-[#D96B43]/50 transition-colors tracking-widest font-mono" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Select Date</label>
              <input 
                type="date" required min={minDate}
                value={date} onChange={(e) => setDate(e.target.value)} 
                className="w-full px-4 py-3 bg-[#1A3329] border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:border-[#D96B43]/50 transition-colors [color-scheme:dark]" 
              />
            </div>
          </div>

          <div className="min-h-[100px]">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 text-center">
              {checkingAvailability ? 'Checking calendar...' : 'Available Time Slots'}
            </label>
            
            {/* If no date is selected, prompt them */}
            {!date ? (
              <div className="w-full py-6 rounded-xl border border-dashed border-white/10 text-center text-sm text-gray-500 bg-[#1A3329]/50">
                Select a date to view available times.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isBooked = bookedSlots.includes(slot.dbValue)
                  const isSelected = time === slot.dbValue

                  return (
                    <button
                      type="button"
                      key={slot.dbValue}
                      disabled={isBooked || checkingAvailability}
                      onClick={() => setTime(slot.dbValue)}
                      className={`py-3 text-xs font-bold rounded-xl transition-all border ${
                        isBooked 
                          ? 'bg-[#12261E] border-transparent text-gray-600 opacity-50 cursor-not-allowed line-through'
                          : isSelected
                            ? 'bg-[#D96B43] border-[#D96B43] text-white shadow-lg shadow-[#D96B43]/20 scale-[1.02]'
                            : 'bg-[#1A3329] border-white/5 text-gray-300 hover:border-[#D96B43]/50 hover:text-white'
                      }`}
                    >
                      {slot.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button 
            type="submit" disabled={loading} 
            className="w-full py-4 mt-2 bg-[#D96B43] hover:bg-[#c55d37] disabled:bg-gray-700 text-white font-semibold text-sm rounded-2xl transition-all shadow-lg shadow-[#D96B43]/10 tracking-wide uppercase"
          >
            {loading ? 'Confirming...' : 'confirm booking'}
          </button>
        </form>

      </div>
    </div>
  )
}