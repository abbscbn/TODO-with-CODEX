# Codex ile İlk Projem

Bu proje, Codex kullanmayı öğrenmek ve bir yazılım projesinde Codex ile birlikte çalışma deneyimi kazanmak amacıyla oluşturulmuştur. Küçük ve anlaşılır görevlerle başlayarak proje geliştirme sürecini adım adım keşfedeceğiz.

## Codex ile Neler Öğreneceğiz?

- Projedeki dosya ve klasörleri incelemeyi ve proje yapısını anlamayı.
- Yapılacak işi açıkça tanımlayan, kapsamı ve kısıtları belirten talimatlar yazmayı.
- Kod ve dokümantasyon oluşturmayı, mevcut içerikleri düzenlemeyi.
- Kodun nasıl çalıştığını açıklamalar ve örneklerle anlamayı.
- Hataları tespit etmeyi, çözüm geliştirmeyi ve sonuçları kontrol etmeyi.
- Terminal komutlarını anlamayı ve gerektiğinde kullanmayı.
- Yapılan değişiklikleri incelemeyi ve özetlemeyi.

## Çalışma Yaklaşımımız

Her görevde önce mevcut durumu inceleyecek, ardından yalnızca istenen kapsamda değişiklik yapacağız. Sonuçları kontrol ederek nelerin değiştiğini ve neden değiştiğini değerlendireceğiz.

Bu ilk görevde boş proje klasörü incelenmiş ve projenin amacını açıklayan bu README dosyası oluşturulmuştur.

## Backend Kurulumu ve Çalıştırma

Backend projesi `backend/` klasöründe bulunur. Kullanılan teknolojiler Java 21, Spring Boot 4.1.1, Maven Wrapper, Spring Data JPA ve H2'dir.

Komutları çalıştırmadan önce Java 21 (JDK) kurulu olmalıdır. Maven Wrapper sayesinde ayrıca Maven kurmanız gerekmez. İlk çalıştırmada Maven ve proje bağımlılıkları internetten indirilebilir; bu nedenle internet bağlantısı gerekebilir.

Repository kökünden backend dizinine geçin:

```sh
cd backend
```

Aşağıdaki komutları `backend/` dizininde çalıştırın.

Uygulamayı başlatmak için:

```sh
./mvnw spring-boot:run
```

Testleri çalıştırmak için:

```sh
./mvnw test
```

Doğrulama ve paketleme için (testleri de çalıştırır):

```sh
./mvnw verify
```

Windows'ta aynı komutlarda `./mvnw` yerine `mvnw.cmd` kullanabilirsiniz.

H2 veritabanı bellekte çalışır (`jdbc:h2:mem:tododb`). Veriler kalıcı değildir; uygulama kapandığında kaybolur.

## Todo REST API

Backend adresi: `http://localhost:8080`. React/Vite için `http://localhost:5173` origin'ine CORS izni verilmiştir.

| Metot | Endpoint | İşlem | Başarı kodu |
| --- | --- | --- | --- |
| GET | `/api/todos` | Tüm kayıtlar (ID sırasıyla) | 200 |
| GET | `/api/todos/{id}` | Tek kayıt | 200 |
| POST | `/api/todos` | Yeni kayıt | 201 |
| PUT | `/api/todos/{id}` | Başlık ve tamamlanma durumunu güncelle | 200 |
| PATCH | `/api/todos/{id}/toggle` | Tamamlanma durumunu tersine çevir | 200 |
| DELETE | `/api/todos/{id}` | Kaydı sil | 204 |

POST ve PUT isteklerinde `Content-Type: application/json` kullanın:

```json
{
  "title": "Spring Data JPA öğreniyorum",
  "completed": false
}
```

Başlık zorunludur, yalnızca boşluk içeremez ve en fazla 200 karakter olabilir. `completed` gönderilmezse `false` kabul edilir. PUT, her iki alanı da değiştirir. PATCH ve DELETE gövde gerektirmez.

