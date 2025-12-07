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
  ]

  return (
    <section
      className="
        py-14 
        mt-4            /* mobil – dokunmuyoruz */
        md:mt-20        /* tablet – daha ferah */
        lg:mt-32        /* PC – eski geniş boşluk */
        bg-white 
        w-full 
        overflow-hidden
      "
    >
      {/* Tam genişlik ama taşmayı kilitliyoruz */}
      <div className="w-full overflow-x-hidden">
        <div className="relative w-full overflow-hidden">
          
          {/* DİKKAT: w-max KALDIRILDI, sadece flex + gap */}
          <div className="flex gap-4 sm:gap-6 animate-scroll-x">
            {[...items, ...items].map((item, i) => (
              <div
                key={i}
                className="
                  relative 
                  w-[260px]           /* en küçük ekran */
                  sm:w-[300px]        /* sm ve üstü */
                  md:w-[340px]        /* md ve üstü */
                  lg:w-[380px]        /* lg ve üstü */
                  xl:w-[400px]
                  h-[220px] 
                  sm:h-[240px] 
                  md:h-[260px] 
                  lg:h-[300px]
                  rounded-xl 
                  overflow-hidden 
                  group
                "
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                  <h4 className="text-lg sm:text-xl font-bold mb-2 text-white drop-shadow-lg">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm opacity-90 text-white drop-shadow-md">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
