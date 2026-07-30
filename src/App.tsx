import { useState, useEffect } from 'react'
import type { ComplianceInput, ReportOutput, Step, PreAssessmentInput } from './types'
import { evaluatePreAssessment } from './types'
import { runComplianceRules } from './engine/rules'
import { Stepper } from './components/Stepper'
import { IntroPage } from './components/IntroPage'
import { StepPreAssessment } from './components/StepPreAssessment'
import { StepIdentity } from './components/StepIdentity'
import { StepAssets } from './components/StepAssets'
import { StepHeirs } from './components/StepHeirs'
import { StepDocument } from './components/StepDocument'
import { ReportView } from './components/ReportView'

const defaultPre: PreAssessmentInput = {
  is_accumulation_phase: false,
  has_retirement_separated: false,
  has_urgent_reason: false,
}

const initialInput: ComplianceInput = {
  pre: defaultPre,
  identity: { habitual_residence: '', jp_legal_status: '', nationality: '' },
  assets: { cn_assets: [] as import('./types').AssetCat[], jp_assets: [] as import('./types').AssetCat[] },
  heirs: { spouse_exists: true, children_count: 0, children_minor_count: 0, grandchildren_count: 0, parents_alive_count: 0, heir_locations: [], has_missing_heir: false, has_incapacity_heir: false, has_mandatory_share: false },
  document: { doc_type: '', has_apostille: false },
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [largeFont, setLargeFont] = useState(false)
  const [step, setStep] = useState<Step>('pre')

  useEffect(() => {
    document.documentElement.classList.toggle('large-font', largeFont)
  }, [largeFont])
  const [input, setInput] = useState<ComplianceInput>(initialInput)
  const [report, setReport] = useState<ReportOutput | null>(null)
  const [preBlocked, setPreBlocked] = useState(false)

  const handlePreComplete = (pre: PreAssessmentInput) => {
    const result = evaluatePreAssessment(pre)
    setInput({ ...input, pre })
    if (result === 'STOP') {
      setPreBlocked(true)
    } else {
      setPreBlocked(false)
      setStep('identity')
    }
  }

  const handleComplete = () => {
    const result = runComplianceRules(input)
    setReport(result)
    setStep('report')
  }

  const handleReset = () => {
    setInput(initialInput)
    setReport(null)
    setPreBlocked(false)
    setStep('pre')
  }

  if (!started) {
    return <IntroPage onStart={() => setStarted(true)} largeFont={largeFont} onToggleFont={() => setLargeFont(!largeFont)} />
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface-card border-b border-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-text-primary">
              中日跨境家族资产传承诊断
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              程序合规诊断与路径导航工具
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={() => setLargeFont(!largeFont)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${largeFont ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-text-muted border-border hover:border-neutral-400'}`}
            >
              {largeFont ? '大字 ✓' : '大字'}
            </button>
            <span className="text-xs text-text-muted bg-surface px-2 py-1 rounded-full">
              v1.0
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {report ? (
          <ReportView report={report} input={input} onReset={handleReset} />
        ) : preBlocked ? (
          /* 前置评估：养老未隔离，暂停进入正式问卷 */
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full mb-3">
                🔴 建议暂停
              </span>
              <h2 className="text-lg font-semibold text-red-deep mb-2">
                养老资金安全优先于传承规划
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                在养老/医疗储备金尚未明确隔离之前，进行资产传承规划可能导致财产控制权过早让渡，影响您自身的生活质量与安全感。
              </p>
              <div className="bg-white border border-red-200 rounded-lg p-4 text-sm text-text-secondary leading-relaxed">
                <p className="font-medium text-text-primary mb-2">建议您先完成以下步骤：</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>明确划分"养老专用资产"与"可传承资产"两个账户</li>
                  <li>确保养老资产覆盖预期寿命内的生活+医疗支出</li>
                  <li>仅对养老安全垫之外的资产做传承安排</li>
                </ol>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                重新评估
              </button>
              <button
                onClick={() => {
                  setPreBlocked(false)
                  setInput({ ...input, pre: { ...input.pre, has_retirement_separated: true } })
                  setStep('identity')
                }}
                className="px-6 py-3 border border-border rounded-lg text-text-secondary hover:bg-surface-card transition-colors text-sm"
              >
                我已知晓风险，仍要继续 →
              </button>
            </div>
          </div>
        ) : (
          <>
            <Stepper current={step} onStepClick={setStep} />

            {step === 'pre' && (
              <StepPreAssessment
                data={input.pre}
                onComplete={handlePreComplete}
              />
            )}
            {step === 'identity' && (
              <StepIdentity
                data={input.identity}
                onChange={(identity) => setInput({ ...input, identity })}
                onNext={() => setStep('assets')}
                onBack={() => setStep('pre')}
              />
            )}
            {step === 'assets' && (
              <StepAssets
                data={input.assets}
                onChange={(assets) => setInput({ ...input, assets })}
                onNext={() => setStep('heirs')}
                onBack={() => setStep('identity')}
              />
            )}
            {step === 'heirs' && (
              <StepHeirs
                data={input.heirs}
                onChange={(heirs) => setInput({ ...input, heirs })}
                onNext={() => setStep('document')}
                onBack={() => setStep('assets')}
              />
            )}
            {step === 'document' && (
              <StepDocument
                data={input.document}
                onChange={(doc) => setInput({ ...input, document: doc })}
                onComplete={handleComplete}
                onBack={() => setStep('heirs')}
              />
            )}
          </>
        )}
      </main>

      <footer className="text-center text-xs text-text-muted py-6 border-t border-border px-4">
        本工具仅提供程序合规路径参考，不构成法律意见。具体个案请咨询中日涉外律师或日本司法书士。
      </footer>
    </div>
  )
}
