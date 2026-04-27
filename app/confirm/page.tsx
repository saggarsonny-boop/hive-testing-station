'use client'
import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function Redirector() {
  const params = useSearchParams()
  const router = useRouter()
  const id = params.get('id')
  useEffect(() => {
    if (id) router.replace(`/confirm/${id}`)
    else router.replace('/')
  }, [id, router])
  return <div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>Loading…</div>
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>Loading…</div>}>
      <Redirector />
    </Suspense>
  )
}
