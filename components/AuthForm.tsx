'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from "@/lib/supabase"; // Use your existing path
import Image from "next/image";
type AuthMode = 'login' | 'signup' | 'signup-verify' | 'forgot' | 'verify' | 'reset'

export default function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [showToast, setShowToast] = useState(false)
  const [isSignedUp, setIsSignedUp] = useState(false)

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [retypePassword, setRetypePassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loginIdentifier, setLoginIdentifier] = useState('')

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 7000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'signup') {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username: username
            }
          }
        })
        if (authError) throw authError

        // If Confirm Email is enabled, we move to the email verification screen (OTP).
        // The profiles table row is NOT inserted yet because they are not verified.
        if (authData.user) {
          setMode('signup-verify')
        }
      } else if (mode === 'signup-verify') {
        // Verify OTP for Signup
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: otpCode,
          type: 'signup',
        })
        if (verifyError) throw verifyError

        // Now that the email is verified, the user is authenticated and we can safely insert profile data.
        if (verifyData.user) {
          const user = verifyData.user
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || fullName,
              username: username
            })
          
          if (profileError) throw profileError
          setIsSignedUp(true)
        }
      } else if (mode === 'login') {
        let targetEmail = loginIdentifier
        if (!loginIdentifier.includes('@')) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', loginIdentifier)
            .single()

          if (profileError || !profile) throw new Error('Username not found.')
          targetEmail = profile.email
        }

        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        })
        if (loginError) throw loginError
        router.push('/')
        router.refresh()
      } else if (mode === 'forgot') {
        let targetEmail = loginIdentifier
        if (!loginIdentifier.includes('@')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', loginIdentifier)
            .single()
          if (!profile) throw new Error('Username not found.')
          targetEmail = profile.email
        }

        const { error: otpError } = await supabase.auth.signInWithOtp({ email: targetEmail })
        if (otpError) throw otpError
        setMode('verify')
      } else if (mode === 'verify') {
        let targetEmail = loginIdentifier
        if (!loginIdentifier.includes('@')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', loginIdentifier)
            .single()
          targetEmail = profile?.email || ''
        }

        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: targetEmail,
          token: otpCode,
          type: 'magiclink',
        })
        if (verifyError) throw verifyError
        
        setMode('login')
        setShowToast(true)
      } else if (mode === 'reset') {
        if (password !== retypePassword) throw new Error('Passwords do not match.')
        const { error: updateError } = await supabase.auth.updateUser({ password: password })
        if (updateError) throw updateError
        alert('Password updated successfully!')
        setMode('login')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="relative w-full text-white font-sans antialiased">

      {showToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col md:flex-row items-center justify-between gap-4 w-full max-w-md p-4 bg-[#162E24] border border-[#D96B43]/30 rounded-2xl shadow-2xl animate-bounce">
          <p className="text-sm text-gray-200 text-center md:text-left">Securely logged in. Update your password now.</p>
          <div className="flex items-center gap-2 justify-center md:justify-end">
            <button 
              onClick={() => { setShowToast(false); setMode('reset'); }}
              className="px-3 py-1.5 text-xs font-semibold bg-[#D96B43] text-white rounded-xl hover:bg-[#c55d37] transition-all"
            >
              change password
            </button>
            <button 
              onClick={() => setShowToast(false)}
              className="text-gray-400 hover:text-white px-2 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="w-full z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D96B43] to-[#A34E2E] flex items-center justify-center shadow-lg mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-[#D96B43] lowercase">
            {mode === 'login' && 'login'}
            {mode === 'signup' && 'sign up'}
            {mode === 'signup-verify' && 'verify email'}
            {mode === 'forgot' && 'recover'}
            {mode === 'verify' && 'verify code'}
            {mode === 'reset' && 'new password'}
          </h1>
          <p className="text-xs text-gray-400 mt-2 tracking-wide uppercase">MaazEnterprise</p>
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/20 text-red-200 text-xs rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        {isSignedUp ? (
          <div className="p-8 bg-[#1A3329]/50 border border-emerald-500/20 rounded-[2rem] text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
              <span className="text-3xl">✅</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#D96B43]">
                ✅ Successfully Verified!
              </h2>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Your account is ready. You can now log in.
              </p>
            </div>
            <button
              onClick={() => {
                setIsSignedUp(false)
                setMode('login')
              }}
              className="w-full py-4 bg-[#E88B60] hover:bg-[#E88B60]/90 text-white font-semibold text-sm rounded-2xl transition-all shadow-lg shadow-[#E88B60]/10 tracking-wide uppercase"
            >
              go to login
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleAuth} className="space-y-4">
              
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 bg-[#1A3329] border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:border-[#D96B43]/50 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Username</label>
                    <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-[#1A3329] border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:border-[#D96B43]/50 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-[#1A3329] border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:border-[#D96B43]/50 transition-colors" />
                  </div>
                </>
              )}

              {(mode === 'login' || mode === 'forgot') && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Username or Email</label>
                  <input type="text" required value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} className="w-full px-4 py-3 bg-[#1A3329] border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:border-[#D96B43]/50 transition-colors" />
                </div>
              )}

              {(mode === 'verify' || mode === 'signup-verify') && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">8-Digit Verification Code</label>
                  <input type="text" required maxLength={8} placeholder="00000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="w-full text-center tracking-widest text-lg font-bold py-3 bg-[#1A3329] border border-white/5 rounded-2xl text-white focus:outline-none focus:border-[#D96B43]/50 transition-colors" />
                  {mode === 'signup-verify' && (
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                      We've sent an 8-digit verification code to <span className="text-white font-semibold">{email}</span>.
                    </p>
                  )}
                </div>
              )}

              {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                    {mode === 'reset' ? 'New Password' : 'Password'}
                  </label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-[#1A3329] border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:border-[#D96B43]/50 transition-colors" />
                </div>
              )}

              {mode === 'reset' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Retype New Password</label>
                  <input type="password" required value={retypePassword} onChange={(e) => setRetypePassword(e.target.value)} className="w-full px-4 py-3 bg-[#1A3329] border border-white/5 rounded-2xl text-white text-sm focus:outline-none focus:border-[#D96B43]/50 transition-colors" />
                </div>
              )}

              {mode === 'login' && (
                <div className="text-right">
                  <button type="button" onClick={() => setMode('forgot')} className="text-xs text-gray-400 hover:text-[#D96B43] transition-colors">
                    forgot password?
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-[#E88B60] hover:bg-[#E88B60]/90 disabled:bg-gray-700 text-white font-semibold text-sm rounded-2xl transition-all shadow-lg shadow-[#E88B60]/10 tracking-wide uppercase">
                {loading ? 'Processing...' : (
                  mode === 'login' ? 'login' :
                  mode === 'signup' ? 'create account' :
                  mode === 'signup-verify' ? 'confirm email' :
                  mode === 'forgot' ? 'send code' :
                  mode === 'verify' ? 'verify and login' : 'save password'
                )}
              </button>
            </form>
            {/* The Google Button */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#EEB261]/20 text-white font-medium">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin} // This uses the function we defined earlier
                className="w-full mt-6 flex items-center justify-center gap-3 py-3 border border-[#E88B60] rounded-xl hover:bg-[#E88B60]/20 transition-all text-sm font-medium text-white"
              >
                <Image 
                  src="https://www.svgrepo.com/show/475656/google-color.svg" 
                  alt="Google" 
                  width={18} 
                  height={18} 
                />
                Continue with Google
              </button>
            </div>

            <div className="mt-6 text-center text-xs text-gray-400">
              {mode === 'login' && (
                <p>Don't have an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-[#D96B43] font-medium hover:underline">sign up</button>
                </p>
              )}
              {mode === 'signup' && (
                <p>Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="text-[#D96B43] font-medium hover:underline">login</button>
                </p>
              )}
              {(mode === 'forgot' || mode === 'verify' || mode === 'signup-verify' || mode === 'reset') && (
                <button onClick={() => setMode('login')} className="text-[#D96B43] font-medium hover:underline">← back to login</button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}