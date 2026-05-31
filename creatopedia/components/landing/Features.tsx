export default function Features() {
  const features = [
    {
      title: "Branded Landing Pages",
      description: "Every creator gets a dedicated subdomain and fully customizable prompt delivery pages.",
      icon: "🎨",
      color: "from-blue-500/20 to-indigo-500/20"
    },
    {
      title: "Smart Gating",
      description: "Unlock prompts via email capture or payment. Build your newsletter while you share.",
      icon: "🔒",
      color: "from-indigo-500/20 to-purple-500/20"
    },
    {
      title: "Deep Analytics",
      description: "Track views, copies, and conversions. Understand which prompts drive the most engagement.",
      icon: "📊",
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      title: "Social Integration",
      description: "Direct links for your Instagram bio and TikTok comments. Seamless for your audience.",
      icon: "🔗",
      color: "from-pink-500/20 to-rose-500/20"
    }
  ]

  return (
    <section id="features" className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Built for the Modern Creator</h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Everything you need to turn your prompt engineering skills into a professional brand.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <div 
              key={i} 
              className="group p-8 rounded-3xl border border-zinc-800 bg-zinc-900/50 hover:border-indigo-500/50 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-3xl mb-6 shadow-inner`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-indigo-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
