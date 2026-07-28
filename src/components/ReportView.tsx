import type { ComplianceInput, ReportOutput } from '../types'
import { CN_ASSET_LABELS, JP_ASSET_LABELS, HEIR_LOCATION_LABELS, DOC_TYPE_LABELS } from '../types'
import { downloadPDF } from '../utils/pdf'
import { HeirDiagram } from './HeirDiagram'
import { CalculatorPanel } from './CalculatorPanel'
import { ScenarioComparison } from './ScenarioComparison'
import { AssetStructureCompare } from './AssetStructureCompare'
import type { CalcInput } from '../engine/calculator'

function generateSummary(input: ComplianceInput, report: ReportOutput): string {
  const parts: string[] = []

  // 身份背景
  const residence = input.identity.habitual_residence === 'CN' ? '中国大陆' : '日本'
  const statusMap: Record<string, string> = { VISA: '持有长期工作/经营签证', PR: '日本永住者', CITIZEN: '已归化入籍日本' }
  const natMap: Record<string, string> = { CN: '中国籍', JP: '日本籍', DUAL: '中日双籍', THIRD: '第三国国籍' }
  const idParts = [`被继承人常住${residence}`]
  if (input.identity.jp_legal_status) idParts.push(statusMap[input.identity.jp_legal_status] || input.identity.jp_legal_status)
  if (input.identity.nationality) idParts.push(natMap[input.identity.nationality] || input.identity.nationality)
  parts.push(idParts.join('，') + '。')

  // 资产
  const cnAssets = input.assets.cn_assets.map((a) => CN_ASSET_LABELS[a]).join('、')
  const jpAssets = input.assets.jp_assets.map((a) => JP_ASSET_LABELS[a]).join('、')
  if (cnAssets && jpAssets) {
    parts.push(`在中国大陆拥有：${cnAssets}；在日本拥有：${jpAssets}。`)
  } else if (cnAssets) {
    parts.push(`在中国大陆拥有：${cnAssets}。`)
  } else if (jpAssets) {
    parts.push(`在日本拥有：${jpAssets}。`)
  } else {
    parts.push('未勾选具体资产类别。')
  }

  // 继承人
  const heirParts: string[] = []
  if (input.heirs.heir_locations.length > 0) {
    heirParts.push(`继承人分布在${input.heirs.heir_locations.map((l) => HEIR_LOCATION_LABELS[l]).join('、')}`)
  }
  if (input.heirs.has_missing_heir) heirParts.push('存在失联或拒绝配合的继承人')
  if (input.heirs.has_incapacity_heir) heirParts.push('包含未成年人或限制民事行为能力人')
  if (input.heirs.has_mandatory_share) heirParts.push('存在必留份/特留份权利人')
  if (heirParts.length > 0) {
    parts.push(heirParts.join('；') + '。')
  }

  // 现有安排
  const docLabel = DOC_TYPE_LABELS[input.document.doc_type] || '未选择'
  const apoText = input.document.has_apostille ? '已办理或计划办理海牙认证及双语翻译' : '尚未办理海牙认证'
  parts.push(`当前文书安排：${docLabel}；${apoText}。`)

  // 诊断核心发现
  if (report.blockers.length > 0) {
    parts.push(`\n⚠️ 诊断发现 ${report.blockers.length} 项程序阻断：${report.blockers.map((b) => b.title).join('；')}`)
  }
  if (report.warnings.length > 0) {
    parts.push(`⚡ 存在 ${report.warnings.length} 项预警风险：${report.warnings.map((w) => w.title).join('；')}`)
  }
  if (report.blockers.length === 0 && report.warnings.length === 0) {
    parts.push('\n未检测到程序阻断或显著风险点。')
  }

  return parts.join('\n')
}

