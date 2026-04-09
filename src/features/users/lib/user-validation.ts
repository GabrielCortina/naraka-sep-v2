export interface UserFormData {
  nome: string
  pin: string
  pinConfirm: string
  role: string
}

export interface ValidationErrors {
  nome?: string
  pin?: string
  pinConfirm?: string
  role?: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationErrors
}

export interface ValidationOptions {
  pinRequired?: boolean // true for create, false for edit
}

export function validateUserForm(
  data: UserFormData,
  options: ValidationOptions = { pinRequired: true }
): ValidationResult {
  const errors: ValidationErrors = {}

  // Nome validation
  if (!data.nome || data.nome.trim().length === 0) {
    errors.nome = 'Nome obrigatorio'
  }

  // Role validation
  const validRoles = ['admin', 'lider', 'separador', 'fardista']
  if (!data.role || !validRoles.includes(data.role)) {
    errors.role = 'Selecione uma funcao'
  }

  // PIN validation
  const pinProvided = data.pin.length > 0
  if (options.pinRequired && !pinProvided) {
    errors.pin = 'PIN deve ter 4-6 digitos'
  } else if (pinProvided) {
    if (!/^\d{4,6}$/.test(data.pin)) {
      errors.pin = 'PIN deve ter 4-6 digitos'
    } else if (data.pin !== data.pinConfirm) {
      errors.pinConfirm = 'PINs nao coincidem'
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
