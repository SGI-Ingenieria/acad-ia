import { useState } from 'react'

import { ExternalLoginForm } from './ExternalLoginForm.tsx'
import { InternalLoginForm } from './InternalLoginForm.tsx'
import { LoginTabs } from './LoginTabs.tsx'

export function LoginCard() {
  const [type, setType] = useState<'internal' | 'external'>('internal')

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
      <img
        src="/4_IMAGOTIPO_LASALLE_MEXICO_COLOR_RGB_2020.png"
        alt="La Salle México"
        className="mb-6 h-20 w-auto"
      />
      <h1 className="mb-1 text-center text-2xl font-semibold">
        Iniciar sesión
      </h1>
      <p className="mb-6 text-center text-sm text-gray-500">
        Accede al Sistema de Planes de Estudio
      </p>

      <LoginTabs value={type} onChange={setType} />

      {type === 'internal' ? <InternalLoginForm /> : <ExternalLoginForm />}
    </div>
  )
}
