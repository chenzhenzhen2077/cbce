// ============================================================
// 多方案对比：法定继承 vs 分立架构 vs 配偶集中 vs 隔代传承
// ============================================================

import type { CalcInput, CalcResult, HeirAllocation } from '../engine/calculator'
import { calculate } from '../engine/calculator'

interface ScenarioDef {
  id: string
  icon: string
  title: string
  tagline: string
  description: string
  willType: string
  feeAdjust: number        // 费用调整系数（1=基准, <1=更省）
  timeRange: string
  pros: string[]
  cons: string[]
}

function buildScenarios(input: CalcInput): { def: ScenarioDef; result: CalcResult }[] {
  const base = calculate(input)

  // 分立架构：节约约 40% 跨境认证费用
  const splitInput = { ...input, willType: 'split_wills', hasWill: true }
  const splitResult = calculate(splitInput)
  // 分立架构下费用更低（避免跨境认证），手动调整
  const splitFeeAdj = 0.6
  splitResult.globalFeesTotal = Math.round(base.globalFeesTotal * splitFeeAdj * 100) / 100
  splitResult.heirs = splitResult.heirs.map((h) => ({
    ...h,
    totalCost: Math.round(h.totalCost * splitFeeAdj * 100) / 100,
    netAmount: Math.round((h.grossAmount - h.totalCost * splitFeeAdj) * 100) / 100,
    costs: h.costs.map((c) => ({
      ...c,
      amount: Math.round(c.amount * splitFeeAdj * 100) / 100,
    })),
  }))

  // 配偶集中：全给配偶，JP 税最大抵免，但 CN 父母有必留份
  const spouseInput = { ...input, willType: 'split_wills', hasWill: true }
  const spouseResult = calculate(spouseInput)

  // 将资产全部集中给配偶
  const spouseOnlyHeirs: HeirAllocation[] = []
  const cnHeirCount = (input.hasSpouse ? 1 : 0) + input.childrenCount + input.parentsAlive
  let spouseSharePct = 100
  // CN 父母必留份（双无人员）
  if (input.parentsAlive > 0) spouseSharePct = Math.max(70, spouseSharePct - input.parentsAlive * 15)

  if (input.hasSpouse) {
    const spouseHeir = spouseResult.heirs.find((h) => h.relationship === '配偶')
    if (spouseHeir) {
      const grossAmount = input.totalValueCNY * spouseSharePct / 100
      // 配偶集中：JP 继承税大幅减少（配偶抵免最大化）
      const jpCosts = spouseHeir.costs.filter((c) => c.country === 'CN')
      // JP 税：配偶拿到几乎全部 JP 资产，享受最高 1.6 亿 JPY 抵免
      const spouseJPFeeAdj = 0.15 // 配偶抵免后只剩 15%
      const jpCostsAdj = spouseHeir.costs.filter((c) => c.country === 'JP').map((c) => ({
        ...c,
        amount: Math.round(c.amount * spouseJPFeeAdj * 100) / 100,
      }))
      const allCosts = [...jpCosts, ...jpCostsAdj]
      const totalCost = Math.round(allCosts.reduce((s, c) => s + c.amount, 0) * 100) / 100

      spouseOnlyHeirs.push({
        ...spouseHeir,
        sharePct: spouseSharePct,
        grossAmount: Math.round(grossAmount * 100) / 100,
        costs: allCosts,
        totalCost,
        netAmount: Math.round((grossAmount - totalCost) * 100) / 100,
        specialNote: `配偶集中继承。因 CN 父母必留份，保留 ${100 - spouseSharePct}% 给父母。`,
      })
    }
  }

  // 父母分剩余
  if (input.parentsAlive > 0 && 100 - spouseSharePct > 0) {
    const parentPct = Math.round((100 - spouseSharePct) / input.parentsAlive)
    for (let i = 0; i < input.parentsAlive; i++) {
      const gross = input.totalValueCNY * parentPct / 100
      spouseOnlyHeirs.push({
        label: i === 0 ? '父亲' : '母亲',
        relationship: '父母',
        sharePct: parentPct,
        grossAmount: Math.round(gross * 100) / 100,
        costs: [{ name: '继承权公证', amount: Math.round(gross * 0.005 * 100) / 100, rate: '~0.5%', country: 'CN' }],
        totalCost: Math.round(gross * 0.005 * 100) / 100,
        netAmount: Math.round(gross * 0.995 * 100) / 100,
        location: '中国大陆',
        specialNote: '法定必留份，不可完全剥夺',
        riskBadge: 'medium',
      })
    }
  }

  spouseResult.heirs = spouseOnlyHeirs
  spouseResult.globalFeesTotal = Math.round(spouseOnlyHeirs.reduce((s, h) => s + h.totalCost, 0) * 100) / 100

  // 子女在配偶集中方案中得不到资产
  if (input.childrenCount > 0 && spouseSharePct >= 100) {
    spouseResult.comparisonNote = '⚠️ 子女在此方案中不直接继承资产。配偶去世后需二次传承。'
  }

  const defs: ScenarioDef[] = [
    {
      id: 'statutory',
      icon: '😐',
      title: '法定继承',
      tagline: '什么都不做',
      description: `走纯法定继承流程，${input.hasSpouse ? '配偶先分 50% 共同财产，' : ''}剩余由 ${cnHeirCount} 位第一顺序继承人均分。中日两地互不认可对方继承文书，需双向海牙认证 + 翻译质证。`,
      willType: 'none',
      feeAdjust: 1,
      timeRange: '6–18 个月',
      pros: ['无需提前做任何安排', '法定保障底线公平'],
      cons: ['费用最高', '耗时长', '继承人需全部配合盖章签字', '日本不动产存在死锁风险'],
    },
    {
      id: 'split',
      icon: '📋',
      title: '分立架构',
      tagline: '推荐方案',
      description: '中国资产立中国公证遗嘱，日本资产立日本公正证书遗嘱。两国资产分别按各自法律执行，无需跨境互认文书。可在日本指定"遗言执行者"绕过继承人签章。',
      willType: 'split_wills',
      feeAdjust: 0.6,
      timeRange: '3–9 个月',
      pros: ['跨境认证费用减少约 40%', '无需全部继承人配合盖章', '耗时缩短一半', '两地程序独立并行'],
      cons: ['需分别在中日两方办理文书', '前期规划成本 ¥5,000–¥80,000'],
    },
    {
      id: 'spouse',
      icon: '🎯',
      title: '配偶集中',
      tagline: '最省税费',
      description: `通过分立架构将绝大部分资产指定给配偶。日本配偶享有最高 1.6 亿 JPY 继承税抵免，税费降至最低。中国侧需为父母保留法定必留份（${input.parentsAlive > 0 ? `${input.parentsAlive * 15}%` : '0%'}）。`,
      willType: 'split_wills',
      feeAdjust: 0.35,
      timeRange: '3–6 个月',
      pros: ['日本继承税最低（配偶抵免最大化）', '继承人最少、协调成本最低', '流程最快'],
      cons: ['子女不直接继承，需二次传承', '中国父母必留份不可剥夺', '配偶再婚可能影响子女最终利益'],
    },
    {
      id: 'grandchild',
      icon: '👶',
      title: '隔代传承',
      tagline: '跳过子女，直达孙辈',
      description: '通过分立遗嘱或遗赠将资产指定给孙辈。适合子女婚姻不稳定、或希望资产跳过子女直接给第三代的高净值家庭。中日两国均需明确的遗嘱/遗赠文书。建议搭配信托架构保护未成年孙辈。',
      willType: 'split_wills',
      feeAdjust: 0.7,
      timeRange: '3–9 个月',
      pros: ['资产跳过子女婚姻风险', '直接保障第三代利益', '可设附条件遗赠（年满25岁方可取得）'],
      cons: ['子女可能不满，有法律挑战风险', '未成年孙辈需指定监护人管理资产', '孙辈非法定继承人，文书要求更严格', '中国《民法典》第1133条允许遗赠，但形式要件须严格遵守'],
    },
  ]

  return [
    { def: defs[0], result: base },
    { def: defs[1], result: splitResult },
    { def: defs[2], result: spouseResult },
    { def: defs[3], result: splitResult },
  ]
}

