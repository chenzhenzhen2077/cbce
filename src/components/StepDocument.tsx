import type { DocumentInput } from '../types'
import { DOC_TYPE_LABELS } from '../types'
import { QuestionCard } from './QuestionCard'

const radioCls =
  'w-full text-left px-4 py-3 rounded-lg border border-border bg-surface-card hover:border-neutral-400 transition-colors cursor-pointer peer-checked:border-neutral-900 peer-checked:bg-neutral-50'

const switchCls =
  'relative w-11 h-6 rounded-full transition-colors cursor-pointer bg-neutral-200 peer-checked:bg-neutral-900 after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5'

const docTypes: { value: DocumentInput['doc_type']; label: string }[] = [
  { value: 'NONE', label: DOC_TYPE_LABELS.NONE },
  { value: 'JP_HOLOGRAPH', label: DOC_TYPE_LABELS.JP_HOLOGRAPH },
  { value: 'JP_NOTARY', label: DOC_TYPE_LABELS.JP_NOTARY },
  { value: 'CN_NOTARY', label: DOC_TYPE_LABELS.CN_NOTARY },
]

export function StepDocument({
  data,
  onChange,
  onComplete,
  onBack,
}: {
  data: DocumentInput
  onChange: (d: DocumentInput) => void
  onComplete: () => void
  onBack: () => void
}) {
  const canSubmit = data.doc_type !== ''

  return (
    <div className="space-y-5">
      <QuestionCard
        title="现有/拟采用文书形式"
        hint="自笔证书遗嘱在中国大陆无直接执行力，须经海牙认证+翻译质证。公证遗嘱执行力度最强。"
      >
        <div className="space-y-2">
          {docTypes.map((opt) => (
            <label key={opt.value} className="cursor-pointer block">
              <input
                type="radio"
                name="doc_type"
                value={opt.value}
                checked={data.doc_type === opt.value}
                onChange={(e) =>
                  onChange({
                    ...data,
                    doc_type: e.target.value as DocumentInput['doc_type'],
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
        title="海牙认证与双语翻译"
        hint="海牙认证（Apostille）是中日文书互认的关键环节。日本文书须经外务省认证，中国文书须经外交部认证。"
      >
        <label className="flex items-center justify-between cursor-pointer py-2">
          <div>
            <span className="text-text-primary">
              已办结/计划办理海牙认证及官方双语翻译
            </span>
            <p className="text-xs text-text-muted mt-0.5">
              适用于日本签署的文书在中国使用，或中国签署的文书在日本使用
            </p>
          </div>
          <input
            type="checkbox"
            checked={data.has_apostille}
            onChange={(e) =>
              onChange({ ...data, has_apostille: e.target.checked })
            }
            className="peer sr-only"
          />
          <div className={switchCls + ' shrink-0 ml-3'} />
        </label>
      </QuestionCard>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-text-secondary hover:text-text-primary transition-colors"
        >
          ← 上一步
        </button>
        <button
          disabled={!canSubmit}
          onClick={onComplete}
          className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
        >
          生成诊断报告 →
        </button>
      </div>
    </div>
  )
}
