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
      {/* 时机评估 */}
      <div className="bg-surface-card border border-border rounded-xl p-5">
        <h2 className="text-base font-semibold text-text-primary mb-1">⏱ 先确认三件事</h2>
        <p className="text-xs text-text-muted mb-3">传承规划不是越早越好。先回答三个问题。</p>

        <div className="space-y-2">
          {/* Q1 */}
          <label className="flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-lg hover:bg-neutral-50 transition-colors">
            <div>
              <span className="text-sm text-text-primary">仍处于财富积累阶段？</span>
              <span className="text-xs text-text-muted ml-2">尚未退休，收入为主要来源</span>
            </div>
            <input type="checkbox" checked={data.is_accumulation_phase}
              onChange={(e) => onComplete({ ...data, is_accumulation_phase: e.target.checked })}
              className="peer sr-only" />
            <div className={switchCls + ' shrink-0'} />
          </label>

          {/* Q2 */}
          <label className="flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-lg hover:bg-neutral-50 transition-colors">
            <div>
              <span className="text-sm text-text-primary">养老/医疗资金已单独隔离？</span>
              {!data.has_retirement_separated && <span className="text-xs text-red-500 ml-2">⚠️ 红线</span>}
            </div>
            <input type="checkbox" checked={data.has_retirement_separated}
              onChange={(e) => onComplete({ ...data, has_retirement_separated: e.target.checked })}
              className="peer sr-only" />
            <div className={switchCls + ' shrink-0'} />
          </label>

          {/* Q3 */}
          <label className="flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-lg hover:bg-neutral-50 transition-colors">
            <div>
              <span className="text-sm text-text-primary">有紧迫原因需要立即安排？</span>
              <span className="text-xs text-text-muted ml-2">健康变化、搬迁、子女留学等</span>
            </div>
            <input type="checkbox" checked={data.has_urgent_reason}
              onChange={(e) => onComplete({ ...data, has_urgent_reason: e.target.checked })}
              className="peer sr-only" />
            <div className={switchCls + ' shrink-0'} />
          </label>
        </div>

        {/* 关键提醒：仅当 Q2 未勾选时 */}
        {!data.has_retirement_separated && (
          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-800 leading-relaxed">
            ⚠️ <strong>养老安全优先。</strong>传承不应以牺牲自身养老为代价。先把养老钱隔离出来，再用余下的做传承规划。
          </div>
        )}
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
