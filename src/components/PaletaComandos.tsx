import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Search, FolderKanban } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { listarProjetos } from '../services/projetos'
import type { Projeto } from '../types'
import { ITENS_NAV } from './itensNav'

interface PaletaComandosProps {
  aberta: boolean
  aoFechar: () => void
}

export default function PaletaComandos({ aberta, aoFechar }: PaletaComandosProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [carregandoProjetos, setCarregandoProjetos] = useState(false)
  const [projetosCarregados, setProjetosCarregados] = useState(false)

  // Limpa o texto da busca sempre que a paleta fechar
  useEffect(() => {
    if (!aberta) {
      setBusca('')
    }
  }, [aberta])

  // Carregamento sob demanda dos projetos ativos (apenas na primeira abertura)
  useEffect(() => {
    if (aberta && !projetosCarregados && !carregandoProjetos && user) {
      setCarregandoProjetos(true)
      listarProjetos(user.id, false)
        .then((lista) => {
          const ativos = lista.filter((p) => p.status === 'ativo')
          setProjetos(ativos)
          setProjetosCarregados(true)
        })
        .catch(() => {
          // Falha em silêncio: o grupo Projetos não é exibido e a navegação segue funcionando
          setProjetosCarregados(true)
        })
        .finally(() => {
          setCarregandoProjetos(false)
        })
    }
  }, [aberta, projetosCarregados, carregandoProjetos, user])

  const navegarPara = (rota: string) => {
    setBusca('')
    aoFechar()
    navigate(rota)
  }

  return (
    <Command.Dialog
      open={aberta}
      onOpenChange={(open) => {
        if (!open) {
          aoFechar()
        }
      }}
      label="Paleta de comandos"
      overlayClassName="fixed inset-0 z-50 bg-[var(--scrim)]"
      contentClassName="fixed left-1/2 top-[12vh] -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[560px] bg-surface-2 rounded-sheet shadow-e3 border border-hair overflow-hidden outline-none font-ui"
    >
      <div className="flex items-center px-4 border-b border-hair">
        <Search className="w-icon-sm h-icon-sm text-ink-500 shrink-0 mr-3" />
        <Command.Input
          value={busca}
          onValueChange={setBusca}
          placeholder="Buscar comando ou projeto..."
          className="w-full py-3.5 bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none font-ui"
        />
      </div>

      <Command.List className="max-h-[320px] overflow-y-auto p-2 font-ui">
        <Command.Empty className="py-6 text-center text-sm text-ink-500">
          Nenhum resultado encontrado.
        </Command.Empty>

        <Command.Group
          heading="Navegação"
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-ink-500"
        >
          {ITENS_NAV.map((item) => {
            const Icone = item.Icone
            return (
              <Command.Item
                key={item.rota}
                value={item.rotulo}
                onSelect={() => navegarPara(item.rota)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-ctl text-sm text-ink-900 cursor-pointer select-none data-[selected=true]:bg-accent-bg data-[selected=true]:text-accent-fg transition-colors duration-d1 ease-ez"
              >
                <Icone className="w-icon-sm h-icon-sm shrink-0" />
                <span className="flex-1 truncate">{item.rotulo}</span>
              </Command.Item>
            )
          })}
        </Command.Group>

        {(carregandoProjetos || projetos.length > 0) && (
          <Command.Group
            heading="Projetos"
            className="mt-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-ink-500"
          >
            {carregandoProjetos ? (
              <div className="px-3 py-2.5 text-xs text-ink-500">
                Carregando projetos...
              </div>
            ) : (
              projetos.map((projeto) => (
                <Command.Item
                  key={projeto.id}
                  value={`${projeto.nome} ${projeto.codigo_externo ?? ''}`}
                  onSelect={() => navegarPara(`/projeto/${projeto.id}`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-ctl text-sm text-ink-900 cursor-pointer select-none data-[selected=true]:bg-accent-bg data-[selected=true]:text-accent-fg transition-colors duration-d1 ease-ez"
                >
                  <FolderKanban className="w-icon-sm h-icon-sm shrink-0" />
                  <span className="flex-1 truncate">{projeto.nome}</span>
                  {projeto.codigo_externo && (
                    <span className="text-xs font-mono text-ink-500 opacity-80">
                      {projeto.codigo_externo}
                    </span>
                  )}
                </Command.Item>
              ))
            )}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  )
}
