import type { AssetInput, AssetCN, AssetJP } from '../types'
import { CN_ASSET_LABELS, JP_ASSET_LABELS } from '../types'
import { QuestionCard } from './QuestionCard'

const cnAssetKeys: AssetCN[] = ['cn_re', 'cn_fin', 'cn_leverage', 'cn_digital']
const jpAssetKeys: AssetJP[] = ['jp_re', 'jp_fin', 'jp_digital']

const checkboxCls =
  'w-full text-left px-4 py-3 rounded-lg border border-border bg-surface-card hover:border-neutral-400 transition-colors cursor-pointer peer-checked:border-neutral-900 peer-checked:bg-neutral-50'

export function StepAssets({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: AssetInput
  onChange: (d: AssetInput) => void
  onNext: () => void
  onBack: () => void
}) {
  const toggleCN = (key: AssetCN) => {
    const next = data.cn_assets.includes(key)
      ? data.cn_assets.filter((a) => a !== key)
      : [...data.cn_assets, key]
    onChange({ ...data, cn_assets: next })
  }

  const toggleJP = (key: AssetJP) => {
    const next = data.jp_assets.includes(key)
      ? data.jp_assets.filter((a) => a !== key)
      : [...data.jp_assets, key]
    onChange({ ...data, jp_assets: next })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
        ⚠️ 仅勾选资产属性（如"有不动产""有金融资产"），<strong>严禁</strong>收集房产证号、银行账号、估值金额等隐私数据。
      </p>

      <QuestionCard title="🇨🇳 中国大陆资产">
        <div className="space-y-2">
          {cnAssetKeys.map((key) => (
            <label key={key} className="cursor-pointer block">
              <input
                type="checkbox"
                checked={data.cn_assets.includes(key)}
                onChange={() => toggleCN(key)}
                className="peer sr-only"
              />
              <div className={checkboxCls}>{CN_ASSET_LABELS[key]}</div>
            </label>
          ))}
        </div>
      </QuestionCard>

      <QuestionCard title="🇯🇵 日本资产">
        <div className="space-y-2">
          {jpAssetKeys.map((key) => (
            <label key={key} className="cursor-pointer block">
              <input
                type="checkbox"
                checked={data.jp_assets.includes(key)}
                onChange={() => toggleJP(key)}
                className="peer sr-only"
              />
              <div className={checkboxCls}>{JP_ASSET_LABELS[key]}</div>
            </label>
          ))}
        </div>
      </QuestionCard>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-text-secondary hover:text-text-primary transition-colors"
        >
          ← 上一步
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
        >
          下一步：继承人画像 →
        </button>
      </div>
    </div>
  )
}
