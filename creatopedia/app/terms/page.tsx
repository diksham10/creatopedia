import Link from 'next/link'

export const metadata = {
  title: 'Terms & Conditions | Creatopedia',
  description: 'Terms and conditions for using the Creatopedia platform.',
}

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center font-extrabold text-white shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Prompt<span className="text-indigo-400">Hub</span></span>
          </Link>
          <Link
            href="/"
            className="rounded-full bg-zinc-900 border border-zinc-800 px-6 py-2 text-xs font-black text-white hover:bg-zinc-800 transition-all uppercase tracking-widest"
          >
            Back Home
          </Link>
        </div>
      </nav>

      <main className="pt-40 pb-32 px-6">
        <div className="max-w-3xl mx-auto space-y-16">
          {/* Header */}
          <div className="space-y-4">
            <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em]">Legal Document</p>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">Terms of <br /><span className="text-indigo-500">Service</span></h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Last Updated: April 30, 2024</p>
          </div>

          <div className="prose prose-invert max-w-none prose-p:text-zinc-400 prose-p:leading-relaxed prose-headings:text-white prose-headings:tracking-tight prose-strong:text-white">
            <section className="space-y-6">
              <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Creatopedia (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">2. User Accounts</h2>
              <p>To access certain features of the Platform, you may be required to create an account. You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-400">
                <li>Maintaining the confidentiality of your account credentials.</li>
                <li>All activities that occur under your account.</li>
                <li>Providing accurate and complete information during registration.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">3. Content and Intellectual Property</h2>
              <p>
                Creatopedia allows creators to share AI prompts. By posting content on the Platform:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-400">
                <li>You retain ownership of your original prompts.</li>
                <li>You grant Creatopedia a non-exclusive, worldwide, royalty-free license to display and distribute your content.</li>
                <li>You represent that you have the right to share the content and that it does not violate any third-party rights.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">4. Prohibited Conduct</h2>
              <p>Users agree not to:</p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-400">
                <li>Use the Platform for any illegal or unauthorized purpose.</li>
                <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts.</li>
                <li>Interfere with the proper working of the Platform.</li>
                <li>Scrape or collect content from the Platform using automated means without prior permission.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">5. Instagram Integration</h2>
              <p>
                Our Platform integrates with Instagram API services. Use of these features is subject to:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-400">
                <li>Meta&apos;s Terms of Service and Developer Policies.</li>
                <li>Our Privacy Policy regarding data handling.</li>
                <li>Your continued authorization of our app within your Meta account settings.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">6. Limitation of Liability</h2>
              <p>
                Creatopedia is provided &quot;as is&quot; without warranties of any kind. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Platform.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">7. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any significant changes by posting the new terms on this page.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">8. Contact Information</h2>
              <p>
                For questions regarding these Terms, please contact us at:
              </p>
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
                <p className="text-white font-bold mb-1">Creatopedia Support</p>
                <p className="text-zinc-500 text-sm italic">support@Creatopedia.app</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-zinc-950">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center font-bold text-zinc-400 border border-zinc-800">P</div>
            <span className="text-sm font-bold text-white">Creatopedia</span>
          </div>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">© 2024 Creatopedia Platform. Built for the AI Generation.</p>
        </div>
      </footer>
    </div>
  )
}
