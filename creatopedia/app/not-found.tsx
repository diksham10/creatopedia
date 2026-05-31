import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-50 px-6 text-center">
      <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mb-8 border border-zinc-800">
        <span className="text-4xl">🔍</span>
      </div>
      <h1 className="text-6xl font-bold text-white tracking-tighter">404</h1>
      <p className="text-zinc-500 mt-4 max-w-xs leading-relaxed">
        We couldn&apos;t find that prompt. It may have been moved, deleted, or is still in draft.
      </p>
      <Link 
        href="/" 
        className="mt-8 px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-all active:scale-95"
      >
        Go Home
      </Link>
    </div>
  )
}
