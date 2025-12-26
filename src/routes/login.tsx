import { createFileRoute } from '@tanstack/react-router'

import { LoginCard } from '@/components/auth/LoginCard'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#7b0f1d] via-[#6b0d1a] to-[#3a050a]">
      <LoginCard />
    </div>
  )
}
