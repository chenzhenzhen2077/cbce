// ============================================================
// 资产结构对比：全现金 vs 全房产 vs 混合
// 核心视角：从继承人角度看，哪种资产结构最"友好"
// ============================================================

import { useState } from 'react'

interface Structure {
  id: string
  icon: string
  title: string
  tagline: string
  subline: string
  cnCash: number; cnRE: number; jpCash: number; jpRE: number
  friendlyScore: number       // 继承友好度 1-10
  friendlyLabel: string
  difficulty: string
  fees: { name: string; amount: string }[]
  totalFeePct: string
  procedures: string[]
  heirsPainPoints: string[]
  pros: string[]
  cons: string[]
  recommended: boolean
}

function fmtM(v: number): string {
  if (v === 0) return '—'
  return `${v} 万元`
}

export function AssetStructureCompare({
  totalValue,
  habitualResidence,
}: {
  totalValue: number
  habitualResidence: string
}) {
  const T = totalValue || 500
  const isJP = habitualResidence === 'JP'
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ mixed: true })

  const structures: Structure[] = [
    {
      id: 'all-cash',
      icon: '💵',
      title: '全部现金/金融资产',
      tagline: '继承人最省心的配置',
      subline: '流动性即安全感。钱到账比房本到名快 12 个月。',
      cnCash: T * 0.6, cnRE: 0, jpCash: T * 0.4, jpRE: 0,
      friendlyScore: 9,
      friendlyLabel: '极高。继承人只需跑银行，不跑房管局/法務局',
      difficulty: '低',
      fees: [
        { name: '继承权公证 + 银行解冻（中国侧）', amount: fmtM(Math.round(T * 0.6 * 0.005 * 100) / 100) },
        { name: '金融口座名义变更（日本侧）', amount: fmtM(Math.round(T * 0.4 * 0.002 * 100) / 100) },
        { name: '不动产登记/过户/司法书士费', amount: '无（无房产 = 无此烦恼）' },
      ],
      totalFeePct: '~0.3–0.8%',
      procedures: ['亲属关系公证', '继承权公证', '银行解冻（中）+ 口座变更（日）'],
      heirsPainPoints: [
        isJP ? '⚠️ 永住者汇出中国继承资金需外管局审批' : '⚠️ 日本银行可能不认中国公证文书',
        '银行解冻需所有继承人配合或公证委托',
        '大额现金转移可能触发反洗钱审查',
      ],
      pros: [
        '分割精确到分，不存在"一套房三个人分"的困局',
        '零不动产登记环节——省掉最多的时间和手续费',
        '继承人无需全体盖章（房产过户才要）',
        '想卖就卖，想持有就持有，无需跟其他继承人商量',
      ],
      cons: [
        '没有不动产的长期保值属性',
        '全部现金可能在通胀中缩水',
      ],
      recommended: false,
    },
    {
      id: 'all-re',
      icon: '🏠',
      title: '全部房产',
      tagline: '从继承人角度看，这是最差的配置',
      subline: '房产 ≠ 资产。对继承人而言，房产 = 无法分割 + 全体盖章 + 垫钱过户 + 卖不掉。',
      cnCash: 0, cnRE: T * 0.6, jpCash: 0, jpRE: T * 0.4,
      friendlyScore: 2,
      friendlyLabel: '极低。继承人要垫钱、要协调、要等，而且可能永远卖不掉',
      difficulty: '极高',
      fees: [
        { name: '中国不动产继承公证费（分段累进）', amount: fmtM(Math.round(T * 0.6 * 0.008 * 100) / 100) },
        { name: '中国过户登记 + 印花税', amount: fmtM(Math.round(T * 0.6 * 0.005 * 100) / 100 + 0.055) },
        { name: '日本登録免許税（0.4%）', amount: fmtM(Math.round(T * 0.4 * 0.004 * 100) / 100) },
        { name: '日本司法书士报酬', amount: fmtM(Math.round((5 + T * 0.4 * 20 * 0.002) / 20 * 100) / 100) },
        { name: '日本继承税（按固定资产评估额）', amount: '应税部分可能远超预期' },
      ],
      totalFeePct: '~1.5–4%',
      procedures: [
        '亲属关系公证',
        '继承权公证',
        '中国房管局过户（不可跳过）',
        '日本法務局相続登記（不可跳过）',
        '全体继承人签署遗产分割协议',
        '各自申请印鑑証明書（日本侧）',
      ],
      heirsPainPoints: [
        '🚫 房产不可分割：一套房子三个继承人 = 三人共有 = 卖要全票通过',
        '🚫 日本不动产过户：全体盖章 + 印鑑証明書，缺一个就死锁',
        '🚫 中国房管局不认日本文书，须海牙认证 → 翻译质证 → 公证 → 登记，链条极长',
        '🚫 继承人得先垫付 2-4% 的税费才能完成过户——"继承得起，办不起"',
        '🚫 跨境房产交易：日本卖房需住民票 + 印鑑証明 + 司法书士 + 买方贷款审批，周期 3-6 个月',
        '🚫 如果继承人之间闹矛盾，房产可能无限期冻结，谁都动不了',
      ],
      pros: [
        '收租金相对简单——租金进银行账户，继承账户即可',
        '不动产长期保值（但变现周期长）',
      ],
      cons: [
        '继承费用最高（1.5-4%）',
        '流动性最差——继承人急需用钱时拿不出来',
        '协调成本极高——每多一个继承人，难度指数级上升',
        '变现周期 6-18 个月以上',
        '中日两地都要走独立的登记程序，没有捷径',
      ],
      recommended: false,
    },
    {
      id: 'mixed',
      icon: '⚖️',
      title: '混合配置（推荐）',
      tagline: '流动性资产保底 + 收租资产保值',
      subline: '现金让继承人有钱办事，房产留着收租。不要把全部鸡蛋放在一个继承人搬不动的篮子里。',
      cnCash: T * 0.3, cnRE: T * 0.3, jpCash: T * 0.2, jpRE: T * 0.2,
      friendlyScore: 7,
      friendlyLabel: '较高。现金部分快速到位，房产部分从容处理，两不耽误',
      difficulty: '中等',
      fees: [
        { name: '现金部分费用（公证+解冻，费率低）', amount: fmtM(Math.round(T * 0.5 * 0.003 * 100) / 100) },
        { name: '房产部分费用（公证+登记+司法书士）', amount: fmtM(Math.round(T * 0.5 * 0.012 * 100) / 100) },
      ],
      totalFeePct: '~0.8–2.5%',
      procedures: [
        '现金：公证 + 银行解冻（数周搞定，继承人先拿到钱）',
        '房产：公证 + 房管局/法務局（数月，但不急——因为现金已经到位了）',
      ],
      heirsPainPoints: [
        '✅ 现金部分先行：继承人用这笔钱支付房产过户的税费，不用自掏腰包',
        '✅ 房产保留收租：不需要强迫所有继承人同意卖房，持续产生现金流',
        '⚠️ 房产部分仍需全体配合签字，但用现金流作为缓冲，大大降低了急售压力',
      ],
      pros: [
        '流动性 + 保值兼顾',
        '现金支付税费，不用继承人垫钱',
        '租金收入持续产生现金流——比卖房划算',
        '可指定不同资产给不同继承人（日本房产给在日子女，中国资产给国内配偶）',
      ],
      cons: [
        '前期需要做资产结构调整',
        '两国资产仍需分别处理',
      ],
      recommended: true,
    },
  ]

  return (
    <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
      <div className="bg-neutral-50 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          🏗 资产结构对比：继承视角下，房产不一定是最好的资产
        </h3>
        <p className="text-xs text-text-muted mt-0.5">
          同样 {T} 万元，三种配置方式，继承人的体验天差地别。从后代角度看，流动性比保值更重要。
        </p>
      </div>

      {/* 继承友好度总览条 */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
          <span>继承友好度评分（1-10）：</span>
        </div>
        <div className="flex items-center gap-3">
          {structures.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 flex-1">
              <span className="text-xs shrink-0">{s.icon}</span>
              <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    s.friendlyScore >= 7 ? 'bg-green-500' : s.friendlyScore >= 4 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${s.friendlyScore * 10}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${
                s.friendlyScore >= 7 ? 'text-green-700' : s.friendlyScore >= 4 ? 'text-amber-700' : 'text-red-700'
              }`}>
                {s.friendlyScore}/10
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 三列对比 */}
      <div className="p-4 grid sm:grid-cols-3 gap-4">
        {structures.map((s) => (
          <div key={s.id} className={`border rounded-xl overflow-hidden ${
            s.recommended ? 'border-neutral-400 ring-1 ring-neutral-200' : 'border-border'
          }`}>
            {/* 头部 */}
            <button onClick={() => setExpanded({ ...expanded, [s.id]: !expanded[s.id] })} className={`w-full text-left px-4 py-3 ${s.recommended ? 'bg-neutral-100' : 'bg-neutral-50'} border-b border-border hover:bg-neutral-100 transition-colors`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{s.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-text-primary">{s.title}</div>
                  <div className="text-[11px] text-text-muted">{s.tagline}</div>
                </div>
                {s.recommended && (
                  <span className="text-[10px] bg-neutral-900 text-white px-1.5 py-0.5 rounded-full">推荐</span>
                )}
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed mt-2 italic">
                {s.subline}
              </p>
              <span className="text-text-muted text-xs ml-2">{expanded[s.id] ? '▲' : '▼'}</span>
            </button>

            {expanded[s.id] && (
            <div className="p-4 space-y-3">
              {/* 继承友好度 */}
              <div className="bg-surface rounded-lg p-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text-muted">继承友好度</span>
                  <span className={`text-lg font-bold ${
                    s.friendlyScore >= 7 ? 'text-green-600' : s.friendlyScore >= 4 ? 'text-amber-600' : 'text-red-600'
                  }`}>{s.friendlyScore}<span className="text-xs font-normal text-text-muted">/10</span></span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">{s.friendlyLabel}</p>
              </div>

              {/* 难度 */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">手续难度</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full ${
                  s.difficulty === '极高' ? 'bg-red-100 text-red-700' :
                  s.difficulty === '低' ? 'bg-green-100 text-green-700' :
                  'bg-amber-100 text-amber-700'
                }`}>{s.difficulty}</span>
              </div>

              {/* 资产拆分 */}
              <div className="bg-surface rounded-lg p-2.5 space-y-1">
                <div className="flex justify-between text-[11px]"><span className="text-text-muted">🇨🇳 中国现金/金融</span><span className="text-text-primary font-medium">{fmtM(s.cnCash)}</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-text-muted">🇨🇳 中国房产</span><span className="text-text-primary font-medium">{fmtM(s.cnRE)}</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-text-muted">🇯🇵 日本现金/金融</span><span className="text-text-primary font-medium">{fmtM(s.jpCash)}</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-text-muted">🇯🇵 日本房产</span><span className="text-text-primary font-medium">{fmtM(s.jpRE)}</span></div>
              </div>

              {/* 预估费率 */}
              <div>
                <p className="text-[11px] text-text-muted mb-1">预估总费率</p>
                <p className="text-sm font-bold text-text-primary">{s.totalFeePct}</p>
              </div>

              {/* 主要费用 */}
              <div>
                <p className="text-[11px] text-text-muted mb-1">主要费用</p>
                <div className="space-y-0.5">
                  {s.fees.map((f, i) => (
                    <div key={i} className="flex justify-between text-[11px] gap-2">
                      <span className="text-text-secondary">{f.name}</span>
                      <span className="font-mono text-text-primary shrink-0 text-right">{f.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ⚠️ 继承人痛点 */}
              <div>
                <p className="text-[11px] font-medium text-red-700 mb-1">⚠️ 继承人的实际处境</p>
                <ul className="space-y-1">
                  {s.heirsPainPoints.map((p, i) => (
                    <li key={i} className="text-[11px] text-text-secondary leading-relaxed flex gap-1">
                      <span className="text-red-400 shrink-0 mt-0.5">•</span> {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 优缺点 */}
              <div className="pt-2 border-t border-border space-y-2">
                <div>
                  <p className="text-[11px] font-medium text-green-700 mb-0.5">✅ 优点</p>
                  {s.pros.map((p, i) => (<p key={i} className="text-[11px] text-text-secondary">✓ {p}</p>))}
                </div>
                <div>
                  <p className="text-[11px] font-medium text-red-700 mb-0.5">❌ 缺点</p>
                  {s.cons.map((c, i) => (<p key={i} className="text-[11px] text-text-secondary">✗ {c}</p>))}
                </div>
              </div>
            </div>
            )}
          </div>
        ))}
      </div>

      {/* 核心结论：收租 vs 卖房 */}
      <div className="border-t border-border">
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {/* 收租 */}
          <div className="p-4">
            <h4 className="text-sm font-semibold text-green-700 mb-2">
              🏠→💰 如果保留房产收租
            </h4>
            <div className="text-xs text-text-secondary leading-relaxed space-y-1.5">
              <p>✅ 继承操作相对简单：变更租金收款账户即可，不需要卖房</p>
              <p>✅ 继承人共有产权、按比例分租金，不需要全体同意出售</p>
              <p>✅ 中日两地租金收入持续产生现金流，长期回报可能超过一次性卖房</p>
              <p>⚠️ 但仍需完成不动产继承登记（过户到继承人名下），这一步绕不开</p>
              <p>⚠️ 日本固定资产税 + 都市计划税每年缴纳，继承人需持续管理</p>
            </div>
            <div className="mt-2 bg-green-50 rounded-lg p-2 text-[11px] text-green-800">
              💡 <strong>策略建议：</strong>遗嘱中明确指定"房产保留收租、不得强制出售"，并指定一名继承人为管理执行人，避免多名继承人争管理权。
            </div>
          </div>

          {/* 卖房 */}
          <div className="p-4">
            <h4 className="text-sm font-semibold text-red-700 mb-2">
              🏠→💸 如果需要出售房产
            </h4>
            <div className="text-xs text-text-secondary leading-relaxed space-y-1.5">
              <p>🚫 全体共有人一致同意才能卖——少一个签字就卖不了</p>
              <p>🚫 日本卖方需：住民票 + 印鑑証明 + 司法书士 + 固定資産評価証明書</p>
              <p>🚫 中国卖方需：房产证 + 身份证 + 婚姻证明 + 完税证明（如满五唯一）</p>
              <p>🚫 跨境远程交易：继承人不在房产所在国 → 需公证委托书 + 领事认证</p>
              <p>🚫 如果继承人有分歧（一个想卖一个不想卖），法院诉讼 1-3 年起步</p>
            </div>
            <div className="mt-2 bg-red-50 rounded-lg p-2 text-[11px] text-red-800">
              ⚠️ <strong>核心结论：</strong>跨境房产交易是继承中最耗时的环节。如果房产占总资产超过 60%，建议被继承人在生前就将部分房产置换为流动性更高的资产，或至少在遗嘱中明确指定房产的处理方式（卖/租/给谁）。
            </div>
          </div>
        </div>
      </div>

      {/* 底部总结 */}
      <div className="border-t border-border px-4 py-3 bg-amber-50/50">
        <p className="text-xs text-text-secondary leading-relaxed">
          💡 <strong>给被继承人的建议：</strong>从继承角度看，房产是被高估的资产。它保值但不保流动——而对继承人来说，<strong>流动性比保值重要得多</strong>。如果你有跨境房产，至少做三件事：(1) 保留 30-40% 的流动资产覆盖继承税费；(2) 遗嘱中明确指定每处房产的处理方式（收租还是出售、给谁）；(3) 日本房产务必指定遗言执行者，绕过全体盖章的死锁。
        </p>
      </div>
    </div>
  )
}
