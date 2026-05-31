import type { Metadata } from 'next'
import CreatopediaLanding from '@/components/public/CreatopediaLanding'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Creatopedia | Where Creators Lead, World Follows',
  description: 'Join early access for Creatopedia. One platform for every creator niche. Videos, PDFs, tutorials, and paid content curated directly for audiences.',
}

export default function LandingPage() {
  return <CreatopediaLanding />
}
