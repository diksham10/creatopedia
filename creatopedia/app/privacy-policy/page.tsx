import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Creatopedia',
  description: 'Privacy Policy for Creatopedia platform and Instagram integrations.',
}

export default function PrivacyPolicy() {
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
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">Privacy Policy</h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Last Updated: April 29, 2024</p>
          </div>

          <div className="prose prose-invert max-w-none prose-p:text-zinc-400 prose-p:leading-relaxed prose-headings:text-white prose-headings:tracking-tight prose-strong:text-white">
            <section className="space-y-6">
              <h2 className="text-2xl font-bold">1. Introduction</h2>
              <p>
                Welcome to Creatopedia. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform and our Instagram integration services.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">2. Information We Collect</h2>
              <p>We collect several types of information from and about users of our App, including:</p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-400">
                <li><strong>Account Information:</strong> Name, email address, and profile details provided during registration.</li>
                <li><strong>Instagram Data:</strong> When you connect your Instagram Professional account, we access specific data via the Instagram Graph API, including your username, profile picture, and media (reels/posts) to display them on your hub.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our platform, including view counts and copy actions on prompts.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-400">
                <li>Provide and maintain our Service.</li>
                <li>Display your Instagram Reels and posts on your personal creator hub.</li>
                <li>Analyze usage patterns to improve the user experience.</li>
                <li>Send you important updates regarding your account or our services.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">4. Instagram API Data Usage</h2>
              <p>
                Creatopedia uses the Instagram Graph API to provide automated features for creators. We strictly adhere to Meta&apos;s Developer Policies:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-zinc-400">
                <li>We only request the permissions necessary to display your content (e.g., <code>instagram_business_basic</code>, <code>instagram_manage_media</code>).</li>
                <li>We do not share your Instagram access tokens with third parties.</li>
                <li>You can disconnect your Instagram account at any time through the Admin Dashboard, which will immediately cease our access to your data.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">5. Data Retention and Deletion</h2>
              <p>
                We retain your personal information for as long as your account is active. If you wish to delete your account and all associated data, including any data retrieved from Instagram, you may contact us at support@Creatopedia.app.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">6. Security</h2>
              <p>
                We implement industry-standard security measures to protect your data. Your Instagram access tokens are encrypted at rest using AES-256 encryption before being stored in our database.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold">7. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
                <p className="text-white font-bold mb-1">Creatopedia Legal Team</p>
                <p className="text-zinc-500 text-sm italic">legal@Creatopedia.app</p>
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
