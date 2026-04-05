'use client'

import { Loader2 } from 'lucide-react'
import { useFardosData } from '@/features/fardos/hooks/use-fardos-data'
import { FardoList } from '@/features/fardos/components/fardo-list'

interface FardosClientProps {
  userId: string
  userRole: string
  userName: string
}

export function FardosClient({
  userId,
  userRole,
  userName,
}: FardosClientProps) {
  const { fardos, counters, loading, error, refetch } = useFardosData(
    userId,
    userRole,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-muted-foreground">Carregando fardos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <FardoList
      fardos={fardos}
      counters={counters}
      userRole={userRole}
      userId={userId}
      userName={userName}
      onRefetch={refetch}
    />
  )
}
