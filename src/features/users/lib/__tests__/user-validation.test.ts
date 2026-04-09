import { describe, it, expect } from 'vitest'
import { validateUserForm } from '../user-validation'

describe('validateUserForm', () => {
  it('returns error when nome is empty', () => {
    const result = validateUserForm({ nome: '', pin: '1234', pinConfirm: '1234', role: 'admin' })
    expect(result.valid).toBe(false)
    expect(result.errors.nome).toBe('Nome obrigatorio')
  })

  it('returns error when pin is too short', () => {
    const result = validateUserForm({ nome: 'Test', pin: '123', pinConfirm: '123', role: 'admin' })
    expect(result.valid).toBe(false)
    expect(result.errors.pin).toBe('PIN deve ter 4-6 digitos')
  })

  it('returns error when pins do not match', () => {
    const result = validateUserForm({ nome: 'Test', pin: '1234', pinConfirm: '5678', role: 'admin' })
    expect(result.valid).toBe(false)
    expect(result.errors.pinConfirm).toBe('PINs nao coincidem')
  })

  it('returns valid when all fields are correct', () => {
    const result = validateUserForm({ nome: 'Test', pin: '1234', pinConfirm: '1234', role: 'admin' })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('allows empty pin in edit mode (pinRequired: false)', () => {
    const result = validateUserForm(
      { nome: 'Test', pin: '', pinConfirm: '', role: 'admin' },
      { pinRequired: false }
    )
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('validates pinConfirm when pin provided in edit mode', () => {
    const result = validateUserForm(
      { nome: 'Test', pin: '1234', pinConfirm: '', role: 'admin' },
      { pinRequired: false }
    )
    expect(result.valid).toBe(false)
    expect(result.errors.pinConfirm).toBe('PINs nao coincidem')
  })

  it('returns error for invalid role', () => {
    const result = validateUserForm({ nome: 'Test', pin: '1234', pinConfirm: '1234', role: 'invalid' })
    expect(result.valid).toBe(false)
    expect(result.errors.role).toBe('Selecione uma funcao')
  })

  it('returns error for pin with non-numeric characters', () => {
    const result = validateUserForm({ nome: 'Test', pin: '12ab', pinConfirm: '12ab', role: 'admin' })
    expect(result.valid).toBe(false)
    expect(result.errors.pin).toBe('PIN deve ter 4-6 digitos')
  })

  it('accepts 6-digit pin', () => {
    const result = validateUserForm({ nome: 'Test', pin: '123456', pinConfirm: '123456', role: 'admin' })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })
})
