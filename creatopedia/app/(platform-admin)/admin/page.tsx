'use client'

export default function PlatformAdminPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Platform Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Welcome to the global admin panel.
        </p>
      </div>

      <div className="p-12 border border-dashed border-zinc-800 rounded-3xl text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Coming Soon</h2>
        <p className="text-zinc-500 max-w-md mx-auto">
          This panel is restricted to users with the admin role. Here you'll soon be able to see global metrics, manage users, and review platform-wide configurations.
        </p>
      </div>
    </div>
  )
}
