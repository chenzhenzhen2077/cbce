// ============================================================
// 中日双轨法定继承人关系图
// 左侧：中国法定继承 | 右侧：日本法定继承
// ============================================================

export interface HeirChartData {
  spouse_exists: boolean
  children_count: number
  children_minor_count: number
  grandchildren_count: number
  parents_alive_count: number
  has_missing_heir: boolean
  has_incapacity_heir: boolean
  habitual_residence: 'CN' | 'JP' | ''
}

interface Props {
  data: HeirChartData
  totalValueLabel: string
}

type Badge = 'minor' | 'missing' | 'incapacity' | 'mandatory' | 'ok'

function badgeStyle(b: Badge): string {
  switch (b) {
    case 'minor': return 'bg-amber-100 text-amber-700 border-amber-300'
    case 'missing': return 'bg-red-100 text-red-700 border-red-300'
    case 'incapacity': return 'bg-red-100 text-red-700 border-red-300'
    case 'mandatory': return 'bg-amber-100 text-amber-700 border-amber-300'
    case 'ok': return 'bg-green-100 text-green-700 border-green-300'
  }
}

function badgeLabel(b: Badge): string {
  switch (b) {
    case 'minor': return '未成年'
    case 'missing': return '失联'
    case 'incapacity': return '限行'
    case 'mandatory': return '必留份'
    case 'ok': return '正常'
  }
}

