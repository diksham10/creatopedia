sed -i '' 's/relatedPrompts: React.ReactNode/relatedPromptsData: any[]/g' components/public/EnhancedPublicPromptUI.tsx
sed -i '' 's/relatedPrompts,/relatedPromptsData,/g' components/public/EnhancedPublicPromptUI.tsx