POST yanıtı aşağıdaki biçimdedir; `Location` başlığı yeni kaydın yolunu içerir. GET (tek kayıt), PUT ve PATCH aynı yanıt yapısını kullanır:

```json
{
  "id": 1,
  "title": "Spring Data JPA öğreniyorum",
  "completed": false
}
```

Listeleme bu nesnelerden oluşan bir JSON dizisi döndürür; kayıt yoksa `[]` döner. DELETE yanıtının gövdesi yoktur.

Bulunamayan kayıtlar 404, geçersiz başlık, bozuk JSON veya geçersiz ID biçimi 400 döndürür. Hatalar `application/problem+json` biçimindedir. Başlık doğrulama hatası örneği:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "İstek alanlarını kontrol edin.",
  "instance": "/api/todos",
  "errors": {
    "title": "Başlık boş olamaz."
  }
}
```

Katmanlar `controller → service → repository → entity` şeklindedir. API giriş/çıkışı DTO record'larıyla yapılır. Service güncelleme işlemlerinde transaction ve Hibernate Dirty Checking kullanır.

H2 in-memory verileri uygulama kapanınca silinir. Hibernate geliştirme ortamında `T_TODO` tablosunu otomatik oluşturur (`create-drop`).


## React Frontend

Frontend `frontend/` klasöründedir: React, TypeScript, Vite ve sade CSS kullanır. Node.js **24 LTS** ve npm gerektirir (`frontend/.nvmrc`: 24).

Backend'i bir terminalde başlatın:

```sh
cd backend
./mvnw spring-boot:run
```

Başka bir terminalde, proje kökünden frontend'i başlatın:

```sh
cd frontend
npm ci
npm run dev
```

Tarayıcıda **http://localhost:5173** adresini açın. Vite bu portu sabit kullanır; port doluysa hata verir. Backend **http://localhost:8080** üzerinde çalışmalıdır. CORS izni `http://localhost:5173` içindir; tarayıcıda `127.0.0.1` yerine `localhost` kullanın.

API adresinin varsayılanı `http://localhost:8080`'dir. Değiştirmek için `frontend/.env.example` dosyasını `frontend/.env.local` olarak kopyalayıp düzenleyin:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

Adrese `/api/todos` eklemeyin; servis bu yolu kendisi ekler. Ortam değişkeni değişince Vite'ı yeniden başlatın. `VITE_` değişkenleri tarayıcıya açıktır; gizli bilgi koymayın. Backend kapalıysa uygulama bağlantı mesajı ve tekrar deneme seçeneği gösterir.

Frontend doğrulaması (`frontend/` içinde):

```sh
npm test
npm run build
```

Üretim çıktısı `frontend/dist/` dizinine yazılır. Yerel önizleme için `npm run preview` çalıştırılabilir; backend ayrıca açık olmalıdır.

Görev ekleme (Enter ile), başlık düzenleme, checkbox ile tamamlama, silme, Tümü/Aktif/Tamamlanan filtreleri ve görev sayaçları desteklenir. Başlıklar boş olamaz ve en fazla 200 karakterdir. İşlem sırasında ilgili kontroller kilitlenir; başarısız işlemlerde arayüzdeki kayıt korunur. Sayfa yenilendiğinde görevler API'den tekrar okunur.

Frontend kodu `components/`, `services/` ve `types/` olarak ayrılmıştır. Testler Vitest ve React Testing Library kullanır. H2 verileri geçicidir; backend kapanınca silinir.


Çalışan yerel backend ile isteğe bağlı canlı servis testi (macOS/Linux, `frontend/` içinde):

```sh
VITE_RUN_INTEGRATION=true npm test -- src/services/todoApi.integration.test.ts
```

Bu test gerçek Fetch servisiyle CRUD ve CORS akışını doğrular, oluşturduğu test kayıtlarını temizler. Normal `npm test` canlı backend gerektirmez; bu iki entegrasyon testi varsayılan olarak atlanır.
