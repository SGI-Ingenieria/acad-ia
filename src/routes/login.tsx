import { createFileRoute } from '@tanstack/react-router'

import { LoginCard } from '@/components/auth/LoginCard'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="login-bg flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat">
      <LoginCard />
    </div>
  )
}
