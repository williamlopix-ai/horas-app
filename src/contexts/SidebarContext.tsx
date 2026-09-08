import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface SidebarContextType {
  recolhida: boolean
  alternarRecolhida: () => void
  setRecolhida: React.Dispatch<React.SetStateAction<boolean>>
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [recolhida, setRecolhida] = useState(false)
  const prevUserIdRef = useRef<string | undefined>(user?.id)

  useEffect(() => {
    // Reset no mount é redundante e inofensivo pois o estado inicial já é false; o efeito garante reset na transição de user.id (login ou logout)
    if (prevUserIdRef.current !== user?.id) {
      setRecolhida(false)
      prevUserIdRef.current = user?.id
    }
  }, [user?.id])

  const alternarRecolhida = () => setRecolhida(prev => !prev)

  return (
    <SidebarContext.Provider value={{ recolhida, alternarRecolhida, setRecolhida }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar deve ser usado dentro de um SidebarProvider')
  }
  return context
}
