// ============================================================
// 诊断结果页 v5 —— 比赛版
// Tab 分层 + 底部"下一步"导航 + 律师对接在最后一页
// 去除 PDF 导出 / 内部编码展示 / 双籍
// ============================================================

import { useState } from 'react'
import type { ComplianceInput, ReportOutput } from '../types'
import { ASSET_LABELS, HEIR_LOCATION_LABELS, DOC_TYPE_LABELS } from '../types'
import { HeirDiagram } from './HeirDiagram'
import { GoalPlanner } from './GoalPlanner'
import { CalculatorPanel } from './CalculatorPanel'
import { ScenarioComparison } from './ScenarioComparison'
import { AssetStructureCompare } from './AssetStructureCompare'
import { AffordabilityCheck } from './AffordabilityCheck'
import type { CalcInput } from '../engine/calculator'

// ---- 自然语言案情摘要 ----
function generateSummary(input: ComplianceInput, report: ReportOutput): string {
  const parts: string[] = []
  const residence = input.identity.habitual_residence === 'CN' ? '中国大陆' : '日本'
  const statusMap: Record<string, string> = { VISA: '持有长期工作/经营签证', PR: '日本永住者', CITIZEN: '已归化入籍日本' }
  const natMap: Record<string, string> = { CN: '中国籍', JP: '日本籍', THIRD: '第三国/地区' }
  const idParts = [`被继承人常住${residence}`]
  if (input.identity.jp_legal_status) idParts.push(statusMap[input.identity.jp_legal_status] || input.identity.jp_legal_status)
  if (input.identity.nationality) idParts.push(natMap[input.identity.nationality] || input.identity.nationality)
  parts.push(idParts.join('，') + '。')
  const cnAssets = input.assets.cn_assets.map((a) => ASSET_LABELS[a]).join('、')
  const jpAssets = input.assets.jp_assets.map((a) => ASSET_LABELS[a]).join('、')
  if (cnAssets && jpAssets) parts.push(`在中国大陆拥有：${cnAssets}；在日本拥有：${jpAssets}。`)
  else if (cnAssets) parts.push(`在中国大陆拥有：${cnAssets}。`)
  else if (jpAssets) parts.push(`在日本拥有：${jpAssets}。`)
  const heirParts: string[] = []
  if (input.heirs.heir_locations.length > 0) heirParts.push(`继承人分布在${input.heirs.heir_locations.map((l) => HEIR_LOCATION_LABELS[l]).join('、')}`)
  if (input.heirs.has_missing_heir) heirParts.push('存在失联或拒绝配合的继承人')
  if (input.heirs.children_minor_count > 0) heirParts.push(`含 ${input.heirs.children_minor_count} 名未成年人`)
  if (input.heirs.has_mandatory_share) heirParts.push('存在必留份/特留份权利人')
  if (heirParts.length > 0) parts.push(heirParts.join('；') + '。')
  const docLabel = DOC_TYPE_LABELS[input.document.doc_type] || '未选择'
  const apoText = input.document.has_apostille ? '已办理或计划办理海牙认证及双语翻译' : '尚未办理海牙认证'
  parts.push(`当前文书安排：${docLabel}；${apoText}。`)
  if (report.blockers.length > 0) parts.push(`\n⚠️ 诊断发现 ${report.blockers.length} 项程序阻断：${report.blockers.map((b) => b.title).join('；')}`)
  if (report.warnings.length > 0) parts.push(`⚡ 存在 ${report.warnings.length} 项预警：${report.warnings.map((w) => w.title).join('；')}`)
  if (report.blockers.length === 0 && report.warnings.length === 0) parts.push('\n未检测到程序阻断或显著风险点。')
  return parts.join('\n')
}

const statusConfig = {
  RED: { badge: '🔴 红灯阻断', desc: '检测到致命程序卡点，需立即处理。', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badgeBg: 'bg-red-100' },
  YELLOW: { badge: '🟡 黄灯预警', desc: '存在潜在风险，建议提前规划。', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badgeBg: 'bg-amber-100' },
  GREEN: { badge: '🟢 流程顺畅', desc: '未检测到阻断或显著风险点。', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badgeBg: 'bg-green-100' },
}

const priorityLabel: Record<string, string> = {
  critical: '🔴 优先解决', procedural: '📋 前置程序', protective: '🛡 资产保护', informational: 'ℹ️ 参考信息',
}

