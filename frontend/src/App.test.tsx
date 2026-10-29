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
  const noResults = 'Aramanızla eşleşen görev bulunamadı.'
  const search = (value: string) => fireEvent.change(screen.getByRole('searchbox', { name: 'Görev başlığında ara' }), { target: { value } })

  it('ortak aramayı tüm filtrelerde uygular, metni ve sayaçları korur, ek istek göndermez', async () => {
    await start([task, { id: 2, title: 'Biten görev', completed: true }, { id: 3, title: 'Alışveriş', completed: false }])
    search('görev')
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
    expect(screen.queryByText('Alışveriş')).toBeNull()
    for (const [filter, title] of [['Aktif 2', 'İlk görev'], ['Tamamlanan 1', 'Biten görev'], ['Tümü 3', 'İlk görev']]) {
      fireEvent.click(screen.getByRole('button', { name: filter }))
      expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('görev')
      expect(screen.getByText(title)).toBeTruthy()
      if (filter !== 'Tümü 3') expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    }
    expect(screen.getByText('Toplam görev').parentElement?.textContent).toContain('3')
    expect(screen.getByText('Aktif görev').parentElement?.textContent).toContain('2')
    expect(screen.getByRole('button', { name: 'Tamamlanan 1' })).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['İLK', 'İlk görev'], ['ilk', 'İlk görev'], ['IŞIK', 'Işık al'], ['ışık', 'Işık al'],
    ['ÇÖZÜM', 'Çözüm üret'], ['  görev  ', 'İlk görev'],
  ])('Türkçe harflerle ve boşluklarla %s sorgusunu eşleştirir', async (query, title) => {
    await start([task, { id: 2, title: 'Işık al', completed: false }, { id: 3, title: 'Çözüm üret', completed: true }])
    search(query)
    expect(screen.getByText(title)).toBeTruthy()
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
  })

  it('sonuç bulunamadığını duyurur, arama temizlenince seçili filtrenin boş durumunu korur', async () => {
    await start()
    search('bulunmayan')
    expect(screen.getByText(noResults).closest('[role="status"]')).toBeTruthy()
    search('')
    expect(screen.getByText('İlk görev')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tamamlanan 0' }))
    search('görev')
    expect(screen.getByText(noResults)).toBeTruthy()
    search('   ')
    expect(screen.getByText('Tamamlanan görev yok')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tümü 1' }))
    expect(screen.getByText('İlk görev')).toBeTruthy()
  })

  it('arama sırasında yükleme ve bağlantı durumlarına öncelik verir', async () => {
    let finish!: (value: Response) => void
    fetchMock.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    render(<App />)
    search('bulunmayan')
    expect(screen.getByText('Görevlerin yükleniyor…')).toBeTruthy()
    expect(screen.queryByText(noResults)).toBeNull()
    finish(respond({}, 500))
    await screen.findByText('Bağlantıyı bekliyoruz')
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.queryByText(noResults)).toBeNull()
  })

  it('arama sonuçlarını düzenleme, durum değiştirme ve silme sonrasında günceller', async () => {
    await start([task, { id: 2, title: 'Diğer görev', completed: false }])
    search('görev')
    fireEvent.click(screen.getByRole('button', { name: 'İlk görev görevini düzenle' }))
    fireEvent.change(screen.getByLabelText('Görev başlığını düzenle'), { target: { value: 'Yeni başlık' } })
    fetchMock.mockResolvedValueOnce(respond({ ...task, title: 'Yeni başlık' }))
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }))
    await waitFor(() => expect(screen.queryByLabelText('Görev başlığını düzenle')).toBeNull())
    expect(screen.queryByText('Yeni başlık')).toBeNull()
    expect(screen.getByText('Diğer görev')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Aktif 2' }))
    fetchMock.mockResolvedValueOnce(respond({ id: 2, title: 'Diğer görev', completed: true }))
    fireEvent.click(screen.getByRole('checkbox'))
    await screen.findByText(noResults)
    fireEvent.click(screen.getByRole('button', { name: 'Tamamlanan 1' }))
    expect(screen.getByText('Diğer görev')).toBeTruthy()
    fetchMock.mockResolvedValueOnce(respond(null, 204))
    fireEvent.click(screen.getByRole('button', { name: 'Diğer görev görevini sil' }))
    await screen.findByText(noResults)
    expect(screen.getByRole('button', { name: 'Tümü 1' })).toBeTruthy()
    search('')
    expect(screen.getByText('Tamamlanan görev yok')).toBeTruthy()
  })

  it('ekleme sonrasında Tümü filtresine geçer ve arama metnini korur', async () => {
    await start()
    search('Yeni')
    fireEvent.click(screen.getByRole('button', { name: 'Tamamlanan 0' }))
    const input = screen.getByLabelText('Yeni bir görev ekle')
    fireEvent.change(input, { target: { value: 'Yeni görev' } })
    fetchMock.mockResolvedValueOnce(respond({ id: 2, title: 'Yeni görev', completed: false }, 201))
    fireEvent.submit(input.closest('form')!)
    await screen.findByText('Yeni görev')
    expect(screen.getByRole('button', { name: 'Tümü 2' }).getAttribute('aria-pressed')).toBe('true')
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('Yeni')
    expect(screen.queryByText('İlk görev')).toBeNull()
  })

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
