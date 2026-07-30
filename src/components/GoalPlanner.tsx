// ============================================================
// 传承目标规划器
// 三个用户目标 → 对应的法律策略方案
// ============================================================

import type { ComplianceInput } from '../types'

interface Goal {
  id: string
  icon: string
  title: string
  question: string
  strategy: string
  documents: string[]
  procedures: string[]
  watchOut: string
}

function buildGoals(input: ComplianceInput): Goal[] {
  const hasJP = input.assets.jp_assets.length > 0
  const hasCN = input.assets.cn_assets.length > 0
  const hasRE = input.assets.cn_assets.includes('cn_re') || input.assets.jp_assets.includes('jp_re')
  const hasGrandkids = input.heirs.grandchildren_count > 0
  const hasMissing = input.heirs.has_missing_heir
  const isJP = input.identity.habitual_residence === 'JP'

  const goals: Goal[] = [
    // ---- 目标 1: 指定分配 ----
    {
      id: 'designate',
      icon: '🎯',
      title: '按我的意愿分配',
      question: '"我想让特定的人拿到特定的资产——不是法定继承那种平均分。"',
      strategy: hasCN && hasJP
        ? '采用分立架构（Split Wills）：中国资产立中国公证遗嘱，日本资产立日本公正证书遗嘱。两国资产各自按所在国法律执行，避免跨境互认文书的麻烦。遗嘱中明确指定每项资产的归属人。'
        : hasCN
          ? '中国资产立公证遗嘱，在公证处办理。这是中国执行力最强的遗嘱形式，可以精确指定每项资产给谁，不需要与其他继承人平分。'
          : '日本资产立公正证书遗嘱，由公证人制作并保管。可在遗嘱中指定具体的继承人和资产分配方式，同时指定"遗言执行者"负责执行。',
      documents: [
        hasCN ? '中国公证遗嘱（在公证处办理，含财产清单+继承人指定+分配方案）' : '',
        hasJP ? '日本公正证书遗嘱（公证人面前口述+公证人记录+签名盖章）' : '',
        hasJP ? '遗言执行者指定书（指定一名可信赖的人负责执行遗嘱）' : '',
        hasGrandkids ? '遗赠协议书（将特定资产遗赠给孙辈，须明确受遗赠人身份和资产描述）' : '',
        hasMissing ? '遗产分割方案 + 替代继承人条款（如某继承人无法配合，资产如何处理）' : '',
      ].filter(Boolean),
      procedures: [
        hasCN ? '① 预约公证处，携带身份证+房产证/资产证明+继承人身份信息' : '',
        hasCN ? '② 公证员面谈，确认遗嘱内容是本人真实意愿' : '',
        hasCN ? '③ 签署公证遗嘱，公证处存档一份' : '',
        hasJP ? '④ 预约日本公证人（公証人），准备资产清单和继承人信息' : '',
        hasJP ? '⑤ 公证人面谈，由公证人根据口述制作公正证书' : '',
        hasJP ? '⑥ 公证人保管遗嘱正本' : '',
        '⑦ 告知可信任的家人或执行人遗嘱存放位置',
      ].filter(Boolean),
      watchOut: hasMissing
        ? '⚠️ 有失联继承人：遗嘱中须明确"如某继承人无法在X个月内配合办理，其继承份额如何处理"，否则即使有遗嘱，不动产过户仍可能卡住。'
        : hasGrandkids
          ? '⚠️ 孙辈非法定继承人：必须用"遗赠"而非"继承"来指定。遗赠需明确资产描述+受益人身份，建议附条件（如年满25岁），并指定遗赠执行人。'
          : '⚠️ 中国公证遗嘱虽然执行力最强，但不能自动覆盖日本资产。日本资产需要单独的日本文书。',
    },

    // ---- 目标 2: 税费最优 ----
    {
      id: 'tax',
      icon: '💰',
      title: '让继承人花最少的钱',
      question: '"继承本身已经够麻烦了，能不能让他们少出点钱？"',
      strategy: hasJP && isJP
        ? `核心策略：最大化日本配偶继承税抵免（最高 1.6 亿 JPY 免税额度），同时通过分立架构将中国资产与日本资产程序分离，避免跨境双向海牙认证费用。${hasRE ? '如果有不动产，考虑将部分房产在生前置换为流动性资产，减少继承登记环节的税费。' : ''}`
        : hasCN
          ? `核心策略：中国目前无继承税，主要费用在公证费和登记费上。${hasRE ? '不动产继承公证费分段累进（0.5%-1.2%），可通过生前赠与（如适用）或提前安排共有产权来降低。' : ''}减少跨境因素可以省掉海牙认证和翻译质证的费用。`
          : '核心策略：提前规划的主要省钱点在于——避免跨境认证费用、避免因继承人分歧导致的诉讼费用、以及利用配偶税收抵免。',
      documents: [
        '分立遗嘱架构（中国公证遗嘱 + 日本公正证书遗嘱）',
        hasRE ? '资产清单 + 评估报告（明确房产的固定资产评估额）' : '',
        isJP ? '日本配偶继承税抵免计算表' : '',
        '建议：同时咨询中国税务师 + 日本税理士确认具体税负',
      ].filter(Boolean),
      procedures: [
        '① 盘点全部资产，按国家/类别整理清单',
        hasRE ? '② 获取不动产的评估价值（中国：房产证登记价；日本：固定資産税評価額）' : '',
        '③ 计算法定继承下的预估税费 → 与分立架构对比',
        isJP ? '④ 如配偶为主要继承人，确认日本配偶税收抵免适用条件（最高1.6亿JPY）' : '',
        '⑤ 设立分立遗嘱，将两国资产程序分离',
        '⑥ 定期审视：税法可能有变，每2-3年复查一次',
      ].filter(Boolean),
      watchOut: '⚠️ 税务建议仅供参考，请咨询持牌税理士/税务师确认具体数字。尤其日本继承税超额累进（10%-55%），高净值家庭务必提前规划。另外，继承人能否"垫付得起"税费也是关键——详见下方"继承可行性评估"。',
    },

    // ---- 目标 3: 流程最简 ----
    {
      id: 'simple',
      icon: '⚡',
      title: '让继承人跑最少的手续',
      question: '"我不想让家人为了继承我的东西跑断腿。能不能尽量简单？"',
      strategy: hasMissing
        ? `最大障碍是${hasRE ? '不动产' : '资产'}的全体继承人签字要求。策略：①在日本指定遗言执行者，绕过继承人盖章；②${hasCN ? '中国资产用公证遗嘱，无需全体继承人到场公证；' : ''}③将需要全体签字的资产（不动产）和不需签字的资产（金融资产）在遗嘱中分开处理，金融资产先行分配。`
        : hasCN && hasJP
          ? '分立架构是最简方案：两国资产各自按当地法律执行，继承人各自在当地办手续，无需跨境跑流程。中国公证遗嘱 + 日本公正证书遗嘱（含遗言执行者），两套程序独立并行。'
          : hasCN
            ? '中国公证遗嘱是最简方案：一份公证遗嘱覆盖全部中国资产，继承人凭遗嘱+公证处出具的继承权证明即可办理过户，无需法院介入。'
            : '日本公正证书遗嘱 + 遗言执行者是最简方案：公证人制作并保管遗嘱，遗言执行者负责执行，继承人无需自行跑流程。',
      documents: [
        hasCN ? '中国公证遗嘱' : '',
        hasJP ? '日本公正证书遗嘱（含遗言执行者指定）' : '',
        hasJP ? '遗言执行者委任状' : '',
        '资产清单（按"需签字"和"不需签字"分类）',
      ].filter(Boolean),
      procedures: [
        hasCN ? '① 中国公证处：一次面谈，完成公证遗嘱' : '',
        hasJP ? '② 日本公证人：一次预约，完成公正证书遗嘱' : '',
        hasJP ? '③ 指定遗言执行者（可为亲属、司法书士或律师）' : '',
        '④ 告知继承人遗嘱存放位置和执行人联系方式',
        '⑤ 每2-3年复查一次，确认资产和继承人情况未变',
      ].filter(Boolean),
      watchOut: hasMissing
        ? '⚠️ 有失联继承人时，即使流程最简方案也需要预留"替代方案"——如果某个继承人无法联系到，资产如何处置？建议在遗嘱中明确替代条款。'
        : '⚠️ 最简不等于零手续。继承登记（不动产过户）是法律强制要求，任何方案都无法绕过。日本2024年起更强制要求继承开始后3年内完成登记。',
    },
  ]

  return goals
}

