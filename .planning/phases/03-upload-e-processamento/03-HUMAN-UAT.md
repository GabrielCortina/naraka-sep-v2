---
status: partial
phase: 03-upload-e-processamento
source: [03-VERIFICATION.md]
started: 2026-04-04T23:30:00Z
updated: 2026-04-04T23:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Fluxo end-to-end com planilha real
expected: Arrastar arquivo .xlsx do ERP → parse → preview com 12 pedidos → confirmar → pedidos no Supabase com card_key, grupo_envio, tipo, importacao_numero corretos
result: [pending]

### 2. Virada de dia
expected: Alterar ultima_importacao_data no Supabase para ontem, fazer novo upload → toast "Virada de dia" e banco limpo antes da nova importação
result: [pending]

### 3. Botão Desfazer
expected: Após importação real, clicar Desfazer e confirmar → pedidos removidos do Supabase e lista atualizada
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
