import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { buscarConfiguracoes, salvarConfiguracoes, CONFIG_PADRAO } from '../services/configuracoes'
import type { Configuracao } from '../types'

interface ConfigContextType {
  config: Omit<Configuracao, 'id' | 'usuario_id'>
  loadingConfig: boolean
  recarregarConfig: () => Promise<void>
  salvarConfig: (dados: Omit<Configuracao, 'id' | 'usuario_id'>) => Promise<void>
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [config, setConfig] = useState<Omit<Configuracao, 'id' | 'usuario_id'>>(CONFIG_PADRAO)
  const [loadingConfig, setLoadingConfig] = useState(true)

  const carregarConfig = useCallback(async () => {
    if (!user) {
      setConfig(CONFIG_PADRAO)
      setLoadingConfig(false)
      return
    }
    try {
      setLoadingConfig(true)
      const data = await buscarConfiguracoes(user.id)
      setConfig({
        meta_semanal: data.meta_semanal,
        inicio_semana: data.inicio_semana,
        formato_horas: data.formato_horas,
        inicio_dia: data.inicio_dia,
        fim_dia: data.fim_dia,
        saldo_inicio_semana: data.saldo_inicio_semana
      })
    } catch (error) {
      console.error('Erro ao carregar configurações do usuário:', error)
    } finally {
      setLoadingConfig(false)
    }
  }, [user])

  useEffect(() => {
    carregarConfig()
  }, [carregarConfig])

  const recarregarConfig = async () => {
    await carregarConfig()
  }

  const salvarConfig = async (dados: Omit<Configuracao, 'id' | 'usuario_id'>) => {
    if (!user) return
    setConfig(dados)
    try {
      await salvarConfiguracoes(user.id, dados)
    } catch (error) {
      await carregarConfig()
      throw error
    }
  }

  return (
    <ConfigContext.Provider value={{ config, loadingConfig, recarregarConfig, salvarConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}

export const useConfig = () => {
  const context = useContext(ConfigContext)
  if (context === undefined) {
    throw new Error('useConfig deve ser usado dentro de um ConfigProvider')
  }
  return context
}
