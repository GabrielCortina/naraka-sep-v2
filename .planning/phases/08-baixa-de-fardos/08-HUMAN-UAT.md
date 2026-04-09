---
status: partial
phase: 08-baixa-de-fardos
source: [08-VERIFICATION.md]
started: 2026-04-09T10:45:00Z
updated: 2026-04-09T10:45:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Modal rendering with marketplace-colored border
expected: Modal opens with colored top border matching marketplace (e.g., Shopee orange, ML yellow)
result: [pending]

### 2. Confirm baixa end-to-end flow
expected: Click "Confirmar Baixa" → green toast, modal closes, input clears and re-focuses, item appears in BAIXADOS HOJE
result: [pending]

### 3. Duplicate scan shows yellow toast without modal
expected: Scanning same codigo IN again → yellow warning toast "Fardo ja teve baixa", no modal opens
result: [pending]

### 4. Not-found error flash
expected: Non-existent codigo IN → red toast, red border flash on input for 2 seconds
result: [pending]

### 5. Camera scanner overlay and barcode detection
expected: Camera icon → full-screen overlay, scans barcode, auto-triggers search (requires HTTPS/localhost)
result: [pending]

### 6. AGUARDAR FARDISTA unlock verified in prateleira
expected: After baixa, AGUARDAR FARDISTA items for the discharged fardo become unlocked (pendente) on prateleira
result: [pending]

### 7. Realtime list update across two sessions
expected: When another fardista does a baixa, BAIXADOS HOJE list updates in real time
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