type Tab = 'diagnosis' | 'statutory' | 'goals' | 'costs' | 'compare'

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'diagnosis', label: '诊断结果', icon: '📊' },
  { key: 'statutory', label: '法定继承', icon: '📐' },
  { key: 'goals', label: '传承方案', icon: '🗺' },
  { key: 'costs', label: '费用参考', icon: '💰' },
  { key: 'compare', label: '方案对比', icon: '⚖️' },
]

function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }

export function ReportView({ report, input, onReset }: { report: ReportOutput; input: ComplianceInput; onReset: () => void }) {
  const cfg = statusConfig[report.status]
  const [tab, setTab] = useState<Tab>('diagnosis')
  const currentIdx = tabs.findIndex(t => t.key === tab)
  const isLast = currentIdx === tabs.length - 1

  return (
    <div className="space-y-4">
      {/* === 状态头 === */}
      <div className={`${cfg.bg} ${cfg.border} border rounded-xl p-5`}>
        <span className={`${cfg.badgeBg} px-3 py-1 rounded-full text-sm font-semibold ${cfg.text}`}>{cfg.badge}</span>
        <p className="text-sm text-text-secondary mt-2">{cfg.desc}</p>
      </div>

      {/* === Tab 导航 === */}
      <div className="bg-white border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); scrollTop() }}
              className={`shrink-0 px-3 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap
                ${tab === t.key ? 'bg-white border border-border border-b-white -mb-[1px] text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}>
              {t.icon} <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* === Tab 内容 === */}
      {tab === 'diagnosis' && <DiagnosisTab report={report} input={input} />}
      {tab === 'statutory' && <StatutoryTab input={input} />}
      {tab === 'goals' && <GoalsTab input={input} />}
      {tab === 'costs' && <CostsTab input={input} />}
      {tab === 'compare' && <CompareTab input={input} report={report} />}

      {/* === 底部导航 === */}
      <div className="flex items-center justify-between pt-2">
        <button onClick={onReset} className="text-sm text-text-muted hover:text-text-secondary transition-colors">← 重新诊断</button>
        {!isLast ? (
          <button onClick={() => { setTab(tabs[currentIdx + 1].key); scrollTop() }}
            className="px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
            下一步：{tabs[currentIdx + 1].label} →
          </button>
        ) : (
          <div className="text-xs text-text-muted">已展示全部内容</div>
        )}
      </div>
    </div>
  )
}

// ==================== Tab 1: 诊断结果 ====================
function DiagnosisTab({ report, input }: { report: ReportOutput; input: ComplianceInput }) {
  return (
    <div className="space-y-4">
      {report.blockers.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-red-deep mb-2">🔴 程序阻断项</h2>
          <div className="space-y-2">
            {report.blockers.map((b) => (
              <div key={b.code} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h3 className="font-semibold text-sm text-red-deep">{b.title}</h3>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{b.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {report.warnings.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-amber-deep mb-2">🟡 预警项</h2>
          <div className="space-y-2">
            {report.warnings.map((w) => (
              <div key={w.code} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <h3 className="font-semibold text-sm text-amber-deep">{w.title}</h3>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{w.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {report.status === 'GREEN' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">✅ 未检测到阻断或显著风险点。</p>
        </div>
      )}

      {report.roadmap.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">📋 行动路线图</h2>
          <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
            {report.roadmap.map((r, i) => (
              <div key={i} className={`p-3 ${i < report.roadmap.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-neutral-100 text-neutral-600 text-[11px] flex items-center justify-center font-medium mt-0.5">{i + 1}</span>
                  <div>
                    <span className="text-[11px] text-text-muted">{priorityLabel[r.priority]}</span>
                    <p className="text-xs text-text-primary leading-relaxed">{r.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <HeirDiagram
        data={{
          spouse_exists: input.heirs.spouse_exists, children_count: input.heirs.children_count,
          children_minor_count: input.heirs.children_minor_count, grandchildren_count: input.heirs.grandchildren_count,
          parents_alive_count: input.heirs.parents_alive_count, has_missing_heir: input.heirs.has_missing_heir,
          has_incapacity_heir: input.heirs.has_incapacity_heir || input.heirs.children_minor_count > 0,
          habitual_residence: input.identity.habitual_residence || 'CN',
        }}
      />
    </div>
  )
}

// ==================== Tab 2: 法定继承（如果不做任何安排）====================
function StatutoryTab({ input }: { input: ComplianceInput }) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>📐 如果不做任何安排——</strong>以下是你去世后，按照中国和日本各自的法定继承规则，资产将如何分配。这就是你选择"什么都不做"的默认结果。
        </p>
      </div>
      <HeirDiagram
        data={{
          spouse_exists: input.heirs.spouse_exists, children_count: input.heirs.children_count,
          children_minor_count: input.heirs.children_minor_count, grandchildren_count: input.heirs.grandchildren_count,
          parents_alive_count: input.heirs.parents_alive_count, has_missing_heir: input.heirs.has_missing_heir,
          has_incapacity_heir: input.heirs.has_incapacity_heir || input.heirs.children_minor_count > 0,
          habitual_residence: input.identity.habitual_residence || 'CN',
        }}
      />
    </div>
  )
}

// ==================== Tab 3: 传承方案 ====================
function GoalsTab({ input }: { input: ComplianceInput }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>💡 大多数人的需求不是三选一：</strong>既想指定人、又想少花钱、还想流程快——好的规划可以同时做到。以下三项方案互补而非互斥。
        </p>
      </div>
      <GoalPlanner input={input} />
    </div>
  )
}

