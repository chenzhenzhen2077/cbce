import type { HeirInput, HeirLocation } from '../types'
import { HEIR_LOCATION_LABELS } from '../types'
import { QuestionCard } from './QuestionCard'

const heirLocations: HeirLocation[] = ['HEIR_CN', 'HEIR_JP', 'HEIR_THIRD']

const checkboxCls =
  'w-full text-left px-4 py-3 rounded-lg border border-border bg-surface-card hover:border-neutral-400 transition-colors cursor-pointer peer-checked:border-neutral-900 peer-checked:bg-neutral-50'

const switchCls =
  'relative w-11 h-6 rounded-full transition-colors cursor-pointer bg-neutral-200 peer-checked:bg-neutral-900 after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5'

const numBtnCls =
  'w-10 h-10 rounded-lg border border-border bg-surface-card text-text-primary font-medium hover:border-neutral-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'

export function StepHeirs({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: HeirInput
  onChange: (d: HeirInput) => void
  onNext: () => void
  onBack: () => void
}) {
  const toggleLocation = (loc: HeirLocation) => {
    const next = data.heir_locations.includes(loc)
      ? data.heir_locations.filter((l) => l !== loc)
      : [...data.heir_locations, loc]
    onChange({ ...data, heir_locations: next })
  }

  return (
    <div className="space-y-5">
      {/* 配偶 */}
      <QuestionCard title="配偶情况">
        <label className="flex items-center justify-between cursor-pointer py-2">
          <span className="text-text-primary">被继承人有配偶</span>
          <input
            type="checkbox"
            checked={data.spouse_exists}
            onChange={(e) => onChange({ ...data, spouse_exists: e.target.checked })}
            className="peer sr-only"
          />
          <div className={switchCls} />
        </label>
        {data.spouse_exists && (
          <p className="text-xs text-text-muted mt-1">
            配偶在中国法定继承中先分割夫妻共同财产的一半，再参与剩余部分分配；日本法中配偶固定为继承人，份额依其他继承人类型而定。
          </p>
        )}
      </QuestionCard>

      {/* 子女 */}
      <QuestionCard title="子女情况">
        <div className="flex items-center justify-between py-2">
          <span className="text-text-primary">子女人数</span>
          <div className="flex items-center gap-1">
            <button
              className={numBtnCls}
              disabled={data.children_count <= 0}
              onClick={() => onChange({ ...data, children_count: Math.max(0, data.children_count - 1), children_minor_count: Math.min(data.children_minor_count, Math.max(0, data.children_count - 1)) })}
            >
              −
            </button>
            <span className="w-10 text-center font-semibold text-text-primary">{data.children_count}</span>
            <button
              className={numBtnCls}
              onClick={() => onChange({ ...data, children_count: data.children_count + 1 })}
            >
              +
            </button>
          </div>
        </div>
        {data.children_count > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm text-text-primary">其中未成年人</span>
                <p className="text-xs text-text-muted mt-0.5">
                  未成年人需特别法定代理程序，中日两国均需另行指定监护人/特别代理人
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className={numBtnCls}
                  disabled={data.children_minor_count <= 0}
                  onClick={() => onChange({ ...data, children_minor_count: Math.max(0, data.children_minor_count - 1) })}
                >
                  −
                </button>
                <span className={`w-10 text-center font-semibold ${data.children_minor_count > 0 ? 'text-amber-600' : 'text-text-primary'}`}>{data.children_minor_count}</span>
                <button
                  className={numBtnCls}
                  disabled={data.children_minor_count >= data.children_count}
                  onClick={() => onChange({ ...data, children_minor_count: data.children_minor_count + 1, has_incapacity_heir: true })}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </QuestionCard>

      {/* 孙辈 */}
      <QuestionCard
        title="指定继承的孙辈"
        hint="孙辈非法定继承人。如需跳过子女直接传给孙辈（隔代传承），必须通过遗嘱或遗赠指定。常见于子女婚姻不稳定、希望资产直达第三代的高净值家庭。"
      >
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-text-primary">需要指定继承的孙辈人数</span>
            <p className="text-xs text-text-muted mt-0.5">
              隔代传承需要设立明确文书，中日两国均无法定代位权（除非子女已先于被继承人去世）
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button className={numBtnCls} disabled={data.grandchildren_count <= 0} onClick={() => onChange({ ...data, grandchildren_count: Math.max(0, data.grandchildren_count - 1) })}>−</button>
            <span className={`w-10 text-center font-semibold ${data.grandchildren_count > 0 ? 'text-blue-600' : 'text-text-primary'}`}>{data.grandchildren_count}</span>
            <button className={numBtnCls} onClick={() => onChange({ ...data, grandchildren_count: data.grandchildren_count + 1 })}>+</button>
          </div>
        </div>
        {data.grandchildren_count > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 leading-relaxed">
            💡 <strong>隔代传承要点：</strong>需在遗嘱/遗赠文书中明确指定孙辈为受益人。中国《民法典》第1133条允许遗赠给法定继承人以外的人；日本民法允许通过遗嘱指定继承人。建议设立<strong>信托架构</strong>或<strong>附条件遗赠</strong>（如"孙辈年满25岁后方可取得"）来保护未成年孙辈的利益。
          </div>
        )}
      </QuestionCard>

      {/* 父母 */}
      <QuestionCard
        title="在世父母"
        hint="中国法定继承中父母为第一顺序继承人。日本法中父母在无子女时才进入继承顺序。"
      >
        <div className="flex items-center justify-between py-2">
          <span className="text-text-primary">在世父母人数</span>
          <div className="flex items-center gap-1">
            <button className={numBtnCls} disabled={data.parents_alive_count <= 0} onClick={() => onChange({ ...data, parents_alive_count: Math.max(0, data.parents_alive_count - 1) })}>−</button>
            <span className="w-10 text-center font-semibold text-text-primary">{data.parents_alive_count}</span>
            <button className={numBtnCls} disabled={data.parents_alive_count >= 2} onClick={() => onChange({ ...data, parents_alive_count: data.parents_alive_count + 1 })}>+</button>
          </div>
        </div>
      </QuestionCard>

      {/* 继承人分布 */}
      <QuestionCard title="继承人主要分布地（多选）">
        <div className="space-y-2">
          {heirLocations.map((loc) => (
            <label key={loc} className="cursor-pointer block">
              <input
                type="checkbox"
                checked={data.heir_locations.includes(loc)}
                onChange={() => toggleLocation(loc)}
                className="peer sr-only"
              />
              <div className={checkboxCls}>{HEIR_LOCATION_LABELS[loc]}</div>
            </label>
          ))}
        </div>
      </QuestionCard>

      {/* 特殊情形 */}
      <QuestionCard title="特殊情形">
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm text-text-primary">存在失联或拒绝配合的继承人</span>
              <p className="text-xs text-text-muted mt-0.5">
                日本不动产过户需全体继承人盖章，如有失联将导致绝对死锁
              </p>
            </div>
            <input type="checkbox" checked={data.has_missing_heir} onChange={(e) => onChange({ ...data, has_missing_heir: e.target.checked })} className="peer sr-only" />
            <div className={switchCls + ' shrink-0 ml-3'} />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm text-text-primary">存在限制民事行为能力继承人</span>
              <p className="text-xs text-text-muted mt-0.5">
                未成年人以外的心智障碍、被监护人等（未成年人已在子女栏统计）
              </p>
            </div>
            <input type="checkbox" checked={data.has_incapacity_heir} onChange={(e) => onChange({ ...data, has_incapacity_heir: e.target.checked })} className="peer sr-only" />
            <div className={switchCls + ' shrink-0 ml-3'} />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm text-text-primary">存在必留份/特留份权利人</span>
              <p className="text-xs text-text-muted mt-0.5">
                中国法"双无人员"或日本"遗留分"权利人
              </p>
            </div>
            <input type="checkbox" checked={data.has_mandatory_share} onChange={(e) => onChange({ ...data, has_mandatory_share: e.target.checked })} className="peer sr-only" />
            <div className={switchCls + ' shrink-0 ml-3'} />
          </label>
        </div>
      </QuestionCard>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-5 py-2.5 text-text-secondary hover:text-text-primary transition-colors">
          ← 上一步
        </button>
        <button onClick={onNext} className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors">
          下一步：文书与程序 →
        </button>
      </div>
    </div>
  )
}
