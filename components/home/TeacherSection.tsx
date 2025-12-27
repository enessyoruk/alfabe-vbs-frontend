"use client"

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GraduationCap } from "lucide-react"

export function TeacherSection() {
  const teachers = [
    { name: "Buse Yılmaz", subject: "Matematik" },
    { name: "Ayşe Civelek Bilgin", subject: "Yabancı Dil" },
    { name: "Zuhal Çarşambalı", subject: "Yabancı Dil" },
    { name: "Metin Gürer", subject: "Türkçe" },
    { name: "Huriye Hamzaçebi", subject: "Türkçe" },
    { name: "Oktay Yaman", subject: "Fen Bilimleri" },
    { name: "Seren Akgün", subject: "Fen Bilimleri" },
    { name: "Umut Topuz", subject: "Sosyal Bilimler" },
  ]

  return (
    <section id="ogretmenler" className="py-20 bg-card/30">
      <div className="container mx-auto px-4">

        {/* SECTION BAŞLIĞI  */}
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Öğretmen Kadromuz
          </h3>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Alanında uzman, deneyimli öğretmenlerimiz ile kaliteli eğitim hizmeti sunuyoruz.
          </p>
        </div>

        {/* GRID – Mobil:1, Tablet:2, PC:3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

          {teachers.map((teacher, index) => (
            <Card
              key={index}
              className="
                text-center 
                transition-all duration-300 
                hover:shadow-xl hover:-translate-y-1
                bg-white
              "
            >
              <CardHeader>

                {/* FOTOĞRAF ALANI – showcase tarzı */}
                <div className="
                  w-full 
                  h-32 sm:h-36 
                  rounded-xl 
                  bg-gradient-to-br from-primary/15 to-secondary/15 
                  flex items-center justify-center 
                  overflow-hidden 
                  mb-4
                ">
                  {/* Placeholder icon */}
                  <GraduationCap className="h-12 w-12 text-primary opacity-70" />
                </div>

                <CardTitle className="text-lg font-semibold">
                  {teacher.name}
                </CardTitle>

                <CardDescription className="text-sm text-muted-foreground">
                  {teacher.subject}
                </CardDescription>

              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
