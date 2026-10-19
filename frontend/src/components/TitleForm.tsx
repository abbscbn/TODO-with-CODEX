import { useState, type FormEvent } from 'react'

interface Props {
  initialValue?: string
  editing?: boolean
  pending: boolean
  disabled?: boolean
  onSave: (title: string) => Promise<boolean>
  onCancel?: () => void
}

export function TitleForm({ initialValue = '', editing = false, pending, disabled = false, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initialValue)
  const [error, setError] = useState('')
  const inputId = editing ? 'edit-title' : 'new-title'

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending || disabled) return
    const value = title.trim()
    if (!value) { setError('Lütfen bir görev başlığı yazın.'); return }
    if (title.length > 200) { setError('Başlık en fazla 200 karakter olabilir.'); return }
    setError('')
    if (await onSave(value) && !editing) setTitle('')
  }

  return <form onSubmit={submit} className={editing ? 'title-form edit-form' : 'title-form'}>
    <label htmlFor={inputId}>{editing ? 'Görev başlığını düzenle' : 'Yeni bir görev ekle'}</label>
    <div className="input-row">
      <input id={inputId} value={title} maxLength={200} autoFocus={editing}
        placeholder="Bugün neyi tamamlamak istersin?" disabled={pending || disabled}
        aria-invalid={!!error} aria-describedby={error ? `${inputId}-error` : `${inputId}-hint`}
        onKeyDown={event => { if (event.key === 'Escape' && !pending) onCancel?.() }}
        onChange={event => { setTitle(event.target.value); setError('') }} />
      <button className="primary-button" type="submit" disabled={pending || disabled}>
        {!editing && <span aria-hidden="true">＋</span>}
        {pending ? 'Kaydediliyor…' : editing ? 'Kaydet' : 'Görev ekle'}
      </button>
      {editing && <button className="text-button" type="button" onClick={onCancel} disabled={pending || disabled}>Vazgeç</button>}
    </div>
    <div className="form-hint" id={`${inputId}-hint`}>
      <span>{editing ? 'Enter ile kaydet, Esc ile vazgeç.' : 'Küçük bir adım, daha ferah bir gün.'}</span>
      <span>{title.length}/200</span>
    </div>
    {error && <p className="field-error" id={`${inputId}-error`} role="alert">{error}</p>}
  </form>
}
