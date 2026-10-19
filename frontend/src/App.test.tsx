import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const fetchMock = vi.fn<typeof fetch>()
const task = { id: 1, title: 'İlk görev', completed: false }
const respond = (body: unknown, status = 200) => new Response(status === 204 ? null : JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
})

beforeEach(() => { vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset() })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

async function start(todos = [task]) {
  fetchMock.mockResolvedValueOnce(respond(todos))
  render(<App />)
  await screen.findByRole('checkbox', { name: 'İlk görev: tamamla' })
}

describe('Todo uygulaması', () => {
  it('listeyi yükler, filtreler ve sayıları gösterir', async () => {
    await start([task, { id: 2, title: 'Biten görev', completed: true }])
    expect(screen.getByText('Biten görev')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Aktif 1' }))
    expect(screen.queryByText('Biten görev')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Tamamlanan 1' }))
    expect(screen.queryByText('İlk görev')).toBeNull()
    expect(screen.getByText('Biten görev')).toBeTruthy()
    expect(screen.getByText('Toplam görev').parentElement?.textContent).toContain('2')
  })

  it('form gönderimiyle görev ekler ve başlığı temizler', async () => {
    await start()
    fetchMock.mockResolvedValueOnce(respond({ id: 3, title: 'Yeni görev', completed: false }, 201))
    const input = screen.getByLabelText('Yeni bir görev ekle') as HTMLInputElement
    fireEvent.change(input, { target: { value: '  Yeni görev  ' } })
    fireEvent.submit(input.closest('form')!)
    await screen.findByText('Yeni görev')
    expect(input.value).toBe('')
    expect(fetchMock).toHaveBeenLastCalledWith('http://localhost:8080/api/todos', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ title: 'Yeni görev', completed: false }),
    }))
  })

  it('boş ve 200 karakteri aşan başlıkları API’ye göndermez', async () => {
    await start()
    const input = screen.getByLabelText('Yeni bir görev ekle')
    for (const value of ['   ', 'a'.repeat(201)]) {
      fireEvent.change(input, { target: { value } })
      fireEvent.submit(input.closest('form')!)
      expect(screen.getByRole('alert')).toBeTruthy()
    }
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(input.getAttribute('maxlength')).toBe('200')
  })

  it('başlığı düzenler, PUT isteğinde tamamlanma durumunu korur', async () => {
    await start()
    fireEvent.click(screen.getByRole('button', { name: 'İlk görev görevini düzenle' }))
    const input = screen.getByLabelText('Görev başlığını düzenle')
    fireEvent.change(input, { target: { value: 'Güncel görev' } })
    fetchMock.mockResolvedValueOnce(respond({ ...task, title: 'Güncel görev' }))
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }))
    await screen.findByText('Güncel görev')
    expect(fetchMock).toHaveBeenLastCalledWith('http://localhost:8080/api/todos/1', expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ title: 'Güncel görev', completed: false }),
    }))
  })

  it('checkbox ile toggle yapar ve tamamlanan sayısını günceller', async () => {
    await start()
    fetchMock.mockResolvedValueOnce(respond({ ...task, completed: true }))
    fireEvent.click(screen.getByRole('checkbox'))
    await screen.findByRole('checkbox', { name: 'İlk görev: aktif yap' })
    expect(fetchMock).toHaveBeenLastCalledWith('http://localhost:8080/api/todos/1/toggle', expect.objectContaining({ method: 'PATCH' }))
    expect(screen.getByRole('button', { name: 'Tamamlanan 1' })).toBeTruthy()
  })

  it('görevi siler ve boş liste mesajını gösterir', async () => {
    await start()
    fetchMock.mockResolvedValueOnce(respond(null, 204))
    fireEvent.click(screen.getByRole('button', { name: 'İlk görev görevini sil' }))
    await screen.findByText('Yeni bir başlangıca ne dersin?')
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(fetchMock).toHaveBeenLastCalledWith('http://localhost:8080/api/todos/1', expect.objectContaining({ method: 'DELETE' }))
  })

  it('backend kapalıysa bağlantı hatası gösterir ve tekrar deneyebilir', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    render(<App />)
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByText(/Sunucuya ulaşılamıyor/)).toBeTruthy()
    fetchMock.mockResolvedValueOnce(respond([]))
    fireEvent.click(screen.getByRole('button', { name: 'Listeyi yenile' }))
    await screen.findByText('Yeni bir başlangıca ne dersin?')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('API başlık hatasını gösterir, başarısız eklemede metni korur', async () => {
    await start()
    const input = screen.getByLabelText('Yeni bir görev ekle') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Yeni görev' } })
    fetchMock.mockResolvedValueOnce(respond({ status: 400, errors: { title: 'Başlık geçersiz.' } }, 400))
    fireEvent.submit(input.closest('form')!)
    await screen.findByText('Başlık geçersiz.')
    expect(input.value).toBe('Yeni görev')
    expect(screen.queryByText('Yeni görev')).toBeNull()
  })

  it('işlem sürerken ilgili kontrolleri kilitler, aynı kaydı tekrar göndermez', async () => {
    await start()
    let finish!: (value: Response) => void
    fetchMock.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const row = screen.getByRole('checkbox').closest('li')!
    fireEvent.click(within(row).getByRole('checkbox'))
    expect((within(row).getByRole('checkbox') as HTMLInputElement).disabled).toBe(true)
    expect((within(row).getByRole('button', { name: /sil/ }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(within(row).getByRole('checkbox'))
    expect(fetchMock).toHaveBeenCalledTimes(2)
    finish(respond({ ...task, completed: true }))
    await waitFor(() => expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(false))
  })

  it('ilk yüklemede loading gösterir', () => {
    fetchMock.mockReturnValueOnce(new Promise(() => {}))
    render(<App />)
    expect(screen.getByText('Görevlerin yükleniyor…')).toBeTruthy()
    expect((screen.getByRole('button', { name: /Görev ekle/ }) as HTMLButtonElement).disabled).toBe(true)
  })
})
