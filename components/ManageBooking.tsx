'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { TIME_SLOTS } from '@/lib/bookingSlots'
import { toast } from 'react-hot-toast'

type Booking = {
  id: number
  date: string
  time: string
  status: 'Confirmed' | 'Pending' | 'Rescheduled' | 'Cancelled'
  email?: string
}


export default function ManageBooking() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [editBookingId, setEditBookingId] = useState<number | null>(null)
  const [draftDate, setDraftDate] = useState('')
  const [draftTime, setDraftTime] = useState('')
  const [minDate, setMinDate] = useState('')
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [savingBookingId, setSavingBookingId] = useState<number | null>(null)
  const [cancelingBookingId, setCancelingBookingId] = useState<number | null>(null)

  useEffect(() => {
    setMinDate(new Date().toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    const loadBookings = async () => {
      setIsLoading(true)
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError || !authData.user) {
          return
        }

        const { data, error } = await supabase
          .from('bookings')
          .select('id, consultation_date, consultation_time, status, email')
          .eq('user_id', authData.user.id)
          .order('consultation_date', { ascending: true })
          .order('consultation_time', { ascending: true })

        if (data) {
          setBookings(
            data.map((row: any) => ({
              id: row.id,
              date: row.consultation_date,
              time: row.consultation_time,
              status: row.status ?? 'Confirmed',
              email: row.email,
            })),
          )
        } else {
          setBookings([])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadBookings()
  }, [])

  const currentEditBooking = bookings.find((booking) => booking.id === editBookingId) ?? null

  useEffect(() => {
    if (!editBookingId || !draftDate) {
      setBookedSlots([])
      return
    }

    const fetchAvailability = async () => {
      setCheckingAvailability(true)
      let query = supabase
        .from('bookings')
        .select('consultation_time')
        .eq('consultation_date', draftDate)

      if (editBookingId) {
        query = query.neq('id', editBookingId)
      }

      const { data } = await query

      if (data) {
        setBookedSlots(data.map((record: any) => record.consultation_time))
      } else {
        setBookedSlots([])
      }

      setCheckingAvailability(false)
      setDraftTime('')
    }

    fetchAvailability()
  }, [draftDate, editBookingId])

  const handleReschedule = (bookingId: number) => {
    const selectedBooking = bookings.find((booking) => booking.id === bookingId)
    if (!selectedBooking) return

    setDraftDate(selectedBooking.date)
    setDraftTime(selectedBooking.time)
    setEditBookingId(bookingId)
  }

  const handleSave = async () => {
    if (!currentEditBooking) return
    if (!draftDate || !draftTime) {
      window.alert('Please choose a valid date and time slot.')
      return
    }

    setSavingBookingId(currentEditBooking.id)

    const { error } = await supabase
      .from('bookings')
      .update({
        consultation_date: draftDate,
        consultation_time: draftTime,
        status: 'Rescheduled',
      })
      .eq('id', currentEditBooking.id)

    if (error) {
      console.error('Booking update failed:', error)
      const msg = error.code === '23505'
        ? 'That slot is already booked. Please choose another time.'
        : `Unable to update booking: ${error.message || 'Your session may have expired or you are unauthorized.'}`
      window.alert(msg)
      toast.error(msg)
      setSavingBookingId(null)
      return
    }

    setBookings((current) =>
      current.map((booking) =>
        booking.id === currentEditBooking.id
          ? {
              ...booking,
              date: draftDate,
              time: draftTime,
              status: 'Rescheduled',
            }
          : booking,
      ),
    )
    // Send rescheduled email asynchronously
    const triggerRescheduleEmail = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let clientName = user.user_metadata?.full_name
        if (!clientName) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()
          if (profile?.full_name) clientName = profile.full_name
        }
        if (!clientName) clientName = user.email?.split('@')[0] || 'Valued Client'

        const clientEmail = currentEditBooking.email || user.email || ''

        if (clientEmail) {
          fetch('/api/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientName,
              clientEmail,
              date: draftDate,
              time: draftTime,
              type: 'reschedule',
            }),
          }).catch((err) => console.error('Failed to send reschedule email:', err))
        }
      } catch (err) {
        console.error('Error triggering reschedule email:', err)
      }
    }
    triggerRescheduleEmail()

    setEditBookingId(null)
    setSavingBookingId(null)
    toast.success('Booking Rescheduled')
  }

  const handleCancel = async (bookingId: number) => {
    const selectedBooking = bookings.find((booking) => booking.id === bookingId)
    if (!selectedBooking) return

    const confirmed = window.confirm('Cancel this consultation? This cannot be undone.')
    if (!confirmed) return

    setCancelingBookingId(bookingId)
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId)

    if (error) {
      console.error('Booking cancellation failed:', error)
      const msg = `Unable to cancel booking: ${error.message || 'Your session may have expired or you are unauthorized.'}`
      window.alert(msg)
      toast.error(msg)
      setCancelingBookingId(null)
      return
    }

    // Send cancellation email asynchronously
    const triggerCancellationEmail = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let clientName = user.user_metadata?.full_name
        if (!clientName) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()
          if (profile?.full_name) clientName = profile.full_name
        }
        if (!clientName) clientName = user.email?.split('@')[0] || 'Valued Client'

        const clientEmail = selectedBooking.email || user.email || ''

        if (clientEmail) {
          fetch('/api/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientName,
              clientEmail,
              date: selectedBooking.date,
              time: selectedBooking.time,
              type: 'cancellation',
            }),
          }).catch((err) => console.error('Failed to send cancellation email:', err))
        }
      } catch (err) {
        console.error('Error triggering cancellation email:', err)
      }
    }
    triggerCancellationEmail()

    setBookings((current) => current.filter((booking) => booking.id !== bookingId))
    if (editBookingId === bookingId) {
      setEditBookingId(null)
      setDraftDate('')
      setDraftTime('')
    }
    setCancelingBookingId(null)
    toast.success('Consultation Cancelled')
  }

  const handleCancelEdit = () => {
    setEditBookingId(null)
    setDraftDate(currentEditBooking?.date ?? '')
    setDraftTime(currentEditBooking?.time ?? '')
  }

  return (
    <section className="w-full max-w-4xl mx-auto rounded-3xl border border-white/10 bg-[#1F302A]/90 p-4 md:p-8 text-[#F3EFE0] shadow-2xl shadow-black/20">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#A7B59A]">Manage Bookings</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold">Upcoming Consultations</h2>
        </div>
        {isLoading ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-[#E8E3D9] animate-pulse">Loading...</span>
        ) : bookings.length > 0 ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-[#E8E3D9]">
            {bookings.length} booking{bookings.length > 1 ? 's' : ''}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-white/10 bg-[#1F302A]/50 p-4 md:p-6 shadow-xl shadow-black/10">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="h-3 w-20 bg-white/10 rounded mb-2" />
                  <div className="h-5 w-24 bg-white/10 rounded" />
                </div>
                <div className="h-6 w-20 bg-white/10 rounded-full" />
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div>
                    <div className="h-3 w-12 bg-white/10 rounded mb-2" />
                    <div className="h-6 w-28 bg-white/10 rounded" />
                  </div>
                  <div>
                    <div className="h-3 w-12 bg-white/10 rounded mb-2" />
                    <div className="h-6 w-24 bg-white/10 rounded" />
                  </div>
                  <div>
                    <div className="h-3 w-12 bg-white/10 rounded mb-2" />
                    <div className="h-6 w-20 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-2">
                  <div className="flex flex-col gap-2 md:flex-row w-full md:w-auto">
                    <div className="h-11 w-full md:w-28 bg-white/10 rounded-full" />
                    <div className="h-11 w-full md:w-36 bg-white/10 rounded-full" />
                  </div>
                  <div className="h-4 w-1/2 bg-white/10 rounded hidden md:block" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 text-center">
          <p className="text-base md:text-lg text-[#DDE0D8]">No upcoming consultations at the moment.</p>
          <Link
            href="/book"
            className="inline-flex items-center justify-center rounded-full border border-[#F3EFE0]/10 bg-[#F3EFE0]/5 px-6 py-3 text-sm font-semibold text-[#F3EFE0] transition hover:bg-[#F3EFE0]/10"
          >
            Book Now
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((bookingItem) => {
            const isEditing = editBookingId === bookingItem.id
            const buttonDisabled = checkingAvailability || savingBookingId === bookingItem.id || cancelingBookingId === bookingItem.id

            return (
              <article key={bookingItem.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6 shadow-xl shadow-black/10">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#A7B59A]">Booking ID</p>
                    <p className="mt-2 text-lg font-semibold text-[#F3EFE0]">#{bookingItem.id}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-[#12261E]/70 px-3 py-1 text-xs uppercase tracking-[0.25em] text-[#E8E3D9]">
                    {bookingItem.status}
                  </span>
                </div>

                {!isEditing ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[#A7B59A]">Date</p>
                        <p className="mt-2 text-lg md:text-xl font-semibold text-[#F3EFE0]">{bookingItem.date}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[#A7B59A]">Time</p>
                        <p className="mt-2 text-lg md:text-xl font-semibold text-[#F3EFE0]">{bookingItem.time}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[#A7B59A]">Status</p>
                        <p className="mt-2 text-lg md:text-xl font-semibold text-[#F3EFE0]">{bookingItem.status}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-col gap-2 md:flex-row w-full md:w-auto">
                        <button
                          type="button"
                          onClick={() => handleReschedule(bookingItem.id)}
                          className="inline-flex items-center justify-center rounded-full bg-[#E4B56B] px-5 py-3 text-sm font-semibold text-[#1F302A] transition hover:bg-[#d8a35c] w-full md:w-auto"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(bookingItem.id)}
                          disabled={cancelingBookingId === bookingItem.id}
                          className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-red-400 transition hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                        >
                          {cancelingBookingId === bookingItem.id ? 'Cancelling...' : 'Cancel Consultation'}
                        </button>
                      </div>
                      <p className="text-sm text-[#B7C2A7]">Want to change your time? Use Reschedule to update this consultation instantly.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 rounded-3xl border border-white/10 bg-[#12261E]/70 p-4 md:p-6">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                      <label className="block space-y-2 text-sm text-[#E8E3D9]">
                        <span className="uppercase tracking-[0.3em] text-[#A7B59A]">Date</span>
                        <input
                          type="date"
                          min={minDate}
                          value={draftDate}
                          onChange={(event) => setDraftDate(event.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-[#12261E]/80 px-4 py-3 text-[#F3EFE0] outline-none transition focus:border-[#E4B56B]"
                        />
                      </label>
                      <div className="space-y-2 text-sm text-[#E8E3D9]">
                        <span className="uppercase tracking-[0.3em] text-[#A7B59A]">Time</span>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {TIME_SLOTS.map((slot) => {
                            const isBooked = bookedSlots.includes(slot.dbValue)
                            const isSelected = draftTime === slot.dbValue

                            return (
                              <button
                                type="button"
                                key={slot.dbValue}
                                disabled={isBooked || checkingAvailability}
                                onClick={() => setDraftTime(slot.dbValue)}
                                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-all border ${
                                  isBooked
                                    ? 'bg-[#12261E] border-transparent text-gray-500 opacity-50 cursor-not-allowed line-through'
                                    : isSelected
                                      ? 'bg-[#E4B56B] border-[#E4B56B] text-[#1F302A] shadow-lg shadow-[#E4B56B]/20'
                                      : 'bg-[#1A3329] border-white/10 text-gray-300 hover:border-[#D96B43]/50 hover:text-white'
                                }`}
                              >
                                {slot.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={savingBookingId === bookingItem.id || checkingAvailability}
                        className="inline-flex items-center justify-center rounded-full bg-[#E4B56B] px-6 py-3 text-sm font-semibold text-[#1F302A] transition hover:bg-[#d8a35c] disabled:cursor-not-allowed disabled:opacity-60 w-full md:w-auto"
                      >
                        {savingBookingId === bookingItem.id ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-[#F3EFE0] transition hover:bg-white/10 w-full md:w-auto"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
