// app/kvkk/page.tsx

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollBackButton } from "@/components/scroll-back-button"

export default function KVKKPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card/40 to-background py-10">
      <div className="container mx-auto px-4 max-w-4xl space-y-8">
        {/* Üst Başlık */}
        <header className="space-y-2 text-center">
          <p className="text-sm font-semibold text-primary tracking-wide uppercase">
            Alfabe Eğitim Gelişim ve Sanayi Ltd. Şti.
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            KVKK Aydınlatma Metni
          </h1>
          <p className="text-sm text-muted-foreground">
            6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında bilgilendirme
          </p>
        </header>

        {/* Kısa Açıklama */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Kısa Bilgilendirme</CardTitle>
            <CardDescription>
              Bu metin, Alfa-b Eğitim Gelişim ve Sanayi Ltd. Şti. bünyesinde yürütülen faaliyetleri
              kapsamında kişisel verilerin KVKK uyarınca nasıl işlendiğini açıklamaktadır.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 1. Genel Bilgilendirme */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Kişisel Verilerin Korunması Politikası</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm md:text-base text-muted-foreground">
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca,{" "}
              <span className="font-semibold">Alfabe Eğitim Gelişim ve Sanayi Ltd. Şti.</span> tarafından, veri sorumlusu
              sıfatıyla, kişisel verileriniz iş amaçlarıyla bağlantılı olarak, aşağıda açıklandığı çerçevede
              kullanılmak, kaydedilmek, saklanmak, güncellenmek, aktarılmak ve/veya sınıflandırılmak suretiyle
              işlenecektir.
            </p>
            <p>
              Şirketimiz, başta özel hayatın gizliliği olmak üzere, kişilerin temel hak ve özgürlüklerini korumak ve
              kişisel verilerin korunması amacıyla düzenlenen Kanun ve Yönetmelikler gereğince; kişisel verilerinizin
              hukuka aykırı olarak işlenmesini önleme, hukuka aykırı olarak erişilmesini önleme ve muhafazasını sağlama
              amacıyla uygun güvenlik düzeyini temin etmeye yönelik tüm teknik ve idari tedbirleri almaktadır.
            </p>
            <p>
              Bu metnin hedef kitlesi, Şirketimiz çalışanları veya Şirketimize iş başvurusu yapmış olan çalışan adayları
              dışındaki; Şirketimiz tarafından kişisel verileri işlenen tüm gerçek kişilerdir.
            </p>
          </CardContent>
        </Card>

        {/* 2. Geliştiriciler / Veri İşleyenler */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Yazılım Geliştirme ve Veri İşleyenler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm md:text-base text-muted-foreground">
            <p>
              Şirketimiz, kişisel verilerin işlenmesi süreçlerinde; yazılım geliştirme, sistem bakımı, barındırma
              (hosting), altyapı ve benzeri konularda zaman zaman dış hizmet sağlayıcıları ile (yazılım şirketleri,
              bağımsız yazılım geliştiriciler, bilişim altyapı sağlayıcıları vb.) çalışabilmektedir.
            </p>
            <p>
              Bu kişiler KVKK anlamında <span className="font-semibold">“veri sorumlusu” değil</span>, Şirketimizin
              talimatlarıyla hareket eden <span className="font-semibold">“veri işleyen”</span> konumundadır.
            </p>
            <p>
              Veri işleyenler, kişisel verileri yalnızca Şirketimiz adına ve Şirketimizin yazılı/talimatlı yönergeleri
              doğrultusunda işlemekte, kendi amaçları için kullanmamakla yükümlüdür. Bu kişiler, verileri üçüncü
              kişilerle paylaşamaz, iş ilişkisi sona erdiğinde verileri iade etmek, silmek veya anonimleştirmekle
              yükümlüdür.
            </p>
          </CardContent>
        </Card>

        {/* 3. İşlenen Kişisel Veri Türleri */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. İşlenen Kişisel Veriler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>
              Veri sorumlusu sıfatıyla işlenen kişisel verilere, burada belirtilenlerle sınırlı sayıda olmamak üzere
              aşağıda yer verilmektedir:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>İsim, soy isim, T.C. kimlik numarası,</li>
              <li>Adres, telefon numarası, e-posta adresi,</li>
              <li>İmza,</li>
              <li>Fiziksel mekân / güvenlik kamera görüntü kaydı,</li>
              <li>Çağrı merkezi / hizmet kalitesi ses kaydı,</li>
              <li>Banka hesap numarası (gerekli olduğu ölçüde),</li>
              <li>Cookie / çerez kayıtları.</li>
            </ul>
          </CardContent>
        </Card>

        {/* 4. İşleme Amaçları ve Hukuki Sebepler */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">4. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>Tarafınızca paylaşılan kişisel verileriniz;</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Şirketimiz tarafından sunulan ürün ve hizmetlerden sizleri ve/veya temsil ettiğiniz kurum ve
                kuruluşları faydalandırmak için,
              </li>
              <li>
                Şirketimizin ticari ve iş stratejilerinin belirlenmesi ve uygulanması, pazarlama faaliyetlerinin
                yapılması, iş geliştirme ve planlama faaliyetlerinin gerçekleştirilmesi dahil ve fakat bunlarla sınırlı
                olmamak üzere gerekli çalışmaların yürütülmesi,
              </li>
              <li>Şirketimiz tarafından yürütülen iletişime yönelik idari operasyonların yürütülmesi,</li>
              <li>Şirketimizin kullanımda olan lokasyonların fiziksel güvenliğinin ve denetiminin sağlanması,</li>
              <li>İş ortağı / müşteri / tedarikçi (yetkili veya çalışanları) ilişkilerinin kurulması,</li>
              <li>
                İş ortaklarımız, tedarikçilerimiz veya sair üçüncü kişilerle birlikte sunulan ürün ve hizmetlere
                ilişkin sözleşme gereklerinin ve finansal mutabakatın sağlanması,
              </li>
              <li>Şirketimizin insan kaynakları politikalarının yürütülmesi,</li>
              <li>
                Şirketimizin çağrı merkezinin aranması veya internet sayfasının kullanılması ve/veya Şirketimizin
                düzenlediği eğitim, seminer veya organizasyonlara katılım sağlanması
              </li>
            </ul>
            <p>
              amaçlarıyla; KVKK’nın 5. ve 6. maddelerinde belirtilen hukuki sebepler çerçevesinde işlenecektir.
            </p>
          </CardContent>
        </Card>

        {/* 5. Toplanma ve Saklanma */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">5. Kişisel Verilerin Toplanma ve Saklanma Yöntemi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm md:text-base text-muted-foreground">
            <p>
              Şirketimizle paylaştığınız kişisel verileriniz; otomatik ya da otomatik olmayan yöntemlerle, ofisler,
              şubeler, çağrı merkezi, internet sitesi, sosyal medya mecraları, mobil uygulamalar ve benzeri vasıtalarla
              sözlü, yazılı ya da elektronik olarak toplanabilir.
            </p>
            <p>
              Kişisel verileriniz elektronik ve/veya fiziksel ortamlarda saklanacaktır. Şirketimiz tarafından temin
              edilen ve saklanan kişisel verilerinizin saklandıkları ortamlarda yetkisiz erişime maruz kalmamaları,
              manipülasyona uğramamaları, kaybolmamaları ve zarar görmemeleri amacıyla gereken iş süreçlerinin tasarımı
              ile teknik güvenlik altyapı geliştirmeleri uygulanmaktadır.
            </p>
            <p>
              Kişisel verileriniz, size bildirilen amaçlar ve kapsam dışında kullanılmamak kaydı ile gerekli tüm bilgi
              güvenliği tedbirleri de alınarak işlenecek ve yasal saklama süresince veya böyle bir süre öngörülmemişse
              işleme amacının gerekli kıldığı süre boyunca saklanacak ve işlenecektir. Bu süre sona erdiğinde, kişisel
              verileriniz silinme, yok edilme ya da anonimleştirme yöntemleri ile Şirketimizin veri akışlarından
              çıkarılacaktır.
            </p>
          </CardContent>
        </Card>

        {/* 6. Aktarım */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">6. Kişisel Verilerin Aktarılması</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm md:text-base text-muted-foreground">
            <p>
              Kişisel verileriniz, Kanunlar ve sair mevzuat kapsamında ve açıklanan amaçlarla aşağıdaki kişi ve
              kuruluşlara aktarılabilecektir:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Alfa-b Akademi Sosyal Etkinlik ve Gelişim Merkezi’ne,</li>
              <li>Yetki vermiş olduğumuz, Şirketimiz nam ve hesabına faaliyette bulunan şirketler ve temsilcilerimize,</li>
              <li>
                Düzenleyici ve denetleyici kurumlara, kişisel verilerinizi tabi olduğu kanunlarında açıkça talep etmeye
                yetkili olan kamu kurum veya kuruluşlara,
              </li>
              <li>
                Belirtilen amaçlar kapsamında iş ortaklıkları, tedarikçi ve yüklenici şirketler, bankalar, kredi risk ve
                finans kuruluşları ve sair gerçek veya tüzel kişilere,
              </li>
              <li>
                Bilgi sistemlerimizin kurulması, geliştirilmesi ve bakımının sağlanması amacıyla hizmet aldığımız bilişim
                altyapı sağlayıcıları, yazılım firmaları ve bağımsız yazılım geliştiricilerine (bu kişiler KVKK
                anlamında “veri işleyen” olup, Şirketimizle imzalanan gizlilik ve veri işleme sözleşmeleri çerçevesinde,
                yalnızca Şirketimizin talimatları doğrultusunda işlem yapmaktadır),
              </li>
              <li>
                Vergi ve benzeri danışmanlara, yasal takip süreçleri ile ilgili zorunlu kişilere, kurum ve kuruluşlara
                ve denetimciler de dâhil olmak üzere danışmanlık aldığımız üçüncü kişilere,
              </li>
              <li>
                Ve bunlarla sınırlı olmaksızın, yurt içinde ve yurt dışında, yukarıda belirtilen amaçlarla iş ortakları,
                hizmet alınan üçüncü kişi, yetkilendirilen kişi ve kuruluşlara.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 7. Veri Güvenliği */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">7. Veri Güvenliği ve Hizmet Sağlayıcılarıyla İlişkimiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm md:text-base text-muted-foreground">
            <p>
              Şirketimiz, kişisel verilerin güvenliğine ilişkin olarak KVKK’nın 12. maddesi uyarınca gerekli her türlü
              teknik ve idari tedbiri almaktadır. Bu kapsamda:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Kişisel verilere erişim, görev tanımı ve yetki matrisi çerçevesinde sınırlandırılmakta,</li>
              <li>Veriler yalnızca işin gerektirdiği ölçüde ve “bilmesi gereken” ilkesi kapsamında erişime açılmakta,</li>
              <li>
                Sistemler, yetkisiz erişim, veri kaybı, değişiklik veya ifşaya karşı makul teknik önlemlerle
                korunmakta,
              </li>
              <li>Loglama, erişim kontrolü ve benzeri denetim mekanizmaları uygulanmaktadır.</li>
            </ul>
            <p>
              Şirketimiz; yazılım geliştirme, bakım, barındırma, entegrasyon gibi teknik alanlarda birlikte çalıştığı
              üçüncü kişi şirketler ve bağımsız geliştiricilerle, KVKK’ya uygun gizlilik ve veri işleme sözleşmeleri
              imzalamakta; bu kişiler “veri işleyen” sıfatıyla yalnızca Şirketimizin talimatları doğrultusunda işlem
              yapmaktadır. Bu kişiler, verileri kendi adlarına kullanamayacaklarını, üçüncü kişilerle
              paylaşamayacaklarını ve iş ilişkisi sona erdiğinde verileri iade etmek veya silmekle yükümlü olduklarını
              taahhüt etmektedir.
            </p>
          </CardContent>
        </Card>

        {/* 8. Haklarınız */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">8. KVKK’nın 11. Maddesi Gereği Haklarınız</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>
              KVKK’nın 11. maddesi uyarınca, Şirketimize başvurarak kişisel verilerinizle ilgili olarak aşağıdaki
              haklara sahipsiniz:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
              <li>Yurt içinde / yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
              <li>Eksik / yanlış işlenmişse düzeltilmesini isteme,</li>
              <li>KVKK’nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini / yok edilmesini isteme,</li>
              <li>
                Aktarıldığı üçüncü kişilere, yukarıda sayılan (e) ve (f) bentleri uyarınca yapılan işlemlerin
                bildirilmesini isteme,
              </li>
              <li>
                Münhasıran otomatik sistemler ile analiz edilmesi nedeniyle aleyhinize bir sonucun ortaya çıkmasına
                itiraz etme,
              </li>
              <li>
                Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 9. Başvuru Yolu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">9. Başvuru Yöntemi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p>
              KVK Kanunu’nun 13. maddesinin 1. fıkrası gereğince, yukarıda belirtilen haklarınızı kullanmak ile ilgili
              talebinizi, yazılı olarak veya Kişisel Verileri Koruma Kurulu’nun belirlediği diğer yöntemlerle
              Şirketimize iletebilirsiniz.
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
