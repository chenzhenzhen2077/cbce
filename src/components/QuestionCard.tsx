import { type ReactNode, useState } from 'react'

export function QuestionCard({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  const [showHint, setShowHint] = useState(false)

  return (
    <div className="bg-surface-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {hint && (
          <button
            type="button"
            className="relative"
            onClick={() => setShowHint(!showHint)}
          >
            <span className="block w-4 h-4 rounded-full bg-neutral-200 text-neutral-500 text-[10px] leading-4 text-center font-bold hover:bg-neutral-300 transition-colors">
              ?
            </span>
            {showHint && (
              <div className="absolute z-10 left-0 top-6 w-56 p-3 bg-neutral-800 text-white text-xs rounded-lg shadow-lg leading-relaxed">
                {hint}
              </div>
            )}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
