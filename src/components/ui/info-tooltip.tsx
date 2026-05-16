import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  text: string
  className?: string        // Info ikon rengi vb.
  side?: "top" | "bottom"  // tooltip yönü — varsayılan top
}

// Saf CSS hover tooltip — JavaScript gerektirmez, Server Component'te de kullanılabilir.
// group/info named group ile diğer group sınıflarıyla çakışmaz.
export function InfoTooltip({ text, className, side = "top" }: Props) {
  const isTop = side === "top"

  return (
    <div className="group/info relative inline-flex items-center">
      <Info className={cn("w-3.5 h-3.5 cursor-help opacity-50 hover:opacity-100 transition-opacity", className)} />

      {/* Kutucuk */}
      <div
        className={cn(
          "absolute z-50 w-56 px-3 py-2.5",
          "bg-[#1a1c1c] text-white text-[12px] leading-relaxed rounded-lg",
          "shadow-[0_8px_24px_rgba(0,0,0,0.22)] whitespace-normal",
          "opacity-0 invisible pointer-events-none",
          "group-hover/info:opacity-100 group-hover/info:visible",
          "transition-all duration-150",
          // Yatay hizalama: sağ kenara yasla
          "right-0",
          // Dikey konum
          isTop ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        {text}

        {/* Ok */}
        <div
          className={cn(
            "absolute right-3 w-0 h-0",
            "border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent",
            isTop
              ? "top-full border-t-[5px] border-t-[#1a1c1c]"
              : "bottom-full border-b-[5px] border-b-[#1a1c1c]",
          )}
        />
      </div>
    </div>
  )
}