export function ScenarioComparison({ input }: { input: CalcInput }) {
  const scenarios = buildScenarios(input)
  const base = scenarios[0].result

  return (
    <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
      <div className="bg-neutral-50 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          🔀 方案对比：哪种方式最划算？
        </h3>
        <p className="text-xs text-text-muted mt-0.5">
          同一笔资产，四种处理方式，费用和流程差异一目了然
        </p>
      </div>

      {/* 对比总览表 —— 横纵交换：行=方案 列=维度 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-3 py-3 text-xs font-medium text-text-muted min-w-[120px]">方案</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-text-muted min-w-[90px]">💰 总费用</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-text-muted min-w-[80px]">⏱ 耗时</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-text-muted min-w-[140px]">📝 手续</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-text-muted min-w-[90px]">🤝 配合</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-text-muted min-w-[100px]">🇯🇵 继承税</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-text-muted min-w-[120px]">👥 分配</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {scenarios.map((s) => (
              <tr key={s.def.id} className={s.def.id === 'split' ? 'bg-neutral-50/50' : ''}>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{s.def.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{s.def.title}</div>
                      {s.def.id === 'split' && <span className="text-[10px] bg-neutral-900 text-white px-1 rounded-full">推荐</span>}
                    </div>
                  </div>
                </td>
                <td className="text-center px-3 py-3">
                  <span className={`text-sm font-bold ${s === scenarios[0] ? 'text-red-600' : s === scenarios[1] ? 'text-amber-600' : 'text-green-600'}`}>
                    {s.result.globalFeesTotal} 万
                  </span>
                  {s !== scenarios[0] && (
                    <div className="text-[11px] text-green-600">省 {Math.round((base.globalFeesTotal - s.result.globalFeesTotal) * 100) / 100} 万</div>
                  )}
                </td>
                <td className="text-center px-3 py-3 text-sm text-text-primary">{s.def.timeRange}</td>
                <td className="text-center px-3 py-3 text-xs text-text-secondary">
                  {s.def.id === 'statutory' ? '双向海牙认证 + 两国公证 + 登记' :
                   s.def.id === 'split' ? '各自在本国公证 + 登记（独立并行）' :
                   s.def.id === 'spouse' ? '配偶单方公证 + 登记（最少）' :
                   '分立遗嘱 + 遗赠指定'}
                </td>
                <td className="text-center px-3 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    s.def.id === 'statutory' ? 'bg-red-100 text-red-700' :
                    s.def.id === 'split' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {s.def.id === 'statutory' ? '全体盖章签字' :
                     s.def.id === 'split' ? '指定执行人处理' :
                     '仅配偶办理'}
                  </span>
                </td>
                <td className="text-center px-3 py-3">
                  <span className={`text-xs font-medium ${
                    s.def.id === 'statutory' ? 'text-red-600' :
                    s.def.id === 'split' ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                    {s.def.id === 'statutory' ? '按法定份额各自缴' :
                     s.def.id === 'split' ? '同左，可优化分配' :
                     s.def.id === 'spouse' ? '配偶抵免最大化' :
                     '与分立架构相同'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="space-y-0.5">
                    {s.result.heirs.filter((h) => h.sharePct > 0).slice(0, 3).map((h, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] gap-1">
                        <span className="text-text-secondary">{h.label}</span>
                        <span className="font-medium text-text-primary">{h.sharePct}%</span>
                      </div>
                    ))}
                    {s.result.heirs.filter((h) => h.sharePct > 0).length === 0 && <span className="text-text-muted text-xs">—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 各方案详情 */}
      <div className="border-t border-border p-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {scenarios.map((s) => (
            <div key={s.def.id} className={`border rounded-xl p-4 ${
              s.def.id === 'split' ? 'border-neutral-400 ring-1 ring-neutral-200' : 'border-border'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{s.def.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-text-primary">{s.def.title}</div>
                  {s.def.id === 'split' && (
                    <span className="text-[10px] bg-neutral-900 text-white px-1.5 py-0.5 rounded-full">推荐</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mb-3">{s.def.description}</p>

              <div className="space-y-2">
                <div>
                  <p className="text-[11px] font-medium text-green-700 mb-1">✅ 优点</p>
                  <ul className="space-y-0.5">
                    {s.def.pros.map((p, i) => (
                      <li key={i} className="text-[11px] text-text-secondary flex gap-1">
                        <span className="text-green-500 shrink-0">✓</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-red-700 mb-1">⚠️ 注意</p>
                  <ul className="space-y-0.5">
                    {s.def.cons.map((c, i) => (
                      <li key={i} className="text-[11px] text-text-secondary flex gap-1">
                        <span className="text-red-400 shrink-0">✗</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
