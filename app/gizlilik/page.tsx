// app/gizlilik/page.tsx

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { ScrollBackButton } from "@/components/scroll-back-button"

export default function GizlilikPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card/40 to-background py-10">
      <div className="container mx-auto px-4 max-w-4xl space-y-8">
        {/* Üst Başlık */}
        <header className="space-y-2 text-center">
          <p className="text-sm font-semibold text-primary tracking-wide uppercase">
            Alfabe Eğitim Gelişim ve Sanayi Ltd. Şti.
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Gizlilik ve Çerez Politikası
          </h1>
          <p className="text-sm text-muted-foreground">
            Yürürlük Tarihi: <span className="font-medium">01.01.2025</span>
          </p>
        </header>

        {/* Özet / Uyarı Kartı */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Kısa Bilgilendirme</CardTitle>
            <CardDescription>
              Bu sayfa, <span className="font-semibold">alfabakademi.com</span> alan adı ve alt alanları üzerinden
              işlenen kişisel verilerinizi, gizlilik ilkelerimizi ve çerez kullanımımıza ilişkin temel bilgileri
              içermektedir. Kişisel verilerinizin işlenmesine dair daha detaylı bilgi için{" "}
              <Link href="/kvkk" className="font-semibold text-primary hover:underline">
                KVKK Aydınlatma Metni
              </Link>{" "}
              sayfamızı da inceleyebilirsiniz.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* İçindekiler */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">İçindekiler</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <a href="#amac-ve-kapsam" className="hover:text-primary underline-offset-2 hover:underline">
              1. Amaç ve Kapsam
            </a>
            <a href="#veri-sorumlusu" className="hover:text-primary underline-offset-2 hover:underline">
              2. Veri Sorumlusu
            </a>
            <a href="#toplanan-bilgiler" className="hover:text-primary underline-offset-2 hover:underline">
              3. Toplanan Bilgi Türleri
            </a>
            <a href="#isleme-amaclari" className="hover:text-primary underline-offset-2 hover:underline">
              4. Verilerin İşlenme Amaçları
            </a>
            <a href="#log-kayitlari" className="hover:text-primary underline-offset-2 hover:underline">
              5. Kayıt Dosyaları (Loglar)
            </a>
            <a href="#cerezler" className="hover:text-primary underline-offset-2 hover:underline">
              6. Çerezler (Cookies)
            </a>
            <a href="#aktarim" className="hover:text-primary underline-offset-2 hover:underline">
              7. Üçüncü Kişilere Aktarım ve Hizmet Sağlayıcılar
            </a>
            <a href="#gelistiriciler" className="hover:text-primary underline-offset-2 hover:underline">
              8. Geliştiriciler ve Teknik Hizmet Sağlayıcılar
            </a>
            <a href="#dis-baglantilar" className="hover:text-primary underline-offset-2 hover:underline">
              9. Dış Bağlantılar
            </a>
            <a href="#kvkk-haklar" className="hover:text-primary underline-offset-2 hover:underline">
              10. KVKK Kapsamındaki Haklarınız
            </a>
            <a href="#guncelleme" className="hover:text-primary underline-offset-2 hover:underline">
              11. Politikanın Güncellenmesi
            </a>
            <a href="#iletisim" className="hover:text-primary underline-offset-2 hover:underline">
              12. İletişim
            </a>
          </CardContent>
        </Card>

        {/* 1. Amaç ve Kapsam */}
        <Card id="amac-ve-kapsam">
          <CardHeader>
            <CardTitle className="text-lg">1. Amaç ve Kapsam</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm md:text-base text-muted-foreground">
            <p>
              Bu Gizlilik ve Çerez Politikası,{" "}
              <span className="font-semibold">alfabakademi.com</span> alan adı ve alt alan adları üzerinden sunulan web
              sitesi, veli–öğretmen panelleri ve diğer dijital kanalların (“Site”) kullanımı sırasında işlenen
              kişisel veriler ile Site üzerinden toplanan diğer bilgilerin nasıl işlendiğini ve korunduğunu açıklamak
              amacıyla hazırlanmıştır.
            </p>
            <p>
              Bu politika; veliler, öğretmenler ve Siteyi ziyaret eden diğer tüm gerçek kişiler için
              geçerlidir ve <span className="font-semibold">6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”)</span>{" "}
              başta olmak üzere ilgili mevzuat çerçevesinde uygulanır.
            </p>
            <p>
              Bu politika, KVKK Aydınlatma Metni’nin yerine geçmez; onu tamamlayıcı niteliktedir. Kişisel verilerinizin
              işlenmesine ilişkin daha detaylı bilgi için KVKK Aydınlatma Metni’ni inceleyebilirsiniz.
            </p>
          </CardContent>
        </Card>

        {/* 2. Veri Sorumlusu */}
        <Card id="veri-sorumlusu">
          <CardHeader>
            <CardTitle className="text-lg">2. Veri Sorumlusu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>
              KVKK anlamında veri sorumlusu;
            </p>
            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="font-semibold">Alfabe Eğitim Gelişim ve Sanayi Ltd. Şti.</p>
              <p>Kozlu Fatih Mah. Çırağan Sk. Beyza Apt. Giriş Kat, Zonguldak</p>
              <p>Telefon: +90 549 888 67 00</p>
            </div>
            <p>
              olup, bu politika kapsamında kişisel verileriniz Şirketimiz tarafından işlenmektedir.
            </p>
          </CardContent>
        </Card>

        {/* 3. Toplanan Bilgi Türleri */}
        <Card id="toplanan-bilgiler">
          <CardHeader>
            <CardTitle className="text-lg">3. Toplanan Bilgi Türleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>Site ve dijital sistemlerimiz üzerinden aşağıdaki türde bilgiler toplanabilir:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <span className="font-semibold">Kimlik Bilgileri:</span> Ad, soyad, öğrenci bilgileri, veli bilgileri vb.
              </li>
              <li>
                <span className="font-semibold">İletişim Bilgileri:</span> Telefon numarası, e-posta adresi, adres
                bilgisi vb.
              </li>
              <li>
                <span className="font-semibold">Öğrenciye İlişkin Eğitim Bilgileri:</span> Sınıf, ders, devamsızlık,
                ödev durumu, sınav sonuçları, rehberlik notları vb.
              </li>
              <li>
                <span className="font-semibold">Veli Bilgileri:</span> Veli adı, iletişim bilgileri, öğrenci ile olan
                yakınlık ilişkisi vb.
              </li>

              <li>
                <span className="font-semibold">Sistem Kullanım Bilgileri:</span> IP adresi, tarayıcı türü, cihaz
                bilgileri, giriş–çıkış zamanı, log kayıtları, hata kayıtları vb.
              </li>
              <li>
                <span className="font-semibold">Destek/İletişim İçerikleri:</span> Form, e-posta, çağrı merkezi veya
                WhatsApp üzerinden ilettiğiniz talepler ve mesajlar.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 4. Verilerin İşlenme Amaçları */}
        <Card id="isleme-amaclari">
          <CardHeader>
            <CardTitle className="text-lg">4. Verilerin İşlenme Amaçları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>Toplanan kişisel verileriniz, KVKK’nın ilgili hükümleri çerçevesinde aşağıdaki amaçlarla işlenir:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Eğitim, ders, etüt ve rehberlik faaliyetlerinin planlanması ve yürütülmesi,</li>
              <li>Öğrenci başarı ve gelişim sürecinin takibi, raporlanması ve gerektiğinde veliyle paylaşılması,</li>
              <li>Veli–öğretmen–okul iletişiminin sağlanması,</li>
              <li>Ödev, sınav, yoklama, tatil bildirimi gibi konularda bilgilendirme yapılması,</li>
              <li>Sisteme giriş güvenliğinin sağlanması ve yetkisiz erişimlerin önlenmesi,</li>
              <li>Hizmet kalitesinin ölçülmesi, istatistiksel analiz ve iyileştirme çalışmalarının yapılması,</li>
              <li>Şirketimizin hukuki yükümlülüklerini yerine getirmesi ve olası uyuşmazlıklarda delil elde edilmesi.</li>
            </ul>
          </CardContent>
        </Card>

        {/* 5. Log Kayıtları */}
        <Card id="log-kayitlari">
          <CardHeader>
            <CardTitle className="text-lg">5. Kayıt Dosyaları (Log Kayıtları)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>
              Birçok web sitesinde olduğu gibi, <span className="font-semibold">alfabakademi.com</span> üzerinde de
              sistemin çalışması ve güvenliğinin sağlanması amacıyla log kayıtları tutulabilmektedir. Bu kayıtlar:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>IP adresiniz,</li>
              <li>Ziyaret tarih–saat bilgisi,</li>
              <li>Giriş yapılan URL’ler, hata mesajları,</li>
              <li>Kullanılan tarayıcı ve işletim sistemi gibi teknik bilgiler</li>
            </ul>
            <p>
              Bu loglar sistem güvenliği, hata tespiti, kötüye kullanımın önlenmesi ve hukuki yükümlülüklerin
              yerine getirilmesi amaçlarıyla saklanır; istatistik ve güvenlik amaçları dışında kullanılmaz.
            </p>
          </CardContent>
        </Card>

        {/* 6. Çerezler */}
        <Card id="cerezler">
          <CardHeader>
            <CardTitle className="text-lg">6. Çerezler (Cookies) ve Benzeri Teknolojiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm md:text-base text-muted-foreground">
            <p className="font-semibold">6.1. Çerez Nedir?</p>
            <p>
              Çerez (“cookie”), bir web sitesini ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza kaydedilen
              küçük metin dosyalarıdır. Çerezler sayesinde site geçmişiniz ve bazı tercihlerinize ilişkin bilgiler
              hatırlanabilir.
            </p>

            <p className="font-semibold">6.2. Hangi Tür Çerezleri Kullanıyoruz?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <span className="font-semibold">Zorunlu / Teknik Çerezler:</span> Oturum açma, panelde gezinme, güvenli
                giriş, form gönderme gibi temel fonksiyonların çalışması için zorunludur.
              </li>
              <li>
                <span className="font-semibold">Performans ve Analitik Çerezler (Varsa):</span> Site trafiğinin ölçülmesi
                ve istatistiksel analizler için kullanılabilir. Harici analitik araçlar devreye alındığında bu politika
                güncellenir.
              </li>
              <li>
                <span className="font-semibold">İşlevsel Çerezler (Varsa):</span> Tercihlerinizin (örneğin dil seçimi vb.)
                hatırlanmasını sağlayabilir.
              </li>
              <li>
                <span className="font-semibold">Üçüncü Taraf Servis Çerezleri:</span> Siteye gömülü harici servisler
                (örneğin harita servisleri vb.) kendi çerezlerini kullanabilir. Bu çerezler ilgili üçüncü taraflar
                tarafından yönetilir.
              </li>
            </ul>
            <p className="text-sm">
              Şu an itibariyle Alfabe Akademi olarak herhangi bir reklam ağı üzerinden kişiselleştirilmiş reklam
              göstermiyor ve reklam amaçlı hedefleme çerezleri kullanmıyoruz. Bu durum değişirse politika güncellenecek
              ve ayrıca bilgilendirme yapılacaktır.
            </p>

            <p className="font-semibold">6.3. Çerezleri Nasıl Yönetebilirsiniz?</p>
            <p>
              Tarayıcı ayarlarınız üzerinden çerezleri tamamen engelleyebilir, belirli tür çerezlere izin verebilir veya
              daha önce kaydedilmiş çerezleri silebilirsiniz. Ancak zorunlu/teknik çerezleri devre dışı bırakmanız,
              Site’nin veya veli/öğretmen panelinin doğru çalışmamasına yol açabilir.
            </p>
          </CardContent>
        </Card>

        {/* 7. Aktarım */}
        <Card id="aktarim">
          <CardHeader>
            <CardTitle className="text-lg">7. Üçüncü Kişilere Aktarım ve Hizmet Sağlayıcılar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>
              Kişisel verileriniz, KVKK ve ilgili mevzuat çerçevesinde ve yalnızca gerekli olduğu ölçüde; Alfabe Eğitim
              Gelişim ve Sanayi Ltd. Şti.’ne, Şirketimiz nam ve hesabına hareket eden eğitim, danışmanlık ve yazılım
              hizmeti sunan hizmet sağlayıcılarımıza, muhasebe, denetim, hukuk, vergi ve finans alanlarında destek
              aldığımız danışmanlarımıza, mevzuatın
              zorunlu tuttuğu hallerde yetkili kamu kurum ve kuruluşlarına aktarılabilir.
            </p>
            <p>
              Bu kişiler çoğu durumda KVKK anlamında “veri işleyen” konumundadır ve Şirketimizin talimatları
              doğrultusunda; gerekli sözleşmeler ve gizlilik yükümlülükleri çerçevesinde hareket ederler.
            </p>
          </CardContent>
        </Card>

        {/* 8. Geliştiriciler */}
        <Card id="gelistiriciler">
          <CardHeader>
            <CardTitle className="text-lg">8. Geliştiriciler ve Teknik Hizmet Sağlayıcılar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>
              Alfabe Akademi, bilgi sistemlerinin geliştirilmesi ve güvenliğin sağlanması için zaman zaman bağımsız
              yazılım geliştiriciler ve bilişim şirketleri ile çalışabilmektedir. Bu kişiler, KVKK kapsamında “veri
              işleyen” sıfatıyla, Şirketimizin talimatları doğrultusunda ve yalnızca ihtiyaç duyulan ölçüde verilere
              erişir.
            </p>
            <p>
              Geliştiriciler ve teknik hizmet sağlayıcıları, gizlilik ve veri güvenliği sözleşmeleri ile yükümlüdür;
              verileri kendi amaçları için kullanamaz, çoğaltamaz veya üçüncü kişilere aktaramaz. İş ilişkisi sona
              erdiğinde verileri iade etmek, silmek veya anonimleştirmekle yükümlüdürler.
            </p>
          </CardContent>
        </Card>

        {/* 9. Dış Bağlantılar */}
        <Card id="dis-baglantilar">
          <CardHeader>
            <CardTitle className="text-lg">9. Dış Bağlantılar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>
              Site üzerinden, üçüncü kişilere ait internet sitelerine (örneğin sosyal medya hesapları, harita servisleri
              vb.) bağlantı verilebilir. Bu bağlantılar üzerinden erişilen sitelerin içeriklerinden, çerez/izleme
              politikalarından ve gizlilik uygulamalarından Alfabe Akademi sorumlu değildir. İlgili sitelerin kendi
              gizlilik ve çerez politikalarını ayrıca incelemeniz önerilir.
            </p>
          </CardContent>
        </Card>

        {/* 10. KVKK Haklarınız */}
        <Card id="kvkk-haklar">
          <CardHeader>
            <CardTitle className="text-lg">10. KVKK Kapsamındaki Haklarınız</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>
              KVKK’nın 11. maddesi uyarınca, kişisel verilerinizle ilgili olarak Şirketimize başvurarak aşağıdaki
              haklara sahipsiniz:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
              <li>KVKK’nın 7. maddesi kapsamında silinmesini veya yok edilmesini isteme,</li>
              <li>
                Bu işlemlerin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,
              </li>
              <li>
                Münhasıran otomatik sistemler ile analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz
                etme,
              </li>
              <li>
                Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 11. Güncelleme */}
        <Card id="guncelleme">
          <CardHeader>
            <CardTitle className="text-lg">11. Politikanın Güncellenmesi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>
              Bu Gizlilik ve Çerez Politikası, mevzuattaki değişiklikler, teknik gereklilikler veya hizmetlerimizdeki
              güncellemeler nedeniyle zaman zaman revize edilebilir. Güncellenmiş versiyon,{" "}
              <span className="font-semibold">alfabakademi.com</span> üzerinde yayımlandığı tarihten itibaren geçerli
              olacaktır.
            </p>
          </CardContent>
        </Card>

        {/* 12. İletişim */}
        <Card id="iletisim">
          <CardHeader>
            <CardTitle className="text-lg">12. İletişim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>
              Bu politika ve kişisel verilerinizle ilgili her türlü soru, talep ve şikayetiniz için aşağıdaki iletişim
              kanallarını kullanabilirsiniz:
            </p>
            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="font-semibold">Alfabe Eğitim Gelişim ve Sanayi Ltd. Şti.</p>
              <p>Kozlu Fatih Mah. Çırağan Sk. Beyza Apt. Giriş Kat, Zonguldak</p>
              <p>Telefon: +90 549 888 67 00</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scroll ile gelen Geri Dön butonu */}
      <ScrollBackButton />
    </div>
  )
}
