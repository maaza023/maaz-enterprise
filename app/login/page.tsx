import AuthForm from '@/components/AuthForm'

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-[#12261E]/40 backdrop-blur-2xl border-0 md:border md:border-white/10 shadow-2xl p-4 md:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1F302A]/0 via-[#1F302A]/30 to-[#12261E]/10 opacity-80 pointer-events-none" />
      <div className="absolute top-[-15%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-[#EEB261]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#D96B43]/10 blur-[120px] pointer-events-none" />
      <div className="relative w-full max-w-md">
        <AuthForm />
      </div>
    </main>
  )
}