export function GoalPlanner({ input }: { input: ComplianceInput; onUnlock?: (name: string) => void }) {
  const goals = buildGoals(input)

  return (
    <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
      <div className="bg-neutral-50 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          🗺 传承方案设计（付费功能预览）
        </h3>
        <p className="text-xs text-text-muted mt-0.5">
          基于你的诊断结果，以下是三种不同目标的法律策略方案。选择你最关心的一项目标。
        </p>
      </div>

      <div className="p-5 space-y-5">
        {goals.map((g) => (
          <div key={g.id} className="border border-border rounded-xl overflow-hidden">
            {/* 目标头部 */}
            <div className="bg-neutral-50 px-4 py-3 border-b border-border flex items-start gap-3">
              <span className="text-2xl">{g.icon}</span>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-text-primary">{g.title}</h4>
                <p className="text-xs text-text-secondary mt-0.5 italic">"{g.question}"</p>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* 策略 */}
              <div>
                <p className="text-xs font-medium text-text-primary mb-1">📋 核心策略</p>
                <p className="text-xs text-text-secondary leading-relaxed">{g.strategy}</p>
              </div>

              {/* 需要准备的文件 */}
              <div>
                <p className="text-xs font-medium text-text-primary mb-1">📄 需要准备的法律文件</p>
                <ul className="space-y-1">
                  {g.documents.map((d, i) => (
                    <li key={i} className="text-xs text-text-secondary flex gap-1.5">
                      <span className="text-green-500 shrink-0">✓</span> {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 办理步骤 */}
              <div>
                <p className="text-xs font-medium text-text-primary mb-1">🔄 办理步骤</p>
                <ul className="space-y-1">
                  {g.procedures.map((p, i) => (
                    <li key={i} className="text-xs text-text-secondary">{p}</li>
                  ))}
                </ul>
              </div>

              {/* 注意事项 */}
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <p className="text-xs text-amber-800 leading-relaxed">{g.watchOut}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="border-t border-border px-5 py-4 bg-neutral-50 text-center">
        <p className="text-sm text-text-secondary">
          以上方案基于你的诊断结果生成。如需律师一对一咨询，请通过下方联系方式对接。
        </p>
      </div>
    </div>
  )
}
