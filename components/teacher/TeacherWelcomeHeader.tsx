"use client"

interface TeacherWelcomeHeaderProps {
  displayName: string
}

export function TeacherWelcomeHeader({ displayName }: TeacherWelcomeHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-secondary/10 via-primary/10 to-accent/10 rounded-lg p-4 sm:p-5 md:p-6 relative overflow-hidden">

      {/* Background Pulses */}
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-primary/5 rounded-full -translate-y-12 sm:-translate-y-14 md:-translate-y-16 translate-x-12 sm:translate-x-14 md:translate-x-16 animate-pulse" />
      
      <div
        className="absolute bottom-0 left-0 w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 bg-secondary/5 rounded-full translate-y-10 -translate-x-10 animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div
        className="absolute top-1/2 left-1/2 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-accent/5 rounded-full -translate-x-6 -translate-y-6 animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* Content */}
      <div className="relative z-10">
        <h1
  className="
    font-bold text-foreground mb-2
    whitespace-nowrap
    max-w-full overflow-hidden tracking-tight
    text-[clamp(1rem,5vw,1.6rem)]
    md:text-[1.75rem]
  "
>
  Hoş geldiniz, {displayName} hocam
</h1>


        <p
          className="
            text-muted-foreground
            text-sm md:text-base
          "
        >
          Sınıflarınızı yönetin, ödevleri takip edin ve öğrenci gelişimini izleyin.
        </p>
      </div>
    </div>
  )
}
