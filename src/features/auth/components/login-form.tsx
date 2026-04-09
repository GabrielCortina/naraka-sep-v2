'use client'

import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { nomeToEmail } from '@/features/auth/lib/slugify'

const ROLE_DEFAULTS: Record<string, string> = {
  admin: '/dashboard',
  lider: '/dashboard',
  separador: '/prateleira',
  fardista: '/fardos',
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nomeInputRef = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const email = nomeToEmail(nome)

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: pin,
      })

      if (authError || !data.session) {
        setError('Nome ou PIN incorreto')
        setLoading(false)
        nomeInputRef.current?.focus()
        return
      }

      // Check if user is active (D-10)
      const { data: userRecord } = await supabase
        .from('users')
        .select('ativo')
        .eq('id', data.user.id)
        .single()

      if (!userRecord?.ativo) {
        await supabase.auth.signOut()
        setError('Usuario desativado. Contate o administrador.')
        setLoading(false)
        return
      }

      // Extract role: try JWT claim first, fall back to database lookup
      let userRole: string | undefined
      try {
        const tokenParts = data.session.access_token.split('.')
        const payload = JSON.parse(atob(tokenParts[1]))
        userRole = payload.user_role
      } catch {
        // JWT decode failed — will fall back to DB
      }

      if (!userRole) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()
        userRole = userData?.role
      }

      // Check returnTo param (prevent open redirect: must start with / and no protocol)
      const returnTo = searchParams.get('returnTo')
      if (returnTo && returnTo.startsWith('/') && !returnTo.includes('://')) {
        router.push(returnTo)
      } else {
        const defaultRoute = userRole ? ROLE_DEFAULTS[userRole] : '/dashboard'
        router.push(defaultRoute || '/dashboard')
      }
    } catch {
      setError('Nome ou PIN incorreto')
      setLoading(false)
      nomeInputRef.current?.focus()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          ref={nomeInputRef}
          id="nome"
          type="text"
          placeholder="Seu nome"
          autoComplete="username"
          required
          minLength={2}
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            setError(null)
          }}
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pin">PIN</Label>
        <Input
          id="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          minLength={4}
          placeholder="Digite seu PIN"
          autoComplete="current-password"
          required
          value={pin}
          onChange={(e) => {
            setPin(e.target.value)
            setError(null)
          }}
          className="h-11"
        />
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive mt-2">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full h-11">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </Button>
    </form>
  )
}
