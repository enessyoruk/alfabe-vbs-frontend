"use client"

export function CarouselSection() {
  const items = [
    {
      src: "/modern-classroom-with-students-studying-mathematic.jpg",
      title: "Modern Sınıf Ortamı",
      text: "Teknoloji destekli eğitim sınıflarımızda öğrencilerimiz en iyi koşullarda öğreniyor."
    },
    {
      src: "/happy-students-celebrating-academic-success--gradu.jpg",
      title: "Başarı Hikayeleri",
      text: "Öğrencilerimizin akademik başarıları ve kişisel gelişimleri bizim en büyük gururumuz."
    },
    {
      src: "/teacher-helping-student-with-homework--one-on-one-.jpg",
      title: "Birebir İlgi",
      text: "Deneyimli öğretmenlerimiz her öğrenciye özel ilgi göstererek potansiyellerini ortaya çıkarıyor."
    },
    {
      src: "/students-using-tablets-and-computers-for-digital-l.jpg",
      title: "Dijital Eğitim",
      text: "Çağdaş eğitim teknolojileri ile öğrencilerimiz geleceğe hazırlanıyor."
    },
    {
      src: "/parents-meeting-with-teachers--school-communicatio.jpg",
      title: "Veli İşbirliği",
      text: "Velilerimizle sürekli iletişim halinde, çocuklarının gelişimini birlikte takip ediyoruz."
    }
  ];

  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="w-full overflow-hidden">
        <div className="flex gap-4 animate-infinite-scroll">

          {[...items, ...items].map((item, i) => (
            <div
              key={i}
              className="relative 
              min-w-[320px] 
              sm:min-w-[360px] 
              md:min-w-[400px]
              h-[230px] sm:h-[250px] md:h-[300px]
              rounded-xl overflow-hidden"
            >
              <img
                src={item.src}
                alt={item.title}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4">
                <h4 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">{item.title}</h4>
                <p className="text-xs sm:text-sm text-white opacity-90">{item.text}</p>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  )
}
