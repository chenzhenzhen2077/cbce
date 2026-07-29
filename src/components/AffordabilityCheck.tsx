// ============================================================
// 继承可行性评估
// 核心问题：继承人需要先垫付多少钱才能拿到资产？
// ============================================================

import { useState } from 'react'

export function AffordabilityCheck({
  hasRealEstate,
  hasJPAssets,
  hasCNFinancial,
  onUnlock,
}: {
  hasRealEstate: boolean
  hasJPAssets: boolean
  hasCNFinancial: boolean
  onUnlock: (name: string) => void
}) {
  const [estateValue, setEstateValue] = useState(500)
  const [cashAvailable, setCashAvailable] = useState(50)

  // 粗略费用估算（万元）
  const cnNotaryRate = 0.008  // 0.8% 不动产公证费（中位）
  const jpRegTaxRate = 0.035  // 登録免許税1.5-2% + 不動産取得税3-4% 合计约3.5%+
  const jpOtherRate = 0.005   // 司法书士+印紙
  const basicRate = 0.005     // 基础公证/认证费用

  let upfrontPct = basicRate
  if (hasRealEstate && hasJPAssets) upfrontPct = cnNotaryRate + jpRegTaxRate + jpOtherRate
  else if (hasRealEstate) upfrontPct = cnNotaryRate + 0.001
  else if (hasJPAssets) upfrontPct = jpRegTaxRate + jpOtherRate

  const estimatedFees = Math.round(estateValue * upfrontPct * 100) / 100
  const canAfford = cashAvailable >= estimatedFees
  const gapAmount = Math.round((estimatedFees - cashAvailable) * 100) / 100
  const feePct = Math.round(upfrontPct * 1000) / 10

  // 如果全是房产且现金不够 → 这是最典型的问题场景
  const isTrap = hasRealEstate && !hasCNFinancial && !canAfford

  return (
    <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
      <div className="bg-neutral-50 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          💳 继承可行性评估：你的继承人能继承得起吗？
        </h3>
        <p className="text-xs text-text-muted mt-0.5">
          继承不是免费的。继承人需要先垫付登记费、公证费、税费，然后才能拿到资产。
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* 问题说明 */}
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
          <strong>💡 核心问题：</strong>
          假设你有一套 1,000 万的房产，继承人可能需要先拿出 20-50 万现金来支付各项手续费用，才能完成过户。如果全部资产都锁在房产里，继承人自己又没有足够现金——<strong>继承得起资产，但继承不起手续</strong>。
        </div>

        {/* 滑块 */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-text-secondary">资产总额（估算）</span>
              <span className="font-semibold text-text-primary">{estateValue} 万元</span>
            </div>
            <input type="range" min={50} max={3000} step={50} value={estateValue}
              onChange={(e) => setEstateValue(Number(e.target.value))}
              className="w-full accent-neutral-900" />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-text-secondary">继承人可动用现金</span>
              <span className="font-semibold text-text-primary">{cashAvailable} 万元</span>
            </div>
            <input type="range" min={0} max={300} step={5} value={cashAvailable}
              onChange={(e) => setCashAvailable(Number(e.target.value))}
              className="w-full accent-neutral-900" />
          </div>
        </div>

        {/* 结算卡 */}
        <div className={`border-2 rounded-xl p-4 ${canAfford ? 'border-green-300 bg-green-50/50' : 'border-red-300 bg-red-50/50'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-text-primary">预估垫付费用</span>
            <span className={`text-xl font-bold ${canAfford ? 'text-green-700' : 'text-red-700'}`}>
              {estimatedFees} 万元
            </span>
          </div>

          <div className="space-y-2 text-xs text-text-secondary">
            <div className="flex justify-between">
              <span>费用占资产比例</span>
              <span className="font-medium">{feePct}%</span>
            </div>
            <div className="flex justify-between">
              <span>继承人可用现金</span>
              <span className="font-medium">{cashAvailable} 万元</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border/50">
              <span className="font-medium text-text-primary">
                {canAfford ? '✅ 现金足够支付，剩余' : '🚫 现金缺口'}
              </span>
              <span className={`font-bold ${canAfford ? 'text-green-700' : 'text-red-700'}`}>
                {canAfford ? `${Math.round((cashAvailable - estimatedFees) * 100) / 100} 万元` : `${gapAmount} 万元`}
              </span>
            </div>
          </div>
        </div>

        {/* 场景分析 */}
        {isTrap && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-800 mb-2">
              🚨 注意：你正处于"房产流动性陷阱"
            </p>
            <p className="text-xs text-red-700 leading-relaxed mb-3">
              你的资产主要集中在房产上，且没有足够的金融资产（存款/股票）。这意味着继承人可能需要卖掉房产才能支付继承手续费用——但卖房产本身也需要先完成继承登记。"不登记不能卖，不卖没钱登记"——这就是死循环。
            </p>
            <p className="text-xs font-medium text-red-800">
              建议：保留至少 {Math.round(estimatedFees * 2)} 万元的流动资产（存款/理财），专门用于覆盖继承费用。或者考虑将部分房产在生前变现。
            </p>
          </div>
        )}

        {/* 现金够的情况 */}
        {canAfford && !isTrap && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800 leading-relaxed">
            ✅ 以你当前资产配置，继承人用现有现金可以覆盖预估的继承手续费用。但这只是粗略估算——实际费用因具体资产情况、继承人分布和法律适用而变化。付费版本可提供精确到继承人的费用分项。
          </div>
        )}

        {/* 关键提示 */}
        <div className="text-xs text-text-muted leading-relaxed space-y-1">
          <p>📌 <strong>以上费用估算包含：</strong>公证费、登记税、司法书士/律师费、海牙认证费。不包含日本继承税（相続税）——继承税金额因继承人身份和资产分配而异，建议咨询日本税理士。</p>
          <p>📌 <strong>被继承人能做的是：</strong>① 保留足够现金覆盖继承费用（不要让资产全部锁在房产里）；② 提前立好分立遗嘱减少跨境程序费用；③ 将不同资产合理分配到不同继承人名下降低整体税负。</p>
        </div>
      </div>

      <div className="border-t border-border px-5 py-4 bg-neutral-50 text-center">
        <p className="text-sm text-text-secondary mb-3">
          完整版提供精确到每个继承人的费用分项和支付方案。
        </p>
        <button
          onClick={() => onUnlock('继承可行性评估')}
          className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          解锁完整分析 →
        </button>
      </div>
    </div>
  )
}
