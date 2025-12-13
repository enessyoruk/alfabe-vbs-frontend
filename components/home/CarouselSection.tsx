"use client"

export function CarouselSection() {
  const items = [
    {
      src: "/alfabekarsi.jpg", // <-- kurum girişi
      title: "Alfa-β Akademi",
      text: "Öğrenciler için istikrarlı, veliler için güven veren bir eğitim ortamı."
    },
    {
      src: "/toplantisinif.jpg", // <-- birebir rehberlik / görüşme
      title: "Kontrollü Rehberlik Süreci",
      text: "Öğrencilerimizin akademik durumu profesyonel şekilde değerlendirilir."
    },
    {
      src: "/coridor.jpg", // <-- koridor / fiziksel ortam
      title: "Kurumsal Eğitim Atmosferi",
      text: "Öğrencilerimiz düzenli, temiz ve denetimli alanlarda eğitim alır."
    },
    {
      src: "/sinif.jpg", // <-- sınıf (öğrenciler derste)
      title: "Disiplinli Sınıf Yapısı",
      text: "Ders ortamlarımız akademik odak ve verimlilik esas alınarak yürütülür."
    },
    {
      src: "/sinifogretmen.jpg", // <-- öğretmen tahtada
      title: "Deneyimli Eğitim Kadrosu",
      text: "Alanında yetkin öğretmenlerimizle dersler etkin biçimde işlenir."
    }
  ];

  return (
    <section
      className="
        py-14 
        mt-4
        md:mt-20
        lg:mt-32
        bg-white 
        w-full 
        overflow-hidden
      "
    >
      <div className="w-full overflow-hidden">
        <div className="relative w-full overflow-hidden">
          <div className="flex gap-6 animate-scroll-x">
            {[...items, ...items].map((item, i) => (
              <div
                key={i}
                className="
                  relative 
                  min-w-[280px] sm:min-w-[360px] md:min-w-[400px]
                  h-[240px] sm:h-[260px] md:h-[300px]
                  rounded-xl overflow-hidden group
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
                  <p
                    className="
                      text-xs sm:text-sm 
                      opacity-90 
                      text-white 
                      drop-shadow-md 
                      whitespace-normal 
                      break-words 
                      leading-snug
                    "
                  >
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
