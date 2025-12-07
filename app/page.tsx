"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Phone, Mail, MapPin, GraduationCap, Award, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { HomeHeader } from "@/components/home/HomeHeader"
import { HeroSection } from "@/components/home/HeroSection"
import { CarouselSection } from "@/components/home/CarouselSection"
import { TeacherSection } from "@/components/home/TeacherSection"



export default function HomePage() {
  useEffect(() => {
    
  }, [])

  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const toggleFaq = (index: number) => setOpenFaq(openFaq === index ? null : index)

  return (
    <div className="min-h-screen bg-background">
     {/* Header */}
     <HomeHeader />

      {/* Hero Section */}
     <HeroSection />

      {/* Carousel Section */}
      <CarouselSection />

      {/* About Section */}
<section id="hakkimizda" className="py-14 md:py-20 bg-white">
  <div className="container mx-auto px-4">
    
    {/* Title + Text */}
    <div className="text-center mb-10 md:mb-16">
      <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 leading-tight">
        Hakkımızda
      </h3>

      <p className="
        text-base sm:text-lg text-muted-foreground mx-auto leading-relaxed
        max-w-[90%]
        sm:max-w-[600px]
        md:max-w-[800px]
        lg:max-w-[1100px]   /* PC'de eski geniş ferah görünüm */
      ">
        Alfa-β Akademi, 5, 6, 7 ve 8. sınıf öğrencilerine yönelik çağdaş ve nitelikli bir eğitim anlayışıyla
        faaliyet göstermektedir. Amacımız; öğrencilerimizin akademik başarısını artırırken, onları disiplinli,
        özgüvenli ve sorumluluk sahibi bireyler olarak yetiştirmektir. Eğitim sürecimizi modern teknolojilerle
        destekliyor, öğrenci takibini etkin biçimde sürdürüyoruz. Velilerimizle düzenli bilgi paylaşımı sağlayan
        sistemimiz sayesinde, çocuklarının gelişim süreci her an şeffaf şekilde izlenebilmektedir.
      </p>
    </div>

    {/* Cards */}
    <div className="
      grid 
      grid-cols-1 
      sm:grid-cols-2 
      lg:grid-cols-3 
      gap-6 sm:gap-8
    ">
      
      <Card className="text-center hover:shadow-lg transition-shadow">
        <CardHeader>
          <Award className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>Kaliteli Eğitim</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Deneyimli öğretmen kadromuz ile her öğrenciye özel yaklaşım
          </p>
        </CardContent>
      </Card>
      
      <Card className="text-center hover:shadow-lg transition-shadow">
        <CardHeader>
          <Users className="h-12 w-12 text-secondary mx-auto mb-4" />
          <CardTitle>Aile Katılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Veliler ile sürekli iletişim halinde, şeffaf eğitim süreci
          </p>
        </CardContent>
      </Card>

      <Card className="text-center hover:shadow-lg transition-shadow">
        <CardHeader>
          <Clock className="h-12 w-12 text-accent mx-auto mb-4" />
          <CardTitle>7/24 Erişim</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Dijital platformumuz ile her zaman öğrenci bilgilerine erişim
          </p>
        </CardContent>
      </Card>

    </div>

  </div>
</section>



           {/* Teachers Section */}
      <TeacherSection />


      {/* FAQ Section */}
<section id="sss" className="py-16">
  <div className="container mx-auto px-4">

    <div className="text-center mb-12">
      <h3 className="text-2xl font-bold text-foreground mb-3">Sıkça Sorulan Sorular</h3>
      <p className="text-base text-muted-foreground max-w-xl mx-auto">
        Sistemimiz hakkında merak ettiğiniz soruların cevapları
      </p>
    </div>

    {/* ORTALAMA + WIDTH FIX */}
    <div className="max-w-2xl mx-auto space-y-4 flex flex-col items-center">

      {[
        {
          question: "Sisteme nasıl giriş yapabilirim?",
          answer: "Üyeliğiniz onaylandıktan sonra sisteme kayıtlı olduğunuz e-mail ve şifre ile giriş yapabilirsiniz.",
        },
        {
          question: "Ödev takibi nasıl yapılır?",
          answer: "Veli panelinden öğrencinizin tüm ödevlerini takip edebilirsiniz.",
        },
        {
          question: "Sınav sonuçlarını nasıl görebilirim?",
          answer: "Sınav sonuçlarını veli panelinden görüntüleyebilir ve indirebilirsiniz.",
        },
        {
          question: "Alfa-β Akademi'yi kimler kullanabilir?",
          answer: "Alfa-β Akademi, yüksek hedefleri olan tüm ortaokul öğrencileri (5, 6, 7 ve 8. Sınıflar) tarafından kullanılabilir.",
        },
        {
          question: "Alfa-β Akademi dijital bir eğitim platformu mudur?",
          answer: "Alfa-β Akademi yalnızca bir dijital eğitim platformu değildir...",
        },
      ].map((faq, index) => (
        
        <Card
          key={index}
          className="
            hover:shadow-md transition-shadow
            w-full
            sm:w-[90%]
            md:w-[80%]
            lg:w-[60%]       /* PC → sabit, ortalanmış, daha dar görünüm */
          "
        >
          <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleFaq(index)}>
            <CardTitle className="text-base flex items-center justify-between">
              {faq.question}
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  openFaq === index ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </CardTitle>
          </CardHeader>

          {/* Soft animation */}
          <div
            className={`
              overflow-hidden 
              transition-all duration-500 ease-in-out
              ${openFaq === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
            `}
          >
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </CardContent>
          </div>

        </Card>

      ))}
    </div>

  </div>
</section>



      {/* Contact Section */}
<section id="iletisim" className="py-20 bg-card/30">
  <div className="container mx-auto px-4">

    {/* Başlık */}
    <div className="text-center mb-16">
      <h3 className="text-3xl font-bold text-foreground mb-4">İletişim</h3>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        Bizimle iletişime geçin, sorularınızı yanıtlayalım
      </p>
    </div>

    {/* GRID – Tablet & PC iyileştirme */}
    <div className="grid md:grid-cols-2 gap-8 md:gap-10 lg:gap-12">

      {/* SOL BLOK – Ortalanma ve daraltma */}
      <div className="space-y-8 max-w-lg mx-auto md:mx-0">
        {/* Telefon */}
        <div className="flex items-start gap-4">
          <Phone className="h-6 w-6 text-primary mt-1" />
          <div>
            <h4 className="font-semibold text-foreground mb-1">Telefon & WhatsApp</h4>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">+90 549 888 67 00</p>
              <a
                href="https://wa.me/905498886700"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-6 h-6 bg-green-500 rounded-full hover:bg-green-600 transition-colors"
              >
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.173-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.74-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Mail */}
        <div className="flex items-start gap-4">
          <Mail className="h-6 w-6 text-primary mt-1" />
          <div>
            <h4 className="font-semibold text-foreground mb-1">E-posta</h4>
            <p className="text-muted-foreground">alfabakademi@hotmail.com</p>
          </div>
        </div>

        {/* Adres */}
        <div className="flex items-start gap-4">
          <MapPin className="h-6 w-6 text-primary mt-1" />
          <div>
            <h4 className="font-semibold text-foreground mb-1">Adres</h4>
            <p className="text-muted-foreground">Kozlu Fatih Mah. Çırağan Sk. Beyza Apt. Giriş Kat</p>
          </div>
        </div>

        {/* Instagram */}
        <div className="flex items-start gap-4">
          <Award className="h-6 w-6 text-primary mt-1" />
          <div>
            <h4 className="font-semibold text-foreground mb-1">Instagram</h4>
            <div className="flex items-center gap-2">
              <a
                href="https://instagram.com/alfabakademi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                @alfabakademi
              </a>
              <a
                href="https://instagram.com/alfabakademi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" stroke="none" viewBox="0 0 24 24"></svg>
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* SAĞ BLOK – Google Maps genişlik kontrolü */}
      <div className="space-y-6 w-full lg:max-w-[480px] lg:ml-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Konum
            </CardTitle>
            <CardDescription>Alfa-β Akademi konumumuzu haritada görüntüleyin</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="aspect-video rounded-lg overflow-hidden border">
              <iframe
                src="https://www.google.com/maps?q=41.432745094080914,31.736593424075014&z=18&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Alfa-β Akademi Konumu"
              />
            </div>

            <div className="mt-4 text-center">
              <a
                href="https://www.google.com/maps?q=41.432745094080914,31.736593424075014"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Google Maps'te Aç
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  </div>
</section>


      {/* Footer */}
      <footer className="bg-foreground text-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm opacity-80">
              {/* Footer içinden ilgili satır örneği */}
<p>
    &copy; 2025 Alfabe Eğitim Gelişim ve Sanayi Ltd. Şti - Tüm hakları saklıdır.
    <Link href="/kvkk" className="underline hover:opacity-100 ml-1">
      KVKK Aydınlatma Metni
    </Link>
    {" - "}
    <Link href="/gizlilik" className="underline hover:opacity-100">
      Gizlilik ve Çerez Politikası
    </Link>
  </p>

  <p className="text-right whitespace-nowrap opacity-70">
    Developed by <strong>Mehmet Enes YÖRÜK</strong>
  </p>


            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
