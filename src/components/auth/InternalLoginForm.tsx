import { useState } from 'react'
//import { supabase } from '@/lib/supabase'
import { Input } from '../ui/Input'
import { SubmitButton } from '../ui/SubmitButton'

export function InternalLoginForm() {
  const [clave, setClave] = useState('')
  const [password, setPassword] = useState('')

  const submit = async () => {
    /*await supabase.auth.signInWithPassword({
      email: `${clave}@ulsa.mx`,
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
      <Input label="Clave ULSA" value={clave} onChange={setClave} />
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
