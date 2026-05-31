import React from 'react'

export const InstagramVerifiedBadge = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 1.5L13.85 4.1L16.9 3.6L17.65 6.6L20.7 7.1L19.95 10.1L22.25 12.1L19.95 14.1L20.7 17.1L17.65 17.6L16.9 20.6L13.85 20.1L12 22.7L10.15 20.1L7.1 20.6L6.35 17.6L3.3 17.1L4.05 14.1L1.75 12.1L4.05 10.1L3.3 7.1L6.35 6.6L7.1 3.6L10.15 4.1L12 1.5Z"
      fill="#0095f6"
    />
    <path
      d="M8 12.5L10.5 15L16 9.5"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
