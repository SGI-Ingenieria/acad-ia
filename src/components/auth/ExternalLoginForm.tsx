import { useState } from 'react'
//import { supabase } from '@/lib/supabase'
import { Input } from '../ui/Input'
import { SubmitButton } from '../ui/SubmitButton'

export function ExternalLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = async () => {
    /*await supabase.auth.signInWithPassword({
      email,
      password,
    })*/
  }

  return (
    <form
      className="space-y-4"
      onSubmit={e => {
        e.preventDefault()
        submit()
      }}
    >
      <Input label="Correo electrónico" value={email} onChange={setEmail} />
      <Input
        label="Contraseña"
        type="password"
        value={password}
        onChange={setPassword}
      />
      <SubmitButton />
    </form>
  )
}