const statusConfig = {
  RED: {
    badge: '🔴 红灯阻断',
    desc: '检测到致命程序卡点，需立即处理后方可推进继承程序。',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    badgeBg: 'bg-red-100',
  },
  YELLOW: {
    badge: '🟡 黄灯预警',
    desc: '存在潜在风险或非致命障碍，建议提前规划应对方案。',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    badgeBg: 'bg-amber-100',
  },
  GREEN: {
    badge: '🟢 流程顺畅',
    desc: '当前资产与继承人画像下未检测到阻断或显著风险点。',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    badgeBg: 'bg-green-100',
  },
}

const planningModeLabel: Record<string, string> = {
  urgent: '⚡ 建议尽快完成架构设计。紧迫场景下流程性错误的代价远大于时间成本。',
  elastic: '🔧 弹性规划模式。明确资产分配大方向，暂不锁定具体比例和金额，保留调整弹性。',
  standard: '✅ 时机适宜。可从容完成详细诊断和方案设计，建议每 2-3 年审视一次。',
}

const priorityLabel: Record<string, string> = {
  critical: '🔴 优先解决',
  procedural: '📋 前置程序',
  protective: '🛡 资产保护',
  informational: 'ℹ️ 参考信息',
}

function fmtCost(amount: string, currency: string) {
  const sym = currency === 'JPY' ? '¥' : '¥'
  return `${sym}${amount}${currency === 'JPY' ? ' JPY' : ''}`
}

