import { useEffect, useRef } from 'react'

// Fecha via Escape, replicando o padrão de Sheet.tsx
export function useFecharComEsc(aberto: boolean, aoFechar: () => void) {
  const aoFecharRef = useRef(aoFechar)

  useEffect(() => {
    aoFecharRef.current = aoFechar
  })

  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFecharRef.current()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto])
}
