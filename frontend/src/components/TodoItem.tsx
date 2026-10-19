import type { Todo } from '../types/todo'
import { TitleForm } from './TitleForm'

interface Props {
  todo: Todo
  pending: boolean
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (title: string) => Promise<boolean>
  onToggle: () => void
  onDelete: () => void
}

export function TodoItem({ todo, pending, editing, onEdit, onCancel, onSave, onToggle, onDelete }: Props) {
  return <li className={`todo-item ${todo.completed ? 'is-completed' : ''}`} aria-busy={pending}>
    {editing ? <TitleForm initialValue={todo.title} editing pending={pending} onSave={onSave} onCancel={onCancel} /> : <>
      <label className="todo-check">
        <input type="checkbox" checked={todo.completed} disabled={pending} onChange={onToggle}
          aria-label={`${todo.title}: ${todo.completed ? 'aktif yap' : 'tamamla'}`} />
        <span className="todo-title">{todo.title}</span>
      </label>
      <div className="todo-actions">
        <span className="todo-state">{pending ? 'İşleniyor…' : todo.completed ? 'Tamamlandı' : 'Aktif'}</span>
        <button className="icon-button" title="Düzenle" aria-label={`${todo.title} görevini düzenle`} onClick={onEdit} disabled={pending}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z" /></svg>
        </button>
        <button className="icon-button delete-button" title="Sil" aria-label={`${todo.title} görevini sil`} onClick={onDelete} disabled={pending}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" /></svg>
        </button>
      </div>
    </>}
  </li>
}
