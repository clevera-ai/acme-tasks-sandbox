import {
  createContext, useCallback, useContext, useEffect, useState,
  type ButtonHTMLAttributes, type FormEvent, type InputHTMLAttributes, type ReactNode,
  type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react'
import { initials, PROJECT_COLORS } from '../lib/util'

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; size?: 'sm' | 'md' }
export function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...p }: BtnProps) {
  const v = {
    primary: 'bg-brand text-white border-transparent hover:bg-brand-hover',
    secondary: 'bg-surface text-ink border-line hover:bg-soft',
    danger: 'bg-red-600 text-white border-transparent hover:bg-red-700',
    ghost: 'bg-transparent text-muted border-transparent hover:bg-soft hover:text-ink',
  }[variant]
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-ui border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        size === 'sm' ? 'px-2.5 py-1 text-sm' : 'px-4 py-2 text-sm', v, className,
      )}
      {...p}
    />
  )
}

const fieldCls = 'w-full rounded-ui border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-2 focus:outline-brand'

export function TextField({ label, hint, error, className, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  return (
    <label className={cx('block text-sm', className)}>
      <span className="mb-1 block font-medium">{label}</span>
      <input className={cx(fieldCls, error && 'border-red-500')} {...p} />
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export function SelectField({ label, children, className, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className={cx('block text-sm', className)}>
      <span className="mb-1 block font-medium">{label}</span>
      <select className={fieldCls} {...p}>{children}</select>
    </label>
  )
}

export function TextArea({ label, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <textarea rows={3} className={fieldCls} {...p} />
    </label>
  )
}

export function Modal({ title, onClose, children, footer, onSubmit }: {
  title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; onSubmit?: (e: FormEvent) => void
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  const Wrap = onSubmit ? 'form' : 'div'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
        <Wrap {...(onSubmit ? { onSubmit, noValidate: true } : {})}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-ui px-2 text-xl leading-none text-muted hover:bg-soft hover:text-ink">×</button>
          </div>
          <div className="space-y-4 px-5 py-5">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
        </Wrap>
      </div>
    </div>
  )
}

export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }: {
  title: string; message: ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={<>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </>}
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  )
}

interface Toast { id: number; message: string }
const ToastCtx = createContext<(m: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-ui border border-line bg-surface px-4 py-3 text-sm shadow-lg">
            <span aria-hidden className="mt-0.5 text-emerald-500">✓</span>
            <span className="flex-1">{t.message}</span>
            <button aria-label="Dismiss notification" className="text-muted hover:text-ink" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>×</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function Avatar({ name, text, size = 32 }: { name: string; text?: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >{text ?? initials(name)}</span>
  )
}

export function Badge({ tone = 'gray', children }: { tone?: 'gray' | 'green' | 'amber' | 'red' | 'blue'; children: ReactNode }) {
  const c = {
    gray: 'bg-soft text-muted',
    green: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    red: 'bg-red-500/15 text-red-700 dark:text-red-300',
    blue: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  }[tone]
  return <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', c)}>{children}</span>
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand', checked ? 'bg-brand' : 'bg-line')}
    >
      <span className={cx('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
    </button>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-2xl border border-line bg-surface p-[var(--card-pad)]', className)}>{children}</div>
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium" id="colour-label">Colour</span>
      <div role="radiogroup" aria-labelledby="colour-label" className="flex flex-wrap gap-2">
        {PROJECT_COLORS.map((c) => (
          <button
            key={c.value} type="button" role="radio" aria-checked={value === c.value} aria-label={c.name} title={c.name}
            onClick={() => onChange(c.value)}
            className={cx('h-8 w-8 rounded-full border-2 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand', value === c.value ? 'scale-110 border-ink' : 'border-transparent')}
            style={{ background: c.value }}
          />
        ))}
      </div>
    </div>
  )
}
