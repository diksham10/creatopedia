import CategoryManager from '@/components/dashboard/CategoryManager'

export default function CategoriesPage() {
  return (
    <div className="space-y-10 max-w-5xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white tracking-tight">Prompt Categories</h1>
        <p className="text-zinc-500 text-sm">Create and manage the topics that organize your prompts.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        <CategoryManager />
      </div>
    </div>
  )
}
