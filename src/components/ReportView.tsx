// ============================================================
// 诊断结果页 v5 —— 比赛版
// Tab 分层 + 底部"下一步"导航 + 律师对接在最后一页
// 去除 PDF 导出 / 内部编码展示 / 双籍
// ============================================================

import { useState } from 'react'
import type { ComplianceInput, ReportOutput } from '../types'
import { ASSET_LABELS, HEIR_LOCATION_LABELS, DOC_TYPE_LABELS } from '../types'
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
  { key: 'compare', label: '方案对比', icon: '⚖️' },
  { key: 'costs', label: '费用参考', icon: '💰' },
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
      {tab === 'diagnosis' && <DiagnosisTab report={report} />}
      {tab === 'statutory' && <StatutoryTab input={input} />}
      {tab === 'goals' && <GoalsTab input={input} />}
      {tab === 'compare' && <CompareTab input={input} />}
      {tab === 'costs' && <CostsTab input={input} report={report} />}

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
function DiagnosisTab({ report }: { report: ReportOutput }) {
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

    </div>
  )
}

// ==================== Tab 2: 法定继承（如果不做任何安排）====================
function StatutoryTab({ input }: { input: ComplianceInput }) {
  const isJP = input.identity.habitual_residence === 'JP'
  const h = input.heirs

  // 中国侧继承人
  const cnHeirs: string[] = []
  if (h.spouse_exists) cnHeirs.push('配偶')
  for (let i = 0; i < h.children_count; i++) cnHeirs.push(`子女${h.children_count > 1 ? i + 1 : ''}`)
  for (let i = 0; i < h.parents_alive_count; i++) cnHeirs.push(i === 0 ? '母亲' : '父亲')
  const cnShare = cnHeirs.length > 0 ? Math.round(100 / cnHeirs.length) : 0

  // 日本侧继承人
  const jpItems: { label: string; pct: number; note: string }[] = []
  if (h.spouse_exists && h.children_count > 0) {
    jpItems.push({ label: '配偶', pct: 50, note: '固定份额' })
    for (let i = 0; i < h.children_count; i++) jpItems.push({ label: `子女${h.children_count > 1 ? i + 1 : ''}`, pct: Math.round(50 / h.children_count), note: '' })
  } else if (h.spouse_exists && h.parents_alive_count > 0 && h.children_count === 0) {
    jpItems.push({ label: '配偶', pct: Math.round(200 / 3), note: '无子女时配偶拿2/3' })
    for (let i = 0; i < h.parents_alive_count; i++) jpItems.push({ label: i === 0 ? '母亲' : '父亲', pct: Math.round(100 / 3 / h.parents_alive_count), note: '' })
  } else if (h.spouse_exists && h.children_count === 0 && h.parents_alive_count === 0) {
    jpItems.push({ label: '配偶', pct: 75, note: '' })
    jpItems.push({ label: '兄弟姐妹', pct: 25, note: '第三顺序' })
  } else if (!h.spouse_exists && h.children_count > 0) {
    for (let i = 0; i < h.children_count; i++) jpItems.push({ label: `子女${h.children_count > 1 ? i + 1 : ''}`, pct: Math.round(100 / h.children_count), note: '' })
  } else if (!h.spouse_exists && h.parents_alive_count > 0 && h.children_count === 0) {
    for (let i = 0; i < h.parents_alive_count; i++) jpItems.push({ label: i === 0 ? '母亲' : '父亲', pct: Math.round(100 / h.parents_alive_count), note: '' })
  }

  return (
    <div className="space-y-5">
      {/* 引言 */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>📐 如果不做任何安排——</strong>两国法律会替你决定谁拿什么。问题在于：中国和日本的法定继承规则差异巨大，跨境家庭往往两头不讨好。
        </p>
      </div>

      {/* 第1步：谁有份 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] flex items-center justify-center font-bold">1</span>
          <h4 className="text-sm font-semibold text-text-primary">法定继承：谁有资格、各拿多少？</h4>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {/* CN */}
          <div className="border border-red-200 rounded-xl overflow-hidden">
            <div className="bg-red-50 px-3 py-2 border-b border-red-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-red-deep">🇨🇳 中国《民法典》第1127条</span>
            </div>
            <div className="p-3">
              <p className="text-xs text-text-muted mb-2">第一顺序：配偶、子女、父母。均分{cnShare}%。</p>
              <div className="flex flex-col items-center gap-2">
                {/* 被继承人 */}
                <div className="w-12 h-12 rounded-full bg-neutral-800 text-white flex items-center justify-center text-[11px] font-bold">被继承人</div>
                <div className="w-0.5 h-3 bg-neutral-300" />
                {/* 继承人卡片行 */}
                <div className="flex flex-wrap justify-center gap-1.5">
                  {cnHeirs.map((name, i) => (
                    <span key={i} className="text-[11px] bg-white border border-red-200 rounded-full px-2.5 py-1 text-text-primary">{name} {cnShare}%</span>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-text-muted mt-2">
                {h.spouse_exists ? '配偶先从夫妻共同财产中分走50%，剩余50%由全体第一顺序继承人均分。' : '全体第一顺序继承人均分。'}
              </p>
            </div>
          </div>
          {/* JP */}
          <div className="border border-amber-200 rounded-xl overflow-hidden">
            <div className="bg-amber-50 px-3 py-2 border-b border-amber-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-amber-deep">🇯🇵 日本民法 第887-890条</span>
            </div>
            <div className="p-3">
              <p className="text-xs text-text-muted mb-2">配偶永远是继承人。份额随其他继承人类型变化。</p>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-neutral-800 text-white flex items-center justify-center text-[11px] font-bold">被相続人</div>
                <div className="w-0.5 h-3 bg-neutral-300" />
                <div className="flex flex-wrap justify-center gap-1.5">
                  {jpItems.map((it, i) => (
                    <span key={i} className="text-[11px] bg-white border border-amber-200 rounded-full px-2.5 py-1 text-text-primary">{it.label} {it.pct}%</span>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-text-muted mt-2">
                {h.spouse_exists ? '日本是分别财产制——配偶不能像中国那样先分走一半。登记在被继承人名下的全部进入遗产池。' : '按法定顺序继承。'}
              </p>
            </div>
          </div>
        </div>
        {h.spouse_exists && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-800">
            <strong>🔍 关键差异：</strong>中国法下配偶先拿回自己的50%共同财产再参与继承；日本法下配偶没有这个权利。{isJP ? '你常住日本，这个差异对你影响最大。' : ''}
          </div>
        )}
      </div>

      {/* 第2步：会出什么问题 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] flex items-center justify-center font-bold">2</span>
          <h4 className="text-sm font-semibold text-text-primary">两国规则打架，会出什么问题？</h4>
        </div>
        <div className="space-y-2">
          <div className="border border-red-200 rounded-lg p-3 bg-red-50/50">
            <p className="text-xs font-medium text-red-800 mb-0.5">🚫 继承权"各说各话"</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              中国房管局不认日本出具的继承权证明，日本法務局不认中国公证文书。跨境资产需要在两国各自办理全套手续，互相不通用。
            </p>
          </div>
          {h.has_missing_heir && (
            <div className="border border-red-200 rounded-lg p-3 bg-red-50/50">
              <p className="text-xs font-medium text-red-800 mb-0.5">🚫 继承人失联 = 绝对死锁</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                日本不动产过户需全体继承人在遗产分割协议书上盖章+印鑑証明書。有继承人失联或拒绝配合，不动产法律上无法过户。
              </p>
            </div>
          )}
          {h.children_minor_count > 0 && (
            <div className="border border-amber-200 rounded-lg p-3 bg-amber-50/50">
              <p className="text-xs font-medium text-amber-800 mb-0.5">⚠️ 未成年人需特别代理人</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {h.children_minor_count}名未成年继承人需日本家庭裁判所选任特別代理人，额外耗时2-4个月。
              </p>
            </div>
          )}
          {h.grandchildren_count > 0 && (
            <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50">
              <p className="text-xs font-medium text-blue-800 mb-0.5">💡 孙辈不在法定继承序列</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                你想传给{h.grandchildren_count}名孙辈，但中日法定继承都不包含孙辈。必须有明确的遗嘱或遗赠文书。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 第3步：可以怎么做 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] flex items-center justify-center font-bold">3</span>
          <h4 className="text-sm font-semibold text-text-primary">提前规划 vs 什么都不做</h4>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="border border-green-200 rounded-lg p-3 bg-green-50/50">
            <p className="text-xs font-medium text-green-800 mb-1">✅ 提前立好公证遗嘱</p>
            <ul className="text-xs text-text-secondary space-y-0.5">
              <li>· 中国资产用中国公证遗嘱，国内程序无需海牙认证</li>
              <li>· 日本资产用日本公正证书遗嘱，指定遗言执行者</li>
              <li>· 绕过全体继承人盖章签字的死锁</li>
              {h.grandchildren_count > 0 && <li>· 孙辈通过遗赠明确指定，避免法定继承的默认分配</li>}
            </ul>
          </div>
          <div className="border border-red-200 rounded-lg p-3 bg-red-50/50">
            <p className="text-xs font-medium text-red-800 mb-1">❌ 如果什么都不做</p>
            <ul className="text-xs text-text-secondary space-y-0.5">
              <li>· 继承人需在中日两地各自办理全套公证+认证</li>
              <li>· 日本不动产：全体签字盖章，缺一不可</li>
              <li>· 一旦有继承人失联或分歧，资产冻结1-3年</li>
              {h.grandchildren_count > 0 && <li>· 孙辈在法律上拿不到一分钱</li>}
            </ul>
          </div>
        </div>
      </div>
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
function CostsTab({ input, report }: { input: ComplianceInput; report: ReportOutput }) {
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

// ==================== Tab 4: 方案对比 ====================
function CompareTab({ input }: { input: ComplianceInput }) {
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
    </div>
  )
}
