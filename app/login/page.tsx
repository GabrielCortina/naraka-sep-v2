import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { LoginForm } from '@/features/auth/components/login-form'

export const metadata: Metadata = {
  title: 'Login | NARAKA SEP v2',
}

export default function LoginPage() {
  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold text-foreground">NARAKA</h1>
          <p className="text-sm font-semibold text-muted-foreground">SEP v2</p>
        </div>
        <Card className="w-full max-w-[400px] p-8">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </Card>
      </div>
    </div>
  )
}
