import type { AssetInput, AssetCat } from '../types'
import { ASSET_LABELS } from '../types'
import { QuestionCard } from './QuestionCard'

const allKeys: AssetCat[] = ['real_estate', 'financial', 'insurance', 'physical', 'leverage']

const checkboxCls =
  'w-full text-left px-4 py-3 rounded-lg border border-border bg-surface-card hover:border-neutral-400 transition-colors cursor-pointer peer-checked:border-neutral-900 peer-checked:bg-neutral-50'

export function StepAssets({
  data, onChange, onNext, onBack,
}: {
  data: AssetInput
  onChange: (d: AssetInput) => void
  onNext: () => void
  onBack: () => void
}) {
  const toggleCN = (key: AssetCat) => {
    if (key === 'leverage') return
    const next: AssetCat[] = data.cn_assets.includes(key)
      ? data.cn_assets.filter((a: AssetCat) => a !== key)
      : [...data.cn_assets, key]
    onChange({ ...data, cn_assets: next })
  }
  const toggleJP = (key: AssetCat) => {
    if (key === 'leverage') return
    const next: AssetCat[] = data.jp_assets.includes(key)
      ? data.jp_assets.filter((a: AssetCat) => a !== key)
      : [...data.jp_assets, key]
    onChange({ ...data, jp_assets: next })
  }
  const toggleCNLeverage = () => {
    const next: AssetCat[] = data.cn_assets.includes('leverage')
      ? data.cn_assets.filter((a: AssetCat) => a !== 'leverage')
      : [...data.cn_assets, 'leverage' as AssetCat]
    onChange({ ...data, cn_assets: next })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
        ⚠️ 仅勾选资产属性，<strong>严禁</strong>收集房产证号、银行账号、估值金额等隐私数据。
      </p>

      <QuestionCard title="🇨🇳 中国大陆资产">
        <div className="space-y-2">
          {allKeys.map((key) => {
            if (key === 'leverage') {
              return (
                <label key={key} className="cursor-pointer block">
                  <input type="checkbox" checked={data.cn_assets.includes('leverage')} onChange={toggleCNLeverage} className="peer sr-only" />
                  <div className={checkboxCls}>
                    <span>{ASSET_LABELS[key]}</span>
                    <span className="text-[11px] text-text-muted block mt-0.5">⚠️ 高危：券商可依约直接强平</span>
                  </div>
                </label>
              )
            }
            return (
              <label key={key} className="cursor-pointer block">
                <input type="checkbox" checked={data.cn_assets.includes(key)} onChange={() => toggleCN(key)} className="peer sr-only" />
                <div className={checkboxCls}>{ASSET_LABELS[key]}</div>
              </label>
            )
          })}
        </div>
      </QuestionCard>

      <QuestionCard title="🇯🇵 日本资产">
        <div className="space-y-2">
          {allKeys.filter(k => k !== 'leverage').map((key) => (
            <label key={key} className="cursor-pointer block">
              <input type="checkbox" checked={data.jp_assets.includes(key)} onChange={() => toggleJP(key)} className="peer sr-only" />
              <div className={checkboxCls}>{ASSET_LABELS[key]}</div>
            </label>
          ))}
        </div>
      </QuestionCard>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-5 py-2.5 text-text-secondary hover:text-text-primary transition-colors">← 上一步</button>
        <button onClick={onNext} className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors">下一步：继承人画像 →</button>
      </div>
    </div>
  )
}
