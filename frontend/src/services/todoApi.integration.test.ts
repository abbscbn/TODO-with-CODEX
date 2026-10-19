// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { ApiError, todoApi } from './todoApi'

const ids: number[] = []
const enabled = import.meta.env.VITE_RUN_INTEGRATION === 'true'

// İsteğe bağlı: çalışan backend üzerinde yalnızca bu testin oluşturduğu kayıtları kullanır.
describe.skipIf(!enabled)('Gerçek Spring Boot API bağlantısı', () => {
  afterAll(async () => {
    for (const id of ids) {
      try { await todoApi.remove(id) } catch (error) {
        if (!(error instanceof ApiError && error.status === 404)) throw error
      }
    }
  })

  it('frontend Fetch servisi ile tam CRUD akışını tamamlar', async () => {
    const created = await todoApi.create({ title: 'Frontend canlı bağlantı testi', completed: false })
    ids.push(created.id)
    expect(created.id).toBeGreaterThan(0)
    expect(created.completed).toBe(false)
    expect(await todoApi.get(created.id)).toEqual(created)
    expect(await todoApi.list()).toContainEqual(created)
    const updated = await todoApi.update(created.id, { title: 'Frontend güncelleme testi', completed: true })
    expect(updated.title).toBe('Frontend güncelleme testi')
    expect(updated.completed).toBe(true)
    expect((await todoApi.toggle(created.id)).completed).toBe(false)
    expect((await todoApi.get(created.id)).completed).toBe(false)
    await todoApi.remove(created.id)
    await expect(todoApi.get(created.id)).rejects.toMatchObject({ status: 404 })
    expect((await todoApi.list()).some(todo => todo.id === created.id)).toBe(false)
  })

  it('gerçek doğrulama hatasını ve Vite CORS ön isteğini işler', async () => {
    await expect(todoApi.create({ title: '   ', completed: false })).rejects.toMatchObject({
      status: 400, message: 'Başlık boş olamaz.',
    })
    const response = await fetch('http://localhost:8080/api/todos', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    })
    expect(response.ok).toBe(true)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
  })
})
