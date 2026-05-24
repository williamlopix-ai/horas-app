import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navbar */}
        <div className="flex justify-between items-center bg-[#161B22] p-6 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#03A9F4]/10 text-[#03A9F4]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">HORAS</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/projetos" 
              className="text-sm font-semibold text-gray-400 hover:text-white px-3 py-2 rounded-xl hover:bg-gray-800/40 transition-all"
            >
              Projetos
            </Link>
            <span className="h-4 w-px bg-gray-800"></span>
            <span className="text-sm text-gray-400 font-medium hidden sm:inline">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="py-2 px-4 bg-red-500/10 hover:bg-red-500/25 active:bg-red-500/30 text-red-400 text-sm font-semibold rounded-xl border border-red-500/20 transition-all focus:outline-none"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-[#161B22] p-8 rounded-2xl border border-gray-800 space-y-4">
          <h2 className="text-2xl font-bold text-white">Bem-vindo ao HORAS!</h2>
          <p className="text-gray-400 leading-relaxed">
            Seu painel administrativo de horas está pronto. Nas próximas etapas, começaremos a construir o controle de lançamentos usando a <strong>notação centesimal</strong> (onde 1h30min é representado por 1,50).
          </p>
          <div className="p-4 bg-[#0B0E14] border border-gray-800 rounded-xl">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Status da Sessão</span>
            <div className="flex items-center gap-2 text-sm text-[#03A9F4]">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
              Conectado como <strong className="text-white">{user?.email}</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
