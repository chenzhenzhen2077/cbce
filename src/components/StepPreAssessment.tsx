import type { PreAssessmentInput } from '../types'

const switchCls =
  'relative w-11 h-6 rounded-full transition-colors cursor-pointer bg-neutral-200 peer-checked:bg-neutral-900 after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5'

export function StepPreAssessment({
  data,
  onComplete,
}: {
  data: PreAssessmentInput
  onComplete: (d: PreAssessmentInput) => void
}) {
  return (
    <div className="space-y-6">
      {/* 时机评估三问 */}
      <div className="bg-surface-card border border-border rounded-xl p-5">
        <h2 className="text-base font-semibold text-text-primary mb-1">
          ⏱ 传承规划的时机评估
        </h2>
        <p className="text-sm text-text-muted mb-4">
          传承规划并不是越早越好。先确认以下三件事，再决定是否进入详细诊断。
        </p>

        {/* Q1 */}
        <div className="py-4 border-b border-border">
          <label className="flex items-start justify-between cursor-pointer gap-4">
            <div className="flex-1">
              <span className="text-sm font-medium text-text-primary">
                您目前是否仍处于主要财富积累阶段？
              </span>
              <p className="text-xs text-text-muted mt-0.5">
                尚未退休，工作/经营收入仍为主要来源
              </p>
            </div>
            <input
              type="checkbox"
              checked={data.is_accumulation_phase}
              onChange={(e) =>
                onComplete({ ...data, is_accumulation_phase: e.target.checked })
              }
              className="peer sr-only"
            />
            <div className={switchCls + ' shrink-0'} />
          </label>
          {data.is_accumulation_phase && (
            <div className="mt-2 ml-0 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800 leading-relaxed">
              💡 积累期建议：传承规划重点放在"指定继承人方向"而非"固定分配比例"。不要在资产还在快速变动时过早锁定具体数字，保留调整弹性。
            </div>
          )}
        </div>

        {/* Q2 */}
        <div className="py-4 border-b border-border">
          <label className="flex items-start justify-between cursor-pointer gap-4">
            <div className="flex-1">
              <span className="text-sm font-medium text-text-primary">
                您的可传承资产是否已与养老/医疗储备金明确隔离？
              </span>
              <p className="text-xs text-text-muted mt-0.5">
                即：有专门的养老资金账户，不会被动用于传承安排
              </p>
            </div>
            <input
              type="checkbox"
              checked={data.has_retirement_separated}
              onChange={(e) =>
                onComplete({
                  ...data,
                  has_retirement_separated: e.target.checked,
                })
              }
              className="peer sr-only"
            />
            <div className={switchCls + ' shrink-0'} />
          </label>
          {!data.has_retirement_separated && (
            <div className="mt-2 ml-0 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-800 leading-relaxed">
              ⚠️ <strong>这是红线。</strong>传承规划绝不能以牺牲被继承人自身的养老安全为代价。建议优先建立养老资金安全垫，用养老之外的资产做传承安排。
            </div>
          )}
        </div>

        {/* Q3 */}
        <div className="pt-4">
          <label className="flex items-start justify-between cursor-pointer gap-4">
            <div className="flex-1">
              <span className="text-sm font-medium text-text-primary">
                是否有需要立即安排的紧迫原因？
              </span>
              <p className="text-xs text-text-muted mt-0.5">
                如健康变化、即将跨国搬迁、子女即将出国留学等
              </p>
            </div>
            <input
              type="checkbox"
              checked={data.has_urgent_reason}
              onChange={(e) =>
                onComplete({ ...data, has_urgent_reason: e.target.checked })
              }
              className="peer sr-only"
            />
            <div className={switchCls + ' shrink-0'} />
          </label>
          {data.has_urgent_reason && (
            <div className="mt-2 ml-0 p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-800 leading-relaxed">
              ✅ 紧迫场景下，流程性错误的代价远大于时间成本。建议尽快完成诊断和方案架构设计，不要拖延。
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        <button
          onClick={() => onComplete(data)}
          className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
        >
          进入正式诊断 →
        </button>
      </div>
    </div>
  )
}
