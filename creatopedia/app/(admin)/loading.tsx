export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-zinc-800 rounded-full" />
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
      </div>
      <p className="mt-6 text-zinc-500 font-medium animate-pulse tracking-widest uppercase text-[10px]">
        Loading Hub...
      </p>
    </div>
  )
}
