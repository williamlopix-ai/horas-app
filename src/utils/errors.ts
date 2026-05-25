export function getErrorMessage(error: any): string {
  // Converte erro para string para facilitar a busca
  const errorStr = String(error?.message || error?.error_description || error?.code || error).toLowerCase()
  const status = error?.status || error?.code

  // 1. Erros de Rede
  if (
    errorStr.includes('failed to fetch') ||
    errorStr.includes('network error') ||
    errorStr.includes('networkerror') ||
    errorStr.includes('offline')
  ) {
    return 'Sem conexão. Verifique sua internet.'
  }

  // 2. Erros de Autenticação (Supabase)
  if (
    status === 401 ||
    status === 403 ||
    errorStr.includes('jwt') ||
    errorStr.includes('auth') ||
    errorStr.includes('token') ||
    errorStr.includes('invalid credentials') ||
    errorStr.includes('unauthorized')
  ) {
    return 'Sessão expirada. Faça login novamente.'
  }

  // 3. Fallback Genérico — exibe mensagem original se disponível
  return error?.message
    ? `Erro: ${error.message}`
    : 'Algo deu errado. Tente novamente.'
}
