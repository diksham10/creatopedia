import AdClientForm from '@/components/dashboard/ads/AdClientForm'

export default function NewAdClientPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">New Ad Client</h1>
        <p className="text-zinc-500 text-sm mt-1">Add an advertiser to start creating campaigns for them.</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <AdClientForm />
      </div>
    </div>
  )
}
