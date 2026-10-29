import { useEffect, useRef, useState } from 'react'
import { TitleForm } from './components/TitleForm'
import { TodoItem } from './components/TodoItem'
import { todoApi } from './services/todoApi'
import type { Todo, TodoFilter } from './types/todo'

const filters: { value: TodoFilter; label: string }[] = [
  { value: 'all', label: 'Tümü' }, { value: 'active', label: 'Aktif' }, { value: 'completed', label: 'Tamamlanan' },
]

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<TodoFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [creating, setCreating] = useState(false)
  const [pending, setPending] = useState<Set<number>>(new Set())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [reload, setReload] = useState(0)
  const locks = useRef(new Set<number | 'create'>())

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    todoApi.list(controller.signal).then(data => {
      if (!controller.signal.aborted) { setTodos(data); setLoaded(true) }
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Görevler yüklenemedi.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [reload])

  async function mutate(key: number | 'create', action: () => Promise<void>, message: string): Promise<boolean> {
    if (locks.current.has(key)) return false
    locks.current.add(key)
    if (key === 'create') setCreating(true)
    else setPending(previous => new Set(previous).add(key))
    setError('')
    setNotice('')
    try {
      await action()
      setNotice(message)
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : 'İşlem tamamlanamadı. Tekrar deneyin.')
      return false
    } finally {
      locks.current.delete(key)
      if (key === 'create') setCreating(false)
      else setPending(previous => { const next = new Set(previous); next.delete(key); return next })
    }
  }

  const completed = todos.filter(todo => todo.completed).length
  const active = todos.length - completed
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('tr-TR')
  const visible = todos.filter(todo =>
    (filter === 'all' || (filter === 'completed' ? todo.completed : !todo.completed))
    && todo.title.toLocaleLowerCase('tr-TR').includes(normalizedQuery))
  const busy = loading || creating || pending.size > 0
  const counts = { all: todos.length, active, completed }
  const replaceTodo = (updated: Todo) => setTodos(previous => previous.map(todo => todo.id === updated.id ? updated : todo))

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="/" aria-label="Todo ana sayfa"><span className="brand-mark" aria-hidden="true">✓</span>todo<span className="brand-dot">.</span></a><span className="topbar-caption">DAHA AZ KARMAŞA, DAHA ÇOK ODAK</span></header>
    <main>
      <section className="intro" aria-labelledby="page-title">
        <span className="eyebrow"><span aria-hidden="true">✦</span> GÜNÜNE YER AÇ</span>
        <h1 id="page-title">Büyük işler,<br /><span>küçük adımlarla.</span></h1>
        <p>Aklındakileri bir yere bırak. Önceliklerini belirle,<br className="desktop-break" /> birer birer tamamla ve ilerlemenin keyfini çıkar.</p>
      </section>
      <section className="stats" aria-label="Görev istatistikleri">
        {[['Toplam görev', todos.length, 'total'], ['Aktif görev', active, 'active'], ['Tamamlanan', completed, 'done']].map(([label, count, style]) =>
          <div className={`stat ${style}`} key={label}><span className="stat-dot" aria-hidden="true" /><span className="stat-label">{label}</span><strong>{loaded ? count : '—'}</strong></div>)}
      </section>
      <section className="workspace" aria-label="Görev yönetimi">
        <div className="create-area"><TitleForm pending={creating} disabled={loading || !loaded}
          onSave={title => mutate('create', async () => {
            const created = await todoApi.create({ title, completed: false })
            setTodos(previous => [...previous, created])
            setFilter('all')
          }, 'Yeni görev eklendi.')} /></div>
        {error && <div className="error-banner" role="alert"><span>{error}</span><button className="text-button" disabled={busy} onClick={() => { setEditingId(null); setReload(value => value + 1) }}>Listeyi yenile</button></div>}
        <p className="sr-only" role="status">{notice}</p>
        <div className="list-toolbar">
          <div className="filters" role="group" aria-label="Görev filtresi">{filters.map(item => <button type="button" key={item.value} aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}>{item.label}<span>{loaded ? counts[item.value] : '—'}</span></button>)}</div>
          <button className="refresh-button" disabled={busy} onClick={() => { setEditingId(null); setReload(value => value + 1) }} aria-label="Görev listesini yenile">↻</button>
        </div>
        <div className="search-area">
          <label htmlFor="todo-search">Görev başlığında ara</label>
          <input id="todo-search" type="search" value={searchQuery} placeholder="Başlığa göre ara…"
            onChange={event => setSearchQuery(event.target.value)} />
        </div>
        {loading ? <div className="empty-state" role="status"><span className="spinner" />Görevlerin yükleniyor…</div>
          : !loaded ? <div className="empty-state"><span className="empty-icon" aria-hidden="true">↔</span><h2>Bağlantıyı bekliyoruz</h2><p>Backend’i başlattıktan sonra listeyi yenileyebilirsin.</p></div>
          : visible.length === 0 && normalizedQuery ? <div className="empty-state" role="status"><h2>Aramanızla eşleşen görev bulunamadı.</h2><p>Seçili filtrede sonuç yok. Arama metnini değiştirin veya başka bir filtre seçin.</p></div>
          : visible.length === 0 ? <div className="empty-state"><span className="empty-icon" aria-hidden="true">✓</span><h2>{filter === 'completed' ? 'Tamamlanan görev yok' : filter === 'active' && todos.length ? 'Hepsi tamam! Güzel iş.' : 'Yeni bir başlangıca ne dersin?'}</h2><p>{filter === 'completed' ? 'Tamamladığın görevler burada görünecek.' : filter === 'active' && todos.length ? 'Kendine küçük bir mola verebilirsin.' : 'İlk görevini yukarıdan ekle. Gerisi adım adım gelir.'}</p></div>
          : <ul className="todo-list" aria-label="Görevler">{visible.map(todo => <TodoItem key={todo.id} todo={todo} pending={pending.has(todo.id)} editing={editingId === todo.id}
            onEdit={() => setEditingId(todo.id)} onCancel={() => setEditingId(null)}
            onSave={title => mutate(todo.id, async () => {
              replaceTodo(await todoApi.update(todo.id, { title, completed: todo.completed }))
              setEditingId(current => current === todo.id ? null : current)
            }, 'Görev güncellendi.')}
            onToggle={() => { void mutate(todo.id, async () => replaceTodo(await todoApi.toggle(todo.id)), 'Görev durumu güncellendi.') }}
            onDelete={() => { void mutate(todo.id, async () => {
              await todoApi.remove(todo.id)
              setTodos(previous => previous.filter(item => item.id !== todo.id))
            }, 'Görev silindi.') }} />)}</ul>}
        <div className="list-footer"><span>{loaded ? `${active} görev seni bekliyor` : 'Görevlerin için sakin bir alan'}</span><span>Her adım önemli <span aria-hidden="true">✦</span></span></div>
      </section>
      <footer className="page-footer">Bir işi bitirmenin en iyi yolu, başlamaktır.</footer>
    </main>
  </div>
}
