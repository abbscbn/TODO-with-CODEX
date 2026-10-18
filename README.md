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

Henüz REST endpoint'leri veya Todo CRUD (oluşturma, okuma, güncelleme ve silme) işlemleri geliştirilmemiştir.
