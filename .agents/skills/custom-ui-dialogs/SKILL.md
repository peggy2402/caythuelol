---
name: custom-ui-dialogs
description: Design, build, and use custom gaming-themed confirmation modals and dialogs instead of native browser popups (window.alert, window.confirm).
---

# Custom UI Dialogs Skill

Use this skill whenever user interactions require confirmation, deletion, agreement, cancellation, or important notices.

## Core Rules
1. **NEVER use browser native dialogs**:
   - ❌ `window.confirm()` / `confirm()`
   - ❌ `window.alert()` / `alert()`
   - ❌ `window.prompt()` / `prompt()`

2. **ALWAYS use Rich Custom Modals**:
   - Use `@/components/ui/confirm-modal` or `@/components/ui/dialog`.
   - Ensure the modal is mounted via `createPortal` to `document.body` or Radix Dialog Portal.
   - Use dark glassmorphism styling (`bg-zinc-950/90`, `border-zinc-800`, `backdrop-blur-md`, `shadow-2xl`).
   - Include visual status icon badge:
     - Danger / Delete: `AlertTriangle` / `Trash2` in `bg-rose-500/10 text-rose-400 border-rose-500/20`
     - Warning / Dispute / Undo: `ShieldAlert` / `RotateCcw` in `bg-amber-500/10 text-amber-400 border-amber-500/20`
     - Success / Approval: `CheckCircle2` in `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`
     - Info / Guide: `Info` in `bg-cyan-500/10 text-cyan-400 border-cyan-500/20`
   - Always provide an async loading state on the confirm button (`Loader2` spinner with `disabled`).
