import { useState } from 'react'
import { LoginTabs } from './LoginTabs.tsx'
import { InternalLoginForm } from './InternalLoginForm.tsx'
import { ExternalLoginForm } from './ExternalLoginForm.tsx'

export function LoginCard() {
  const [type, setType] = useState<'internal' | 'external'>('internal')

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-2xl font-semibold text-center mb-1">
        Iniciar sesión
      </h1>
      <p className="text-sm text-gray-500 text-center mb-6">
        Accede al Sistema de Planes de Estudio
      </p>

      <LoginTabs value={type} onChange={setType} />

      {type === 'internal' ? (
        <InternalLoginForm />
      ) : (
        <ExternalLoginForm />
      )}
    </div>
  )
}