// ==================== Tab 3: 费用参考 ====================
function CostsTab({ input }: { input: ComplianceInput }) {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-red-800 mb-1">⚠️ 以下为预估参考，不构成税务意见</p>
        <p className="text-xs text-red-700 leading-relaxed">
          所有费用和税费均为基于公开法定费率/税率的<strong>参考估算框架</strong>。实际金额因个案情况、资产评估方式、地方政策差异和汇率波动而异。<strong>请务必咨询持牌税理士/税务师确认具体数字。</strong>
        </p>
      </div>
      <CalculatorPanel
        hasSpouse={input.heirs.spouse_exists} childrenCount={input.heirs.children_count}
        grandchildrenCount={input.heirs.grandchildren_count} parentsAlive={input.heirs.parents_alive_count}
        habitualResidence={input.identity.habitual_residence || 'CN'}
        maritalRegime={input.identity.habitual_residence === 'JP' ? 'JP_separate' : 'CN_community'}
        hasWill={input.document.doc_type !== '' && input.document.doc_type !== 'NONE'}
        willType={input.document.doc_type || 'none'}
      />
      <AffordabilityCheck
        hasRealEstate={input.assets.cn_assets.includes('real_estate') || input.assets.jp_assets.includes('real_estate')}
        hasJPAssets={input.assets.jp_assets.length > 0}
        hasCNFinancial={input.assets.cn_assets.includes('financial') || input.assets.cn_assets.includes('insurance')}
        onUnlock={() => {}}
      />
    </div>
  )
}

// ==================== Tab 4: 方案对比 + 律师对接 ====================
function CompareTab({ input, report }: { input: ComplianceInput; report: ReportOutput }) {
  return (
    <div className="space-y-4">
      <ScenarioComparison input={{
        totalValueCNY: 500, cnRealEstatePct: input.assets.cn_assets.includes('real_estate') ? 40 : 0,
        cnFinancialPct: input.assets.cn_assets.includes('financial') ? 20 : 0,
        cnLeveragePct: input.assets.cn_assets.includes('leverage') ? 10 : 0,
        jpRealEstatePct: input.assets.jp_assets.includes('real_estate') ? 20 : 0,
        jpFinancialPct: input.assets.jp_assets.includes('financial') ? 10 : 0,
        hasSpouse: input.heirs.spouse_exists, childrenCount: input.heirs.children_count,
        grandchildrenCount: input.heirs.grandchildren_count, parentsAlive: input.heirs.parents_alive_count,
        habitualResidence: input.identity.habitual_residence === 'JP' ? 'JP' : 'CN',
        maritalRegime: input.identity.habitual_residence === 'JP' ? 'JP_separate' : 'CN_community',
        hasWill: input.document.doc_type !== '' && input.document.doc_type !== 'NONE',
        willType: input.document.doc_type || 'none',
      } as CalcInput} />

      <AssetStructureCompare totalValue={500}
        habitualResidence={input.identity.habitual_residence === 'JP' ? '日本' : '中国'} />

      {/* 律师对接 —— 最后一页 */}
      <section className="bg-surface-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">📞 对接涉外律师</h3>
        <p className="text-xs text-text-secondary mb-2">复制下方案情摘要发送给中日涉外律师或日本司法书士。</p>
        <div className="bg-surface border border-border rounded-lg p-3 relative group">
          <div className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">{generateSummary(input, report)}</div>
          <button onClick={() => navigator.clipboard.writeText(generateSummary(input, report))}
            className="absolute top-2 right-2 text-[11px] px-2 py-1 bg-white border border-border rounded hover:bg-neutral-50 transition-colors">复制</button>
        </div>
      </section>
    </div>
  )
}