export function HeirDiagram({ data, totalValueLabel }: Props) {
  // ---- 中国侧计算 ----
  const cnFirstOrder: { label: string; badge: Badge }[] = []
  if (data.spouse_exists) cnFirstOrder.push({ label: '配偶', badge: 'ok' })
  for (let i = 0; i < data.children_count; i++) {
    const isMinor = i < data.children_minor_count
    cnFirstOrder.push({ label: `子女${data.children_count > 1 ? i + 1 : ''}`, badge: isMinor ? 'minor' : 'ok' })
  }
  for (let i = 0; i < data.parents_alive_count; i++) {
    cnFirstOrder.push({ label: i === 0 ? '母亲' : '父亲', badge: 'ok' })
  }
  const cnTotalHeirs = cnFirstOrder.length
  const cnSharePct = cnTotalHeirs > 0 ? Math.round(100 / cnTotalHeirs) : 0

  // 配偶先分一半的特殊说明
  const spouseNote = data.spouse_exists
    ? `配偶先从夫妻共同财产中分走 50%（不属于继承），剩余 50% 由 ${cnTotalHeirs} 位第一顺序继承人均分`
    : `${cnTotalHeirs} 位第一顺序继承人均分`

  // ---- 日本侧计算 ----
  const hasChildren = data.children_count > 0
  const hasParents = data.parents_alive_count > 0

  let jpHeirOrder: string
  let jpHeirs: { label: string; sharePct: number; badge: Badge }[] = []

  if (data.spouse_exists && hasChildren) {
    jpHeirOrder = '配偶 + 子女'
    jpHeirs.push({ label: '配偶', sharePct: 50, badge: 'ok' })
    for (let i = 0; i < data.children_count; i++) {
      const isMinor = i < data.children_minor_count
      jpHeirs.push({ label: `子女${data.children_count > 1 ? i + 1 : ''}`, sharePct: Math.round(50 / data.children_count), badge: isMinor ? 'minor' : 'ok' })
    }
  } else if (data.spouse_exists && hasParents && !hasChildren) {
    jpHeirOrder = '配偶 + 直系尊属（父母）'
    jpHeirs.push({ label: '配偶', sharePct: Math.round(2 * 100 / 3), badge: 'ok' })
    for (let i = 0; i < data.parents_alive_count; i++) {
      jpHeirs.push({ label: i === 0 ? '母亲' : '父亲', sharePct: Math.round(100 / 3 / data.parents_alive_count), badge: 'ok' })
    }
  } else if (data.spouse_exists && !hasChildren && !hasParents) {
    jpHeirOrder = '配偶 + 兄弟姐妹（第三顺序）'
    jpHeirs.push({ label: '配偶', sharePct: 75, badge: 'ok' })
    jpHeirs.push({ label: '兄弟姐妹', sharePct: 25, badge: 'ok' })
  } else if (!data.spouse_exists && hasChildren) {
    jpHeirOrder = '子女（无配偶）'
    for (let i = 0; i < data.children_count; i++) {
      const isMinor = i < data.children_minor_count
      jpHeirs.push({ label: `子女${data.children_count > 1 ? i + 1 : ''}`, sharePct: Math.round(100 / data.children_count), badge: isMinor ? 'minor' : 'ok' })
    }
  } else if (!data.spouse_exists && hasParents && !hasChildren) {
    jpHeirOrder = '直系尊属（父母）'
    for (let i = 0; i < data.parents_alive_count; i++) {
      jpHeirs.push({ label: i === 0 ? '母亲' : '父亲', sharePct: Math.round(100 / data.parents_alive_count), badge: 'ok' })
    }
  } else {
    jpHeirOrder = '无法定继承人信息'
  }

  // 失联标记
  if (data.has_missing_heir) {
    jpHeirs = jpHeirs.map((h) => (h.label !== '配偶' ? { ...h, badge: 'missing' as Badge } : h))
  }

  const isEmpty = cnFirstOrder.length === 0 && jpHeirs.length === 0

  return (
    <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
      <div className="bg-neutral-50 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          📐 法定继承人关系与分配图
        </h3>
        <p className="text-xs text-text-muted mt-0.5">
          被继承人常住{data.habitual_residence === 'JP' ? '日本' : '中国'} · {totalValueLabel}
        </p>
      </div>

      {isEmpty ? (
        <div className="p-8 text-center text-sm text-text-muted">
          请先在"继承人画像"步骤中填写继承人数量和分布信息
        </div>
      ) : (
        <div className="p-5">
          <div className="grid sm:grid-cols-2 gap-5">
            {/* ====== 中国侧 ====== */}
            <div className="border border-red-200 rounded-xl overflow-hidden">
              <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                <span className="text-sm font-semibold text-red-deep">🇨🇳 中国法定继承</span>
                <span className="text-xs text-red-600 ml-2">《民法典》第1127条</span>
              </div>
              <div className="p-4">
                {/* 被继承人节点 */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-800 text-white flex flex-col items-center justify-center text-xs">
                    <span>被继承人</span>
                    <span className="font-bold">{totalValueLabel}</span>
                  </div>
                </div>
                {/* 向下箭头 */}
                <div className="flex justify-center mb-3">
                  <svg width="2" height="20"><line x1="1" y1="0" x2="1" y2="20" stroke="#d1d5db" strokeWidth="2"/></svg>
                </div>
                {/* 第一顺序继承人 */}
                <div className="text-center mb-2">
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">第一顺序</span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {cnFirstOrder.map((h, i) => (
                    <HeirBadge key={i} label={h.label} sharePct={cnSharePct} badge={h.badge} side="cn" />
                  ))}
                </div>
                {/* 孙辈（非法定） */}
                {data.grandchildren_count > 0 && (
                  <div className="mt-3 pt-3 border-t border-dashed border-red-200">
                    <div className="text-center mb-2">
                      <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">非法定 · 须遗嘱指定</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {Array.from({ length: data.grandchildren_count }).map((_, i) => (
                        <HeirBadge key={i} label={`孙辈${data.grandchildren_count > 1 ? i + 1 : ''}`} sharePct={0} badge={'ok'} side="cn" />
                      ))}
                    </div>
                    <p className="text-[11px] text-blue-700 text-center mt-2">
                      💡 孙辈非法定继承人。须通过遗嘱/遗赠明确指定，建议设立信托或附条件遗赠（如年满25岁方可取得）。
                    </p>
                  </div>
                )}

                {/* 说明 */}
                <div className="mt-4 bg-red-50/50 rounded-lg p-3 text-xs text-text-secondary leading-relaxed">
                  {spouseNote}
                  {data.children_minor_count > 0 && (
                    <p className="mt-1 text-amber-700">
                      ⚠️ {data.children_minor_count} 名未成年继承人需法定监护人代为行使继承权。监护人须经法院/公证处确认。
                    </p>
                  )}
                  {data.has_missing_heir && (
                    <p className="mt-1 text-red-700">
                      🚫 失联继承人导致继承权公证无法完成全部签字，需法院公告或另行诉讼。
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ====== 日本侧 ====== */}
            <div className="border border-amber-200 rounded-xl overflow-hidden">
              <div className="bg-amber-50 px-4 py-2 border-b border-amber-200">
                <span className="text-sm font-semibold text-amber-deep">🇯🇵 日本法定继承</span>
                <span className="text-xs text-amber-600 ml-2">民法 第887-890条</span>
              </div>
              <div className="p-4">
                {/* 被继承人节点 */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-800 text-white flex flex-col items-center justify-center text-xs">
                    <span>被相続人</span>
                    <span className="font-bold">{totalValueLabel}</span>
                  </div>
                </div>
                <div className="flex justify-center mb-3">
                  <svg width="2" height="20"><line x1="1" y1="0" x2="1" y2="20" stroke="#d1d5db" strokeWidth="2"/></svg>
                </div>
                {/* 继承人顺序 */}
                <div className="text-center mb-2">
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{jpHeirOrder}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {jpHeirs.map((h, i) => (
                    <HeirBadge key={i} label={h.label} sharePct={h.sharePct} badge={h.badge} side="jp" />
                  ))}
                </div>
                {/* 说明 */}
                <div className="mt-4 bg-amber-50/50 rounded-lg p-3 text-xs text-text-secondary leading-relaxed">
                  {data.spouse_exists && (
                    <p>配偶固定为继承人，份额依其他继承人类型变化。配偶享有最高 1.6 亿日元的继承税抵免。</p>
                  )}
                  {data.children_count === 0 && data.parents_alive_count > 0 && (
                    <p>无子女时，父母（直系尊属）进入第一继承顺序。</p>
                  )}
                  {data.children_minor_count > 0 && (
                    <p className="mt-1 text-amber-700">
                      ⚠️ 未成年人继承需日本家庭裁判所选任「特別代理人」，额外耗时 2-4 个月，费用 ¥5-15 万 JPY。
                    </p>
                  )}
                  {data.has_missing_heir && (
                    <p className="mt-1 text-red-700">
                      🚫 日本不动产过户需<b>全体继承人盖章 + 印鑑証明書</b>。失联继承人导致遗产分割协议书无法签署，不动产死锁。
                    </p>
                  )}
                  {!data.has_missing_heir && !data.has_incapacity_heir && data.children_count > 0 && data.children_minor_count === 0 && (
                    <p className="mt-1 text-green-700">
                      ✅ 成年子女可独立签署遗产分割协议书，流程相对顺畅。
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 底部汇总 */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat label="中国侧继承人" value={`${cnFirstOrder.length} 人`} />
            <MiniStat label="日本侧继承人" value={`${jpHeirs.length} 人`} />
            <MiniStat label="中国侧每人份额" value={`${cnSharePct}%`} />
            <MiniStat label="日本继承税起征" value={data.spouse_exists && data.children_count > 0 ? `3,000万+600万×${1 + data.children_count}` : '3,000万 JPY'} />
          </div>
        </div>
      )}

      {/* 图例 */}
      <div className="border-t border-border px-4 py-2 flex flex-wrap gap-3 text-[11px] text-text-muted">
        {(['minor', 'missing', 'incapacity', 'mandatory', 'ok'] as Badge[]).map((b) => (
          <span key={b} className="flex items-center gap-1">
            <span className={`inline-block w-2.5 h-2.5 rounded-full border ${badgeStyle(b).split(' ')[0]} ${badgeStyle(b).split(' ')[1]}`} />
            {badgeLabel(b)}
          </span>
        ))}
        <span className="ml-auto">中日继承规则差异巨大，需分立架构应对</span>
      </div>
    </div>
  )
}

function HeirBadge({ label, sharePct, badge, side }: { label: string; sharePct: number; badge: Badge; side: 'cn' | 'jp' }) {
  const bCls = badgeStyle(badge)
  return (
    <div className={`relative border rounded-lg px-3 py-2 text-center min-w-[80px] ${bCls} ${side === 'cn' ? 'border-red-200' : 'border-amber-200'}`}>
      <div className="text-xs font-medium text-text-primary">{label}</div>
      <div className="text-lg font-bold text-text-primary">{sharePct}%</div>
      {badge !== 'ok' && (
        <span className={`text-[10px] px-1 py-0.5 rounded-full ${badgeStyle(badge)} mt-0.5 inline-block`}>
          {badgeLabel(badge)}
        </span>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3 text-center">
      <div className="text-[11px] text-text-muted">{label}</div>
      <div className="text-sm font-semibold text-text-primary mt-0.5">{value}</div>
    </div>
  )
}
