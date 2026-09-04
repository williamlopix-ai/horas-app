import {
  Clock,
  ChartNoAxesColumn,
  Table2,
  CircleDollarSign,
  Wrench,
  FolderKanban,
  Settings,
  Bell
} from 'lucide-react'

export const ITENS_NAV = [
  { rota: '/registros',   rotulo: 'Registros',   Icone: Clock },
  { rota: '/resumo',      rotulo: 'Resumo',      Icone: ChartNoAxesColumn },
  { rota: '/timesheet',   rotulo: 'Timesheet',   Icone: Table2 },
  { rota: '/billable',    rotulo: 'Billable',    Icone: CircleDollarSign },
  { rota: '/ferramentas', rotulo: 'Ferramentas', Icone: Wrench },
  { rota: '/projetos',    rotulo: 'Projetos',    Icone: FolderKanban,
    prefixos: ['/projeto'] },
  { rota: '/ajustes',     rotulo: 'Ajustes',     Icone: Settings },
  { rota: '/lembretes',   rotulo: 'Lembretes',   Icone: Bell,
    badge: true },
]
