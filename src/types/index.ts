export interface Projeto {
  id: string
  usuario_id: string
  nome: string
  cor: string
  status: 'ativo' | 'encerrado'
  criado_em: string
}

export interface Configuracao {
  id: string
  usuario_id: string
  meta_semanal: number
  inicio_semana: 'segunda' | 'domingo'
  formato_horas: 'decimal' | 'hhmm'
}

export interface Registro {
  id: string
  usuario_id: string
  projeto_id: string | null
  data: string
  hora_inicio: string
  hora_fim: string
  duracao: number
  observacao: string | null
  semana_inicio: string | null
  criado_em: string
}
