import { describe, it, expect } from 'vitest'
import { classifyEnvio } from '../envio-groups'

describe('classifyEnvio', () => {
  it('classifica TikTok', () => {
    expect(classifyEnvio('TikTok - Envio Normal')).toBe('TikTok Shop')
  })

  it('classifica iMile BR como TikTok Shop', () => {
    expect(classifyEnvio('iMile BR')).toBe('TikTok Shop')
  })

  it('classifica Shopee SPX', () => {
    expect(classifyEnvio('Shopee SPX Express')).toBe('Shopee SPX')
  })

  it('classifica Entrega Rápida como Shopee SPX', () => {
    expect(classifyEnvio('Entrega Rápida')).toBe('Shopee SPX')
    expect(classifyEnvio('Entrega Rapida')).toBe('Shopee SPX')
  })

  it('classifica ML Flex', () => {
    expect(classifyEnvio('Mercado Livre Flex')).toBe('ML Flex')
  })

  it('classifica ML Coleta', () => {
    expect(classifyEnvio('Mercado Envios Coleta')).toBe('ML Coleta')
  })

  it('classifica Shein', () => {
    expect(classifyEnvio('Shein Express')).toBe('Shein')
  })

  it('classifica JTB como Shein', () => {
    expect(classifyEnvio('JTB')).toBe('Shein')
  })

  it('classifica Shopee Xpress', () => {
    expect(classifyEnvio('Shopee Xpress')).toBe('Shopee Xpress')
  })

  it('TikTok verificado ANTES de Shopee Xpress (D-08)', () => {
    expect(classifyEnvio('TikTok Xpress Envio')).toBe('TikTok Shop')
  })

  it('retorna Outro para metodo desconhecido', () => {
    expect(classifyEnvio('Correios SEDEX')).toBe('Outro')
  })

  it('case-insensitive', () => {
    expect(classifyEnvio('TIKTOK envio')).toBe('TikTok Shop')
  })
})