export function ReportView({
  report,
  input,
  onReset,
}: {
  report: ReportOutput
  input: ComplianceInput
  onReset: () => void
}) {
  const cfg = statusConfig[report.status]

  const handleDownload = () => {
    downloadPDF(input, report)
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Planning mode banner */}
      <div className="bg-surface-card border border-border rounded-xl p-4">
        <p className="text-sm text-text-secondary">
          {planningModeLabel[report.planningMode] || planningModeLabel.standard}
        </p>
      </div>

      {/* Status Header */}
      <div className={`${cfg.bg} ${cfg.border} border rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`${cfg.badgeBg} px-3 py-1 rounded-full text-sm font-semibold ${cfg.text}`}>
            {cfg.badge}
          </span>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            📥 导出 PDF
          </button>
        </div>
        <p className="text-sm text-text-secondary mt-2">{cfg.desc}</p>
      </div>

      {/* Blockers */}
      {report.blockers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-red-deep mb-3">
            🔴 程序阻断项 ({report.blockers.length})
          </h2>
          <div className="space-y-3">
            {report.blockers.map((b) => (
              <div
                key={b.code}
                className="bg-red-soft border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-xs font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                    {b.code}
                  </span>
                  <div>
                    <h3 className="font-semibold text-red-deep">{b.title}</h3>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                      {b.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-amber-deep mb-3">
            🟡 预警项 ({report.warnings.length})
          </h2>
          <div className="space-y-3">
            {report.warnings.map((w) => (
              <div
                key={w.code}
                className="bg-amber-50 border border-amber-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-xs font-mono bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                    {w.code}
                  </span>
                  <div>
                    <h3 className="font-semibold text-amber-deep">{w.title}</h3>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                      {w.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Green status */}
      {report.status === 'GREEN' && (
        <section className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            ✅ 当前资产与继承人画像下未检测到程序阻断或显著风险点。建议仍就具体个案咨询涉外律师确认细节。
          </p>
        </section>
      )}

      {/* Roadmap */}
      {report.roadmap.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            📋 通行路线图 ({report.roadmap.length} 项行动建议)
          </h2>
          <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
            {report.roadmap.map((r, i) => (
              <div
                key={i}
                className={`p-4 ${
                  i < report.roadmap.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 text-xs flex items-center justify-center font-medium mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-text-muted">
                        {priorityLabel[r.priority] || ''}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary leading-relaxed">{r.text}</p>
                    {r.cost && (
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs text-text-secondary bg-neutral-50 px-2 py-1 rounded">
                          💰 {fmtCost(r.cost.amount, r.cost.currency)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-text-secondary bg-neutral-50 px-2 py-1 rounded">
                          ⏱ {r.cost.time}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 继承人关系图 */}
      <HeirDiagram
        data={{
          spouse_exists: input.heirs.spouse_exists,
          children_count: input.heirs.children_count,
          children_minor_count: input.heirs.children_minor_count,
          grandchildren_count: input.heirs.grandchildren_count,
          parents_alive_count: input.heirs.parents_alive_count,
          has_missing_heir: input.heirs.has_missing_heir,
          has_incapacity_heir: input.heirs.has_incapacity_heir || input.heirs.children_minor_count > 0,
          habitual_residence: input.identity.habitual_residence || 'CN',
        }}
        totalValueLabel={(() => {
          const cats = [...input.assets.cn_assets, ...input.assets.jp_assets]
          return cats.length > 0 ? `${cats.length} 类资产` : '待确认'
        })()}
      />

      {/* 计算框架 */}
      <CalculatorPanel
        hasSpouse={input.heirs.spouse_exists}
        childrenCount={input.heirs.children_count}
        grandchildrenCount={input.heirs.grandchildren_count}
        parentsAlive={input.heirs.parents_alive_count}
        habitualResidence={input.identity.habitual_residence || 'CN'}
        maritalRegime={input.identity.habitual_residence === 'JP' ? 'JP_separate' : 'CN_community'}
        hasWill={input.document.doc_type !== '' && input.document.doc_type !== 'NONE'}
        willType={input.document.doc_type || 'none'}
      />

      {/* 方案对比 */}
      <ScenarioComparison input={{
        totalValueCNY: 500,
        cnRealEstatePct: input.assets.cn_assets.includes('cn_re') ? 40 : 0,
        cnFinancialPct: input.assets.cn_assets.includes('cn_fin') ? 20 : 0,
        cnLeveragePct: input.assets.cn_assets.includes('cn_leverage') ? 10 : 0,
        jpRealEstatePct: input.assets.jp_assets.includes('jp_re') ? 20 : 0,
        jpFinancialPct: input.assets.jp_assets.includes('jp_fin') ? 10 : 0,
        hasSpouse: input.heirs.spouse_exists,
        childrenCount: input.heirs.children_count,
        grandchildrenCount: input.heirs.grandchildren_count,
        parentsAlive: input.heirs.parents_alive_count,
        habitualResidence: input.identity.habitual_residence === 'JP' ? 'JP' : 'CN',
        maritalRegime: input.identity.habitual_residence === 'JP' ? 'JP_separate' : 'CN_community',
        hasWill: input.document.doc_type !== '' && input.document.doc_type !== 'NONE',
        willType: input.document.doc_type || 'none',
      } as CalcInput} />

      {/* 资产结构对比 */}
      <AssetStructureCompare
        totalValue={500}
        habitualResidence={input.identity.habitual_residence === 'JP' ? '日本' : '中国'}
      />

      {/* CTA Zone */}
      <section className="bg-surface-card border border-border rounded-xl p-5">
        <h2 className="text-base font-semibold text-text-primary mb-2">
          📞 对接涉外律师
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-3">
          本工具提供程序合规路径参考，不构成法律意见。如需个案处理，建议将下方案情摘要发送给中日涉外律师或日本司法书士。
        </p>
        <div className="bg-surface border border-border rounded-lg p-4 relative group">
          <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {generateSummary(input, report)}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(generateSummary(input, report))
            }}
            className="absolute top-2 right-2 text-xs px-2 py-1 bg-white border border-border rounded hover:bg-neutral-50 transition-colors"
          >
            复制
          </button>
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleDownload}
          className="flex-1 px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
        >
          导出 PDF 诊断报告
        </button>
        <button
          onClick={onReset}
          className="px-6 py-3 border border-border rounded-lg font-medium text-text-secondary hover:bg-surface-card transition-colors"
        >
          重新诊断
        </button>
      </div>
    </div>
  )
}
