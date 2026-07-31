import type { IdentityInput } from '../types'
import { QuestionCard } from './QuestionCard'

const radioCls =
  'w-full text-left px-4 py-3 rounded-lg border border-border bg-surface-card hover:border-neutral-400 transition-colors cursor-pointer peer-checked:border-neutral-900 peer-checked:bg-neutral-50'

export function StepIdentity({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: IdentityInput
  onChange: (d: IdentityInput) => void
  onNext: () => void
  onBack: () => void
}) {
  const canNext = data.habitual_residence && data.jp_legal_status && data.nationality

  return (
    <div className="space-y-5">
      <QuestionCard
        title="被继承人预计经常居所地"
        hint="以被继承人当前实际经常居所状态为准。中国《涉外民事关系法律适用法》第31条以此确定继承准据法。"
      >
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'CN', label: '🇨🇳 中国大陆' },
            { value: 'JP', label: '🇯🇵 日本' },
          ].map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input
                type="radio"
                name="habitual_residence"
                value={opt.value}
                checked={data.habitual_residence === opt.value}
                onChange={(e) =>
                  onChange({ ...data, habitual_residence: e.target.value as 'CN' | 'JP' })
                }
                className="peer sr-only"
              />
              <div className={radioCls}>{opt.label}</div>
            </label>
          ))}
        </div>
      </QuestionCard>

      <QuestionCard
        title="被继承人在日本的法律身份"
        hint="不同身份在日本行政机关和跨境继承程序中的处理方式不同。PR 身份还会触发外汇管制额外审查。"
      >
        <div className="space-y-2">
          {[
            { value: 'CITIZEN', label: '已归化入籍日本（日本国籍）' },
            { value: 'PR', label: '日本永住者（PR）' },
            { value: 'VISA', label: '持有日本长期签证（工作/经营/留学/家族滞在等）' },
            { value: 'NONE', label: '非常住日本，仅持有日本资产' },
          ].map((opt) => (
            <label key={opt.value} className="cursor-pointer block">
              <input
                type="radio"
                name="jp_legal_status"
                value={opt.value}
                checked={data.jp_legal_status === opt.value}
                onChange={(e) =>
                  onChange({
                    ...data,
                    jp_legal_status: e.target.value as 'VISA' | 'PR' | 'CITIZEN' | 'NONE',
                  })
                }
                className="peer sr-only"
              />
              <div className={radioCls}>{opt.label}</div>
            </label>
          ))}
        </div>
      </QuestionCard>

      <QuestionCard
        title="被继承人国籍"
        hint='国籍影响日本法务局对中国公证文书的认可度，尤其双籍人士的"本国法"认定有歧义'
      >
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'CN', label: '中国' },
            { value: 'JP', label: '日本' },
            { value: 'THIRD', label: '第三国/地区' },
          ].map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input
                type="radio"
                name="nationality"
                value={opt.value}
                checked={data.nationality === opt.value}
                onChange={(e) =>
                  onChange({
                    ...data,
                    nationality: e.target.value as 'CN' | 'JP' | 'THIRD',
                  })
                }
                className="peer sr-only"
              />
              <div className={radioCls}>{opt.label}</div>
            </label>
          ))}
        </div>
      </QuestionCard>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-text-secondary hover:text-text-primary transition-colors"
        >
          ← 返回前置评估
        </button>
        <button
          disabled={!canNext}
          onClick={onNext}
          className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
        >
          下一步：资产大类 →
        </button>
      </div>
    </div>
  )
}
