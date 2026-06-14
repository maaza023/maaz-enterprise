'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function LandingPage() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [isContactModalOpen, setContactModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const slide = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -400 : 400,
        behavior: 'smooth',
      });
    }
  };

  // ... rest of your existing code (user state, etc.) ...

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [phone, setPhone] = useState('');

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Honeypot spam filter check
      const botcheck = formData.get('botcheck') as string;
      if (botcheck) {
        console.warn('Spam detected via honeypot.');
        setIsSubmitting(false);
        setIsSent(true);
        toast.success('Message sent successfully! We will get back to you soon.');
        setPhone('');
        (e.target as HTMLFormElement).reset();
        return;
      }

      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const message = formData.get('message') as string;

      // Verify that payload only contains expected schema columns and no undefined values
      const payload = {
        name: name || '',
        email: email || '',
        message: message || '',
        phone: phone || '',
      };

      console.log('Diagnostic: Sending payload to leads table:', JSON.stringify(payload, null, 2));

      const { data, error } = await supabase
        .from('leads')
        .insert([payload])
        .select();

      if (error) {
        console.error('Diagnostic: Supabase query returned an error:', JSON.stringify(error, null, 2));
        console.error('Detailed Error Fields:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        toast.error(`Submission failed: ${error.message}`);
      } else {
        console.log('Diagnostic: Insert succeeded:', JSON.stringify(data, null, 2));
        setIsSent(true);
        toast.success('Message sent successfully! We will get back to you soon.');
        setPhone('');
        (e.target as HTMLFormElement).reset(); // Clears the form
      }
    } catch (err: any) {
      console.error('Diagnostic: Exception caught during submission:', err);
      toast.error(`Exception occurred: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error.message)
      return
    }
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-[#2A3F38] text-[#F3EFE0] font-sans overflow-x-hidden selection:bg-[#E8B49B] selection:text-[#2A3F38]">

      {/* Background Glows */}
      <div className="absolute -top-20 -left-10 w-[36rem] h-[36rem] bg-[#2A5C44] rounded-full mix-blend-screen filter blur-[130px] opacity-30 pointer-events-none" />
      <div className="absolute top-10 right-[-4rem] w-[45rem] h-[45rem] bg-[#D48C70] rounded-full mix-blend-screen filter blur-[160px] opacity-18 pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 pt-8 pb-20">


        <nav className="flex items-center justify-between mb-24">
          {/* Left Side: Logo */}
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Maaz Logo"
              width={250}
              height={100}
              className="w-32 md:w-52 h-auto object-contain"
              priority
            />
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex items-center">
            {/* Desktop Navigation: Visible on md and up */}
            <div className="hidden md:flex items-center gap-4">
              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="px-5 py-2.5 bg-[#1F302A] border border-[#F3EFE0]/20 text-[#F3EFE0] rounded-full hover:bg-white/10 transition-all text-sm font-medium"
              >
                Contact
              </button>
              <Link
                href={user ? "/book" : "/login"}
                className="px-6 py-2.5 bg-[#D48C70] text-[#1F302A] rounded-full hover:bg-[#E8B49B] transition-all text-sm font-bold shadow-[0_0_15px_rgba(212,140,112,0.3)]"
              >
                Book Free Consultation
              </Link>
              {user ? (
                <>
                  <Link
                    href="/bookings"
                    className="px-4 py-2 rounded-full border border-white/20 text-[#F3EFE0] hover:bg-white/10 transition-colors text-sm font-medium"
                  >
                    My Bookings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#F3EFE0]/70 hover:text-[#F3EFE0] transition-colors px-4 py-2 border border-[#F3EFE0]/20 rounded-full hover:bg-white/5"
                >
                  Sign in
                </Link>
              )}
            </div>

            {/* Mobile Navigation Toggle: Hidden on md and up */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-[#F3EFE0] hover:text-[#D48C70] transition-colors text-2xl focus:outline-none"
                aria-label="Toggle Menu"
              >
                ☰
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <>
            {/* Invisible fixed full-screen overlay to close menu on click outside */}
            <div
              className="fixed inset-0 z-40 md:hidden bg-transparent"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="absolute top-24 left-6 right-6 z-50 md:hidden bg-[#1F302A] border border-[#F3EFE0]/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
              <button
                type="button"
                onClick={() => {
                  setContactModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-5 py-3 bg-white/5 border border-[#F3EFE0]/10 text-[#F3EFE0] rounded-xl hover:bg-white/10 transition-all text-center text-sm font-medium"
              >
                Contact
              </button>

              <Link
                href={user ? "/book" : "/login"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full px-5 py-3 bg-[#D48C70] text-[#1F302A] rounded-xl hover:bg-[#E8B49B] transition-all text-center text-sm font-bold block"
              >
                Book Free Consultation
              </Link>

              {user ? (
                <>
                  <Link
                    href="/bookings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full px-5 py-3 rounded-xl border border-white/10 text-[#F3EFE0] hover:bg-white/10 transition-colors text-center text-sm font-medium block"
                  >
                    My Bookings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-5 py-3 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors text-center text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center text-sm font-medium text-[#F3EFE0]/70 hover:text-[#F3EFE0] transition-colors px-5 py-3 border border-[#F3EFE0]/10 rounded-xl hover:bg-white/5 block"
                >
                  Sign in
                </Link>
              )}
            </div>
          </>
        )}

        {isContactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
            <div className="w-full max-w-xl rounded-[2rem] bg-[#1F302A] border border-[#F3EFE0]/10 p-8 shadow-2xl text-[#F3EFE0] relative">
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="absolute top-5 right-5 rounded-full border border-white/10 bg-white/5 p-2 text-sm text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
              <h3 className="text-3xl font-bold mb-4">Contact Maaz Enterprise</h3>
              <p className="mb-6 text-[#F3EFE0]/80 leading-relaxed">Reach out directly for a consultation or a detailed design conversation.</p>
              <div className="space-y-4 text-sm md:text-base">
                <div>
                  <span className="block text-[0.9rem] text-[#F3EFE0]/70 uppercase tracking-[0.25em] mb-1">Phone</span>
                  <p className="text-lg font-semibold">8002211786</p>
                  <p className="text-lg font-semibold">9699332786</p>
                </div>
                <div>
                  <span className="block text-[0.9rem] text-[#F3EFE0]/70 uppercase tracking-[0.25em] mb-1">Email</span>
                  <p className="text-lg font-semibold">maazenterprisemum@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Content */}
          <div className="lg:col-span-5 flex flex-col justify-center pt-8 pb-4 lg:pb-0 z-10 relative max-w-full">
            <h1 className="text-[4.5rem] sm:text-[5.5rem] md:text-[8rem] lg:text-[10rem] font-bold leading-none tracking-tighter mb-4 lg:mb-6 text-[#F3EFE0] max-w-full lg:max-w-none break-words lg:break-normal">
              CURATED LIVING.
            </h1>

            <p className="text-lg md:text-2xl text-[#F3EFE0]/80 mb-8 max-w-full md:max-w-md leading-relaxed">
              Where vintage soul embraces modern elegance.
            </p>

            <div>
              {!user && (
                <Link
                  href="/login"
                  className="inline-flex items-center px-6 py-4 bg-white/5 border border-[#F3EFE0]/20 rounded-full hover:bg-white/10 transition-all text-sm font-medium backdrop-blur-sm"
                >
                  Get started <span className="ml-2">›</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right Image Container */}
          <div
            className="lg:col-span-7 h-[450px] md:h-[650px] w-full max-w-full rounded-t-[2.5rem] lg:rounded-tl-none lg:rounded-tr-[2.5rem] overflow-hidden relative shadow-2xl translate-y-6 max-lg:[mask-image:linear-gradient(to_bottom,transparent_0%,black_20%)] max-lg:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_20%)] lg:[mask-image:linear-gradient(to_right,transparent_0%,black_40%)] lg:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_40%)]"
          >
            <Image
              src="/render.jpg"
              alt="Vintage Modern Structural Render"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>

        </main>

        {/* =========================================
            LOWER PAGE CONTENT
        {/* Bottom Cards Section */}
        {/* Added 'relative z-10' to make the cards sit completely on top of the image */}
        {/* =========================================
            LOWER PAGE CONTENT
            ========================================= */}
        <div className="mt-32 space-y-40 pb-24 relative z-10">

          {/* 1. Our Work Section (Image Gallery with Arrows) */}
          <section id="portfolio" className="px-4 md:px-0">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-4xl md:text-5xl font-bold text-[#F3EFE0] tracking-tight">
                Some of our work.
              </h2>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => slide('left')}
                  className="w-12 h-12 rounded-full border border-[#F3EFE0]/20 flex items-center justify-center text-[#F3EFE0] hover:bg-white/10 transition-colors"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => slide('right')}
                  className="w-12 h-12 rounded-full border border-[#F3EFE0]/20 flex items-center justify-center text-[#F3EFE0] hover:bg-white/10 transition-colors"
                >
                  →
                </button>
              </div>
            </div>

            <div
              ref={sliderRef}
              className="flex gap-6 overflow-x-auto pb-8 snap-x scroll-smooth px-4 md:px-0 no-scrollbar"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div
                  key={num}
                  className="min-w-[75vw] md:min-w-[500px] lg:min-w-[500px] h-[450px] md:h-[600px] bg-[#1F302A] rounded-3xl border border-[#F3EFE0]/10 overflow-hidden relative shrink-0"
                >
                  <Image
                    src={`/image${num}.png`}
                    alt={`Interior Project Image ${num}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ... (Keep your Why Choose Us and FAQ sections here exactly as they are) ... */}

          {/* 2. Why Choose Us Section (Interior Focus) */}
          <section id="services" className="px-4 md:px-0">
            <h2 className="text-4xl md:text-5xl font-bold text-[#F3EFE0] tracking-tight mb-12 lowercase text-center md:text-left">
              Why people choose MaazEnterprise?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-[2rem] bg-[#F3EFE0] text-[#2A3F38]">
                <h3 className="text-xl font-bold mb-3">Curated Atmospheres</h3>
                <p className="opacity-80 leading-relaxed">We don't just fill rooms with furniture. We layer lighting, textures, and vintage elements to create spaces that actually feel alive.</p>
              </div>
              <div className="p-8 rounded-[2rem] bg-white/5 border border-[#F3EFE0]/20 text-[#F3EFE0] backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-3">Sourcing the Rare</h3>
                <p className="opacity-80 leading-relaxed">Our network allows us to source authentic mid-century pieces and custom fixtures that you won't find in a standard catalog.</p>
              </div>
              <div className="p-8 rounded-[2rem] bg-[#D48C70] text-[#2A3F38]">
                <h3 className="text-xl font-bold mb-3">Seamless Execution</h3>
                <p className="opacity-80 leading-relaxed">From the initial mood board to the final installation day, we handle the logistics, tradesmen, and styling.</p>
              </div>
            </div>
          </section>

          {/* 3. FAQ Section (Interior Focus) */}
          <section id="studio" className="max-w-4xl mx-auto px-4 md:px-0">
            <h2 className="text-4xl md:text-5xl font-bold text-[#F3EFE0] tracking-tight mb-12 lowercase text-center">
              frequently asked questions.
            </h2>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-[#1F302A] border border-[#F3EFE0]/10">
                <h4 className="text-lg font-semibold text-[#F3EFE0] mb-2">Do you source the vintage furniture, or do I need to find it?</h4>
                <p className="text-[#F3EFE0]/70">We handle all the sourcing. We hunt down authentic vintage pieces, negotiate the prices, and arrange the freight directly to your space.</p>
              </div>
              <div className="p-6 rounded-2xl bg-[#1F302A] border border-[#F3EFE0]/10">
                <h4 className="text-lg font-semibold text-[#F3EFE0] mb-2">What happens during the initial space assessment?</h4>
                <p className="text-[#F3EFE0]/70">We walk through your space to understand the natural light, take precise measurements, and discuss the exact mood and utility you want for the room.</p>
              </div>
              <div className="p-6 rounded-2xl bg-[#1F302A] border border-[#F3EFE0]/10">
                <h4 className="text-lg font-semibold text-[#F3EFE0] mb-2">Can you integrate modern smart home tech into a vintage aesthetic?</h4>
                <p className="text-[#F3EFE0]/70">Absolutely. We specialize in hiding modern technology—like automated shades, frame TVs, and smart lighting—seamlessly within classic interior designs.</p>
              </div>
            </div>
          </section>

          {/* 4. Contact / Comment Form */}
          <section className="max-w-2xl mx-auto w-full px-4 md:px-0">
            <div className="p-8 md:p-12 rounded-[2.5rem] bg-[#F3EFE0] text-[#2A3F38]">
              <h2 className="text-3xl font-bold tracking-tight mb-2 lowercase">start a conversation.</h2>
              <p className="mb-8 opacity-70">Have a space in mind? Drop your details below.</p>

              <form onSubmit={handleContactSubmit} className="space-y-6">
                <input
                  type="text"
                  name="botcheck"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />
                <div>
                  <label className="block text-sm font-semibold mb-2">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="John Doe"
                    className="w-full px-5 py-4 rounded-xl bg-white/50 border border-[#2A3F38]/20 focus:outline-none focus:border-[#2A3F38] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="john@example.com"
                      className="w-full px-5 py-4 rounded-xl bg-white/50 border border-[#2A3F38]/20 focus:outline-none focus:border-[#2A3F38] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Phone Number <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      pattern="[0-9]{10}"
                      placeholder="1234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl bg-white/50 border border-[#2A3F38]/20 focus:outline-none focus:border-[#2A3F38] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Message <span className="text-red-500">*</span></label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    placeholder="Tell us about the room you want to transform..."
                    className="w-full px-5 py-4 rounded-xl bg-white/50 border border-[#2A3F38]/20 focus:outline-none focus:border-[#2A3F38] transition-colors resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-[#2A3F38] text-[#F3EFE0] font-bold hover:bg-[#1F302A] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </section>

          <section className="max-w-4xl mx-auto w-full px-4 md:px-0">
            <div className="p-8 md:p-12 rounded-[2.5rem] bg-[#1F302A] border border-[#F3EFE0]/10 shadow-xl text-[#F3EFE0]">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Contact</h2>
              <div className="space-y-4 text-sm md:text-base leading-relaxed">
                <div>
                  <p className="text-sm text-[#F3EFE0]/70 uppercase tracking-[0.22em] mb-1">Phone</p>
                  <p className="font-semibold">8002211786</p>
                  <p className="font-semibold">9699332786</p>
                </div>
                <div>
                  <p className="text-sm text-[#F3EFE0]/70 uppercase tracking-[0.22em] mb-1">Email</p>
                  <p className="font-semibold">maazenterprisemum@gmail.com</p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}