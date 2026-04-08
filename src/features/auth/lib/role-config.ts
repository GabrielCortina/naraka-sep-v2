import type { UserRole } from '@/types'

/**
 * Rotas permitidas por role.
 * Middleware usa para verificar acesso; AppShell usa para filtrar navegacao.
 */
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  admin: ['/dashboard', '/upload', '/fardos', '/prateleira', '/transformacao', '/baixa'],
  lider: ['/dashboard', '/upload', '/fardos', '/prateleira', '/transformacao'],
  separador: ['/prateleira', '/transformacao'],
  fardista: ['/fardos', '/baixa'],
}

/**
 * Redirect padrao apos login por role (D-08).
 */
export const ROLE_DEFAULTS: Record<UserRole, string> = {
  admin: '/dashboard',
  lider: '/dashboard',
  separador: '/prateleira',
  fardista: '/fardos',
}

/**
 * Itens de navegacao com controle de visibilidade por role.
 * Icones sao nomes de componentes Lucide React.
 */
export const NAV_ITEMS: {
  label: string
  href: string
  icon: string
  roles: UserRole[]
}[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    roles: ['admin', 'lider'],
  },
  {
    label: 'Upload',
    href: '/upload',
    icon: 'Upload',
    roles: ['admin', 'lider'],
  },
  {
    label: 'Fardos',
    href: '/fardos',
    icon: 'Package',
    roles: ['admin', 'lider', 'fardista'],
  },
  {
    label: 'Prateleira',
    href: '/prateleira',
    icon: 'BookOpen',
    roles: ['admin', 'lider', 'separador'],
  },
  {
    label: 'Transformacao',
    href: '/transformacao',
    icon: 'Repeat',
    roles: ['admin', 'lider', 'separador'],
  },
  {
    label: 'Baixa',
    href: '/baixa',
    icon: 'PackageCheck',
    roles: ['admin', 'fardista'],
  },
]
