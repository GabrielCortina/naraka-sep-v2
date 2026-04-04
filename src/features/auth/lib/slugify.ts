/**
 * Converte nome de usuario para email ficticio no formato slug@naraka.local.
 * Usado para autenticacao via Supabase Auth (D-02).
 *
 * Exemplos:
 *   'Joao Silva'       -> 'joao-silva@naraka.local'
 *   'Maria Conceicao'  -> 'maria-conceicao@naraka.local'
 *   'Jose da Silva'    -> 'jose-da-silva@naraka.local'
 */
export function nomeToEmail(nome: string): string {
  const slug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-')    // Substitui nao-alfanumericos por hifen
    .replace(/^-|-$/g, '')           // Remove hifens nas extremidades
  return `${slug}@naraka.local`
}
