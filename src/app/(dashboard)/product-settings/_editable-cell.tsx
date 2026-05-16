"use client"

import { useState, useEffect, useRef } from "react"

export function EditableCell({
  value,
  placeholder = "—",
  suffix,
  step = "0.01",
  onSave,
  allowNull = false,
}: {
  value: number | null
  placeholder?: string
  suffix?: string
  step?: string
  onSave: (val: number | null) => void
  allowNull?: boolean
}) {
  const [editing, setEditing]   = useState(false)
  const [localVal, setLocalVal] = useState(value?.toString() ?? "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLocalVal(value?.toString() ?? "") }, [value])
  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  function commit() {
    setEditing(false)
    if (localVal === "" && allowNull) { onSave(null); return }
    const num = parseFloat(localVal)
    if (!isNaN(num)) onSave(num)
    else setLocalVal(value?.toString() ?? "")
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step={step}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") { setEditing(false); setLocalVal(value?.toString() ?? "") }
        }}
        className="w-full h-8 rounded-md border border-[#F27A1A] bg-orange-50 px-2 text-sm text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#F27A1A]/20 tabular-nums"
      />
    )
  }

  const isEmpty = value == null
  return (
    <button
      onClick={() => setEditing(true)}
      className={`w-full h-8 flex items-center px-2 rounded-md text-sm transition-all hover:bg-orange-50 hover:text-[#F27A1A] group tabular-nums text-left ${
        isEmpty ? "text-[#c0bbb7] italic" : "text-[#1a1c1c] font-medium"
      }`}
    >
      {isEmpty ? (
        <span className="text-xs">{placeholder}</span>
      ) : (
        <span className="flex items-baseline gap-0.5">
          <span>{value}</span>
          {suffix && <span className="text-[#8b7264] text-[11px] ml-0.5">{suffix}</span>}
        </span>
      )}
      <span className="opacity-0 group-hover:opacity-40 ml-auto text-[#F27A1A] text-[10px]">✎</span>
    </button>
  )
}
