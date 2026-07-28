// ============================================================
// 资产分配模拟计算器
// 核心：展示每个继承人要出多少钱、实际到手多少
// ============================================================

import { useState } from 'react'
import type { CalcInput } from '../engine/calculator'
import { calculate } from '../engine/calculator'

export function CalculatorPanel({
  hasSpouse,
  childrenCount,
  grandchildrenCount,
  parentsAlive,
  habitualResidence,
  hasWill,
  willType,
}: {
  hasSpouse: boolean
  childrenCount: number
  grandchildrenCount: number
  parentsAlive: number
  habitualResidence: 'CN' | 'JP' | ''
  hasWill: boolean
  willType: string
}) {
  const [totalValue, setTotalValue] = useState(500)
  const [cnRE, setCnRE] = useState(40)
  const [cnFin, setCnFin] = useState(20)
  const [cnLev, setCnLev] = useState(0)
  const [jpRE, setJpRE] = useState(30)
  const [jpFin, setJpFin] = useState(10)
  const [showDetail, setShowDetail] = useState(true)

  const input: CalcInput = {
    totalValueCNY: totalValue,
    cnRealEstatePct: cnRE,
    cnFinancialPct: cnFin,
    cnLeveragePct: cnLev,
    jpRealEstatePct: jpRE,
    jpFinancialPct: jpFin,
    hasSpouse,
    childrenCount,
    grandchildrenCount: grandchildrenCount || 0,
    parentsAlive,
    habitualResidence: habitualResidence === 'JP' ? 'JP' : 'CN',
    hasWill,
    willType: willType || 'none',
  }

  const result = calculate(input)
  const pctSum = cnRE + cnFin + cnLev + jpRE + jpFin
  const activeHeirs = result.heirs.filter((h) => h.sharePct > 0)

  return (
    <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
      <div className="bg-neutral-50 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          🧮 法定继承模拟计算
        </h3>
        <p className="text-xs text-text-muted mt-0.5">
          假设被继承人已去世，以下为各继承人需自行承担的费用和实际到手金额
        </p>
      </div>

      {/* 输入 */}
      <div className="p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-text-primary">资产总额</span>
            <span className="text-text-secondary">
              <input type="number" value={totalValue}
                onChange={(e) => setTotalValue(Math.max(50, Math.min(5000, Number(e.target.value) || 50)))}
                className="w-20 text-right font-semibold border border-border rounded-lg px-2 py-0.5 text-text-primary text-sm" />
              <span className="ml-1">万元</span>
            </span>
          </div>
          <input type="range" min={50} max={5000} step={10} value={totalValue}
            onChange={(e) => setTotalValue(Number(e.target.value))}
            className="w-full accent-neutral-900" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-text-secondary">
            各类资产占比 {pctSum !== 100 && <span className="text-amber-600">（当前 {pctSum}%，建议调至 100%）</span>}
          </p>
          <PctSlider label="🇨🇳 中国不动产" value={cnRE} onChange={setCnRE} />
          <PctSlider label="🇨🇳 中国金融资产" value={cnFin} onChange={setCnFin} />
          <PctSlider label="🇨🇳 中国杠杆/配资" value={cnLev} onChange={setCnLev} />
          <PctSlider label="🇯🇵 日本不动产" value={jpRE} onChange={setJpRE} />
          <PctSlider label="🇯🇵 日本金融资产" value={jpFin} onChange={setJpFin} />
        </div>
      </div>

      {/* 结果 */}
      <div className="border-t border-border">
        <div className="p-5">
          <p className="text-sm text-text-secondary leading-relaxed mb-4">{result.scenarioNote}</p>

          {/* 汇总卡 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <StatCard label="资产总额" value={`${result.totalValueCNY} 万元`} />
            <StatCard label="中国资产" value={`${result.cnAssetValue} 万元`} />
            <StatCard label="日本资产" value={`${result.jpAssetValue} 万元（${result.jpAssetValueJPY} 万円）`} />
            <StatCard label="继承人费用合计" value={`${result.globalFeesTotal} 万元`} sub={`占总资产 ${result.totalValueCNY > 0 ? Math.round(result.globalFeesTotal / result.totalValueCNY * 1000) / 10 : 0}%`} highlight />
          </div>

          <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-800 leading-relaxed mb-2">
            💡 {result.comparisonNote}
          </div>
        </div>

        {/* 各继承人明细 */}
        {activeHeirs.length > 0 && (
          <div className="border-t border-border">
            <button
              onClick={() => setShowDetail(!showDetail)}
              className="w-full text-left px-5 py-3 flex items-center justify-between text-sm font-medium text-text-primary hover:bg-neutral-50 transition-colors"
            >
              <span>👥 各继承人费用与实收明细（{activeHeirs.length} 人）</span>
              <span className="text-text-muted text-xs">{showDetail ? '收起 ▲' : '展开 ▼'}</span>
            </button>

            {showDetail && (
              <div className="px-5 pb-5 space-y-4">
                {activeHeirs.map((h, i) => (
                  <div key={i} className={`border rounded-xl overflow-hidden ${
                    h.riskBadge === 'high' ? 'border-red-300' :
                    h.riskBadge === 'medium' ? 'border-amber-300' :
                    'border-border'
                  }`}>
                    {/* 继承人头部 */}
                    <div className={`px-4 py-3 flex items-center justify-between ${
                      h.riskBadge === 'high' ? 'bg-red-50' :
                      h.riskBadge === 'medium' ? 'bg-amber-50' :
                      'bg-neutral-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          h.riskBadge === 'high' ? 'bg-red-500' :
                          h.riskBadge === 'medium' ? 'bg-amber-500' :
                          'bg-green-500'
                        }`} />
                        <span className="font-semibold text-text-primary">{h.label}</span>
                        <span className="text-xs text-text-muted">{h.relationship} · {h.location}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-text-muted">应得份额</div>
                        <div className="font-bold text-text-primary">{h.sharePct}% · {h.grossAmount} 万元</div>
                      </div>
                    </div>

                    {/* 费用清单 */}
                    <div className="px-4 py-3 space-y-1.5">
                      <p className="text-xs text-text-muted mb-1">需承担的费用：</p>
                      {h.costs.map((c, j) => (
                        <div key={j} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span>{c.country === 'CN' ? '🇨🇳' : '🇯🇵'}</span>
                            <span className="text-text-secondary">{c.name}</span>
                            <span className="text-text-muted text-[10px]">（{c.rate}）</span>
                          </div>
                          <span className={`font-mono ${c.amount > 0 ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                            {c.amount > 0 ? `−${c.amount} 万` : '免缴'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 汇总行 */}
                    <div className="px-4 py-3 bg-surface flex items-center justify-between border-t border-border">
                      <div className="text-xs text-text-muted">
                        费用小计 <span className="text-red-600 font-semibold">−{h.totalCost} 万元</span>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted">实际到手</div>
                        <div className="text-base font-bold text-green-700">{h.netAmount} 万元</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PctSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-secondary w-28 shrink-0">{label}</span>
      <input type="range" min={0} max={100} step={5} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-neutral-900 h-1.5" />
      <span className="text-xs text-text-primary w-10 text-right font-medium">{value}%</span>
    </div>
  )
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 text-center ${highlight ? 'border-amber-300 bg-amber-50' : 'border-border'}`}>
      <div className="text-[11px] text-text-muted">{label}</div>
      <div className={`text-sm font-bold mt-0.5 ${highlight ? 'text-amber-800' : 'text-text-primary'}`}>{value}</div>
      {sub && <div className="text-[10px] text-text-muted mt-0.5">{sub}</div>}
    </div>
  )
}
