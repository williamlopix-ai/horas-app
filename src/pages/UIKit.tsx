import { useState, useEffect } from 'react'
import {
  Button,
  Chip,
  Surface,
  Field,
  classeCampo,
  Stat,
  DataRow,
  Sheet,
  Dica,
} from '../components/ui'
import {
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Plus,
} from 'lucide-react'

export default function UIKit() {
  const [tema, setTema] = useState<'dark' | 'light'>('dark')
  const [sheetAberto, setSheetAberto] = useState(false)
  const [textoInput, setTextoInput] = useState('')

  useEffect(() => {
    const temaAtual = document.documentElement.getAttribute('data-theme')
    if (temaAtual === 'light' || temaAtual === 'dark') {
      setTema(temaAtual)
    }
  }, [])

  const alternarTema = () => {
    const proximoTema = tema === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', proximoTema)
    setTema(proximoTema)
  }

  return (
    <div className="min-h-screen bg-surface-0 text-ink-900 p-6 md:p-10 space-y-12 max-w-5xl mx-auto">
      {/* Topo com alternador de tema */}
      <div className="flex items-center justify-between border-b border-hair pb-6">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-ink-900">
            UI Kit & Design Primitives
          </h1>
          <p className="text-[13px] text-ink-500 mt-1">
            Galeria de testes das 8 primitivas de interface (Fase 2)
          </p>
        </div>
        <Button
          variante="secundario"
          iconeEsquerda={tema === 'dark' ? <Sun className="w-icon-sm h-icon-sm" /> : <Moon className="w-icon-sm h-icon-sm" />}
          onClick={alternarTema}
        >
          Tema: {tema === 'dark' ? 'Escuro' : 'Claro'}
        </Button>
      </div>

      {/* 1. Button */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-ink-900 border-b border-hair pb-2">
          1. Button
        </h2>
        <div className="flex flex-wrap gap-md items-center">
          <Button variante="primario" tamanho="md">Primário md</Button>
          <Button variante="primario" tamanho="sm">Primário sm</Button>
          <Button variante="secundario" tamanho="md">Secundário md</Button>
          <Button variante="secundario" tamanho="sm">Secundário sm</Button>
          <Button variante="fantasma" tamanho="md">Fantasma md</Button>
          <Button variante="fantasma" tamanho="sm">Fantasma sm</Button>
          <Button variante="destrutivo" tamanho="md">Destrutivo md</Button>
          <Button variante="destrutivo" tamanho="sm">Destrutivo sm</Button>
        </div>
        <div className="flex flex-wrap gap-md items-center pt-2">
          <Button variante="primario" iconeEsquerda={<Plus className="w-icon-sm h-icon-sm" />}>
            Com Ícone
          </Button>
          <Button variante="secundario" carregando>
            Carregando
          </Button>
          <Button variante="secundario" disabled>
            Desabilitado
          </Button>
        </div>
        <div className="max-w-xs pt-2">
          <Button variante="primario" larguraTotal>
            Largura Total
          </Button>
        </div>
      </section>

      {/* 2. Chip */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-ink-900 border-b border-hair pb-2">
          2. Chip
        </h2>
        <div className="flex flex-wrap gap-md items-center">
          <Chip tom="neutro">neutro</Chip>
          <Chip tom="ok">ok (ativo)</Chip>
          <Chip tom="alerta">alerta (pendente)</Chip>
          <Chip tom="erro">erro (crítico)</Chip>
          <Chip tom="acento">acento (destaque)</Chip>
          <Chip tom="neutro" icone={<Clock className="w-icon-xs h-icon-xs" />}>
            com ícone
          </Chip>
          <Chip tom="neutro" pontoCor="var(--proj-3)">
            Projeto Alpha
          </Chip>
        </div>
      </section>

      {/* 3. Surface */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-ink-900 border-b border-hair pb-2">
          3. Surface
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
          <Surface elevacao={0} padding="md" comBorda>
            <span className="font-mono text-xs text-ink-500">Elevação 0 (com borda)</span>
          </Surface>
          <Surface elevacao={1} padding="md">
            <span className="font-mono text-xs text-ink-500">Elevação 1</span>
          </Surface>
          <Surface elevacao={2} padding="md">
            <span className="font-mono text-xs text-ink-500">Elevação 2</span>
          </Surface>
          <Surface elevacao={3} padding="md">
            <span className="font-mono text-xs text-ink-500">Elevação 3</span>
          </Surface>
        </div>
      </section>

      {/* 4. Field */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-ink-900 border-b border-hair pb-2">
          4. Field
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          <Field rotulo="Rótulo Simples">
            <input
              type="text"
              placeholder="Digite algo..."
              value={textoInput}
              onChange={(e) => setTextoInput(e.target.value)}
              className={classeCampo(false)}
            />
          </Field>
          <Field rotulo="Campo Obrigatório" obrigatorio descricao="Texto de apoio abaixo do controle">
            <input
              type="text"
              placeholder="Preenchimento obrigatório"
              className={classeCampo(false)}
            />
          </Field>
          <Field rotulo="Com Erro de Validação" obrigatorio erro="Este campo é inválido">
            <input
              type="text"
              defaultValue="Valor inválido"
              className={classeCampo(true)}
            />
          </Field>
        </div>
      </section>

      {/* 5. Stat */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-ink-900 border-b border-hair pb-2">
          5. Stat
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
          <Surface elevacao={2} padding="md" comBorda>
            <Stat
              rotulo="Total Horas"
              valor="42.50"
              unidade="h"
              tom="neutro"
              apoio="Meta da semana: 42.5h"
            />
          </Surface>
          <Surface elevacao={2} padding="md" comBorda>
            <Stat
              rotulo="Aprovado"
              valor="38.00"
              unidade="h"
              tom="ok"
              icone={<CheckCircle2 className="w-icon-sm h-icon-sm text-ok" />}
              apoio="+3.5h vs semana anterior"
            />
          </Surface>
          <Surface elevacao={2} padding="md" comBorda>
            <Stat
              rotulo="Horas Restantes"
              valor="4.50"
              unidade="h"
              tom="alerta"
              icone={<AlertCircle className="w-icon-sm h-icon-sm text-warn" />}
              apoio="Faltam 2 dias úteis"
            />
          </Surface>
          <Surface elevacao={2} padding="md" comBorda>
            <Stat
              rotulo="Estouro"
              valor="6.25"
              unidade="h"
              tom="erro"
              apoio="Acima do teto contratado"
            />
          </Surface>
        </div>
      </section>

      {/* 6. DataRow */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-ink-900 border-b border-hair pb-2">
          6. DataRow
        </h2>
        <Surface elevacao={2} padding="md" comBorda className="divide-y divide-hair">
          {/* (a) Reserva parcialmente usada */}
          <DataRow
            titulo="Desenvolvimento Frontend"
            descricao="Fase 1: Componentes e Layout"
            valor="12.50h"
            percentual={62}
            barra={{ realizado: 12.5, reservado: 20, teto: 20 }}
          />

          {/* (b) Reserva totalmente usada */}
          <DataRow
            titulo="Reuniões & Alinhamentos"
            descricao="Semana 34"
            valor="8.00h"
            percentual={100}
            barra={{ realizado: 8, reservado: 8, teto: 8 }}
          />

          {/* (c) Realizado acima do teto (barra inteira vermelha) */}
          <DataRow
            titulo="Correção de Bugs Críticos"
            descricao="Teto de 10h estourado"
            valor="14.00h"
            percentual={140}
            barra={{ realizado: 14, reservado: 10, teto: 10 }}
          />

          {/* (d) Sem reserva (percentual null, coluna vazia mas alinhada) */}
          <DataRow
            titulo="Atividades Gerais Sem Reserva"
            descricao="Lançamentos diretos"
            valor="3.25h"
            percentual={null}
          />

          {/* (e) Com slot de ações e clique na linha */}
          <DataRow
            titulo="Design de Telas & Protótipos"
            descricao="Clique na linha para testar o hover"
            valor="6.00h"
            percentual={75}
            barra={{ realizado: 6, reservado: 8, teto: 8 }}
            onClick={() => alert('Clicou na linha de Design!')}
            acoes={
              <Button
                variante="fantasma"
                tamanho="sm"
                onClick={() => alert('Clicou na ação sem disparar o clique da linha!')}
              >
                <MoreVertical className="w-icon-sm h-icon-sm" />
              </Button>
            }
          />
        </Surface>
      </section>

      {/* 7. Sheet */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-ink-900 border-b border-hair pb-2">
          7. Sheet
        </h2>
        <div>
          <Button variante="primario" onClick={() => setSheetAberto(true)}>
            Abrir Sheet de Exemplo
          </Button>
        </div>

        <Sheet
          aberto={sheetAberto}
          aoFechar={() => setSheetAberto(false)}
          titulo="Editar Lançamento"
          descricao="Exemplo de Sheet com cabeçalho fixo, corpo com rolagem e rodapé seguro."
          rodape={
            <>
              <Button variante="fantasma" onClick={() => setSheetAberto(false)}>
                Cancelar
              </Button>
              <Button variante="primario" onClick={() => setSheetAberto(false)}>
                Salvar Alterações
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field rotulo="Projeto" obrigatorio>
              <input
                type="text"
                defaultValue="HORAS App - Redesign"
                className={classeCampo(false)}
              />
            </Field>
            <Field rotulo="Observação" descricao="Detalhe as atividades desenvolvidas">
              <textarea
                rows={4}
                defaultValue="Implementação das primitivas de UI e validação de tokens."
                className={classeCampo(false)}
              />
            </Field>
            <div className="p-3 bg-surface-1 rounded-ctl border border-hair">
              <span className="text-xs text-ink-500 font-mono">
                Pressione <kbd className="px-1 py-0.5 bg-surface-3 rounded text-ink-900 font-mono">Esc</kbd> ou clique no scrim para fechar.
              </span>
            </div>
          </div>
        </Sheet>
      </section>

      {/* 8. Dica */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-ink-900 border-b border-hair pb-2">
          8. Dica
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl items-start">
          {/* a) Texto curto com Dica */}
          <Surface elevacao={1} padding="md" comBorda className="space-y-2">
            <span className="font-mono text-xs text-ink-500 block">
              a) Texto curto (sem corte)
            </span>
            <div>
              <Dica texto="Dica simples e direta sobre este item">
                <Button variante="secundario" tamanho="sm">
                  Passe o mouse ou foque aqui
                </Button>
              </Dica>
            </div>
          </Surface>

          {/* b) Texto longo truncado simulando observação em Registros */}
          <Surface elevacao={1} padding="md" comBorda className="space-y-2">
            <span className="font-mono text-xs text-ink-500 block">
              b) Texto truncado (simulando observação em Registros)
            </span>
            <div className="max-w-[240px] p-2 bg-surface-2 rounded-ctl border border-hair">
              <Dica texto="Refatoração completa da camada de serviços e sincronização com Supabase para suportar modo offline e retry automático.">
                <p className="text-sm text-ink-700 truncate min-w-0 cursor-help">
                  Refatoração completa da camada de serviços e sincronização com Supabase...
                </p>
              </Dica>
            </div>
          </Surface>

          {/* c) Container com overflow-hidden provando que o balão escapa do contorno */}
          <Surface elevacao={1} padding="md" comBorda className="space-y-2">
            <span className="font-mono text-xs text-ink-500 block">
              c) Dentro de container com overflow-hidden (balão escapa via portal)
            </span>
            <div className="overflow-hidden h-16 p-3 bg-surface-2 rounded-ctl border border-hair flex items-center justify-center">
              <Dica texto="Este balão foi renderizado no document.body via portal e não é cortado pelo overflow-hidden!">
                <Button variante="fantasma" tamanho="sm">
                  Elemento preso em overflow-hidden
                </Button>
              </Dica>
            </div>
          </Surface>

          {/* d) Próximo da borda direita da tela para verificar deslocamento */}
          <Surface elevacao={1} padding="md" comBorda className="space-y-2">
            <span className="font-mono text-xs text-ink-500 block">
              d) Próximo da borda direita (ajuste horizontal automático)
            </span>
            <div className="flex justify-end">
              <Dica texto="Balão posicionado na extremidade direita da tela, deslocado horizontalmente para respeitar a margem de 8px.">
                <Button variante="primario" tamanho="sm">
                  Alinhado à Direita
                </Button>
              </Dica>
            </div>
          </Surface>
        </div>
      </section>
    </div>
  )
}
