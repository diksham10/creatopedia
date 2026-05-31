import { redirect } from 'next/navigation'

export default function NewPromptPage() {
  redirect('/dashboard/prompts?new=true')
}
