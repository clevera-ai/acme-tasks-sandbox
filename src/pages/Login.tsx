import { useState, type FormEvent } from 'react'
import { signIn } from '../lib/store'
import { DEMO_EMAIL } from '../lib/util'
import { Button, TextField } from '../components/ui'

const PASSWORD = 'AcmeDemo!2026'
const CODE = '424242'

export default function Login({ mode }: { mode: 'password' | 'password_code' }) {
  const [step, setStep] = useState<'credentials' | 'code'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const submitCredentials = (e: FormEvent) => {
    e.preventDefault()
    if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== PASSWORD) return setError('Incorrect email or password.')
    setError('')
    if (mode === 'password_code') setStep('code')
    else signIn(DEMO_EMAIL)
  }
  const submitCode = (e: FormEvent) => {
    e.preventDefault()
    if (code.trim() !== CODE) return setError("That code isn't right. Check the 6-digit code and try again.")
    signIn(DEMO_EMAIL)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-2 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">✓</span> Acme Tasks
        </div>
        {step === 'credentials' ? (
          <form onSubmit={submitCredentials} noValidate className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold">Sign in to Acme Tasks</h1>
              <p className="mt-1 text-sm text-muted">Welcome back. Enter your details to continue.</p>
            </div>
            <TextField label="Email" type="email" autoComplete="username" value={email} autoFocus onChange={(e) => setEmail(e.target.value)} />
            <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button type="submit" variant="primary" className="w-full">Sign in</Button>
          </form>
        ) : (
          <form onSubmit={submitCode} noValidate className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold">Enter your verification code</h1>
              <p className="mt-1 text-sm text-muted">We sent a 6-digit code to {DEMO_EMAIL}.</p>
            </div>
            <TextField label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} autoFocus onChange={(e) => setCode(e.target.value)} />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button type="submit" variant="primary" className="w-full">Verify and continue</Button>
            <button type="button" className="w-full text-center text-sm text-muted hover:text-ink" onClick={() => { setStep('credentials'); setCode(''); setError('') }}>Back to sign in</button>
          </form>
        )}
      </div>
    </div>
  )
}
