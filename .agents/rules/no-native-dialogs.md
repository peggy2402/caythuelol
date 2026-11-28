# Rule: Ban Native Browser Dialogs (window.confirm, window.alert, window.prompt)

## Context & Scope
Áp dụng cho toàn bộ codebase phía Frontend (React/Next.js).

## Banned Constructs
- `window.confirm(...)`
- `confirm(...)`
- `window.alert(...)`
- `alert(...)`
- `window.prompt(...)`
- `prompt(...)`

## Mandatory Replacements
1. **For Action Confirmations**: Use `@/components/ui/confirm-modal` or `@/components/ui/dialog` with dark gaming theme, backdrop blur, icon badge, clear explanation, and async loading state on confirm button.
2. **For Feedback / Alerts**: Use `toast` from `sonner` (`toast.success()`, `toast.error()`, `toast.warning()`).
