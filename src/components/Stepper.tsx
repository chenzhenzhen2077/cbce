import type { Step } from '../types'

const steps: { key: Step; label: string; num: number }[] = [
  { key: 'pre', label: '前置评估', num: 0 },
  { key: 'identity', label: '身份与居所', num: 1 },
  { key: 'assets', label: '资产大类', num: 2 },
  { key: 'heirs', label: '继承人画像', num: 3 },
  { key: 'document', label: '文书与程序', num: 4 },
]

export function Stepper({
  current,
  onStepClick,
}: {
  current: Step
  onStepClick: (s: Step) => void
}) {
  if (current === 'report') return null

  const visible = steps.filter((s) => s.key !== 'pre')

  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center gap-1 text-sm">
        {visible.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            <button
              onClick={() => onStepClick(s.key)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors
                ${
                  current === s.key
                    ? 'bg-neutral-900 text-white'
                    : 'bg-surface-card border border-border text-text-secondary hover:border-neutral-400'
                }`}
            >
              {s.num}
            </button>
            <span
              className={`hidden sm:inline ${
                current === s.key ? 'text-text-primary font-medium' : 'text-text-muted'
              }`}
            >
              {s.label}
            </span>
            {i < visible.length - 1 && (
              <div className="w-6 h-px bg-border mx-1 hidden sm:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
