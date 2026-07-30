// ============================================================
// 法定继承关系树状图 v3
// 被继承人为根节点，配偶/子女/父母为分支，连线展示
// ============================================================

export interface HeirChartData {
  spouse_exists: boolean; children_count: number; children_minor_count: number
  grandchildren_count: number; parents_alive_count: number
  has_missing_heir: boolean; has_incapacity_heir: boolean
  habitual_residence: 'CN' | 'JP' | ''
}

interface Props { data: HeirChartData }

function NodeAvatar({ label, sub, color, badge }: { label: string; sub?: string; color: 'red' | 'amber' | 'green' | 'blue'; badge?: string }) {
  const bg = color === 'red' ? 'bg-red-100 border-red-300 text-red-700' :
             color === 'amber' ? 'bg-amber-100 border-amber-300 text-amber-700' :
             color === 'blue' ? 'bg-blue-100 border-blue-300 text-blue-700' :
             'bg-green-100 border-green-300 text-green-700'
  return (
    <div className="flex flex-col items-center">
      <div className={`w-14 h-14 rounded-full border-2 ${bg} flex items-center justify-center text-lg font-bold shadow-sm relative`}>
        {label[0]}
        {badge && <span className="absolute -top-1 -right-1 text-[10px]">{badge}</span>}
      </div>
      <span className="text-[11px] font-medium text-text-primary mt-1 text-center leading-tight">{label}</span>
      {sub && <span className="text-[10px] text-text-muted">{sub}</span>}
    </div>
  )
}

export function HeirDiagram({ data }: Props) {
  const residenceCN = data.habitual_residence === 'JP' ? '日本' : '中国'

  // 中国侧
  const cnNodes: { label: string; sub: string; color: 'red' | 'amber' | 'green' | 'blue'; badge?: string }[] = []
  if (data.spouse_exists) cnNodes.push({ label: '配偶', sub: '先分50%共同财产', color: 'green' })
  for (let i = 0; i < data.children_count; i++) {
    cnNodes.push({ label: `子女${data.children_count > 1 ? i + 1 : ''}`, sub: data.children_minor_count > i ? '未成年' : '', color: data.children_minor_count > i ? 'amber' : 'green', badge: data.children_minor_count > i ? '🧒' : undefined })
  }
  for (let i = 0; i < data.parents_alive_count; i++) {
    cnNodes.push({ label: i === 0 ? '母亲' : '父亲', sub: '', color: 'green' })
  }
  // 日本侧
  const hasChildren = data.children_count > 0
  const hasParents = data.parents_alive_count > 0
  const jpNodes: { label: string; sub: string; color: 'red' | 'amber' | 'green' | 'blue'; badge?: string }[] = []

  if (data.spouse_exists && hasChildren) {
    jpNodes.push({ label: '配偶', sub: '50%', color: 'green' })
    for (let i = 0; i < data.children_count; i++) {
      jpNodes.push({ label: `子女${data.children_count > 1 ? i + 1 : ''}`, sub: `${Math.round(50 / data.children_count)}%`, color: data.children_minor_count > i ? 'amber' : 'green', badge: data.children_minor_count > i ? '🧒' : undefined })
    }
  } else if (data.spouse_exists && hasParents && !hasChildren) {
    jpNodes.push({ label: '配偶', sub: `${Math.round(200/3)}%`, color: 'green' })
    for (let i = 0; i < data.parents_alive_count; i++) {
      jpNodes.push({ label: i === 0 ? '母亲' : '父亲', sub: `${Math.round(100/3/data.parents_alive_count)}%`, color: 'green' })
    }
  } else if (data.spouse_exists && !hasChildren && !hasParents) {
    jpNodes.push({ label: '配偶', sub: '75%', color: 'green' })
    jpNodes.push({ label: '兄弟姐妹', sub: '25%', color: 'amber' })
  } else if (!data.spouse_exists && hasChildren) {
    for (let i = 0; i < data.children_count; i++) {
      jpNodes.push({ label: `子女${data.children_count > 1 ? i + 1 : ''}`, sub: `${Math.round(100/data.children_count)}%`, color: data.children_minor_count > i ? 'amber' : 'green', badge: data.children_minor_count > i ? '🧒' : undefined })
    }
  } else if (!data.spouse_exists && hasParents && !hasChildren) {
    for (let i = 0; i < data.parents_alive_count; i++) {
      jpNodes.push({ label: i === 0 ? '母亲' : '父亲', sub: `${Math.round(100/data.parents_alive_count)}%`, color: 'green' })
    }
  }

  if (data.has_missing_heir) {
    for (let i = 0; i < jpNodes.length; i++) {
      if (jpNodes[i].label !== '配偶') jpNodes[i] = { ...jpNodes[i], color: 'red', sub: jpNodes[i].sub + ' 失联' }
    }
  }

  const isEmpty = cnNodes.length === 0 && jpNodes.length === 0

  return (
    <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
      <div className="bg-neutral-50 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">📐 法定继承关系图</h3>
        <p className="text-xs text-text-muted mt-0.5">被继承人常住{residenceCN} · 如果不做任何安排，默认就是这样分配</p>
      </div>

      {isEmpty ? (
        <div className="p-8 text-center text-sm text-text-muted">请先在"继承人画像"步骤中填写继承人信息</div>
      ) : (
        <div className="p-5">
          <div className="grid sm:grid-cols-2 gap-6">
            {/* ====== 中国侧 ====== */}
            <TreeColumn
              country="🇨🇳 中国法定继承"
              law="《民法典》第1127条"
              rootLabel="被继承人"
              heirs={cnNodes}
              shareNote={data.spouse_exists ? '配偶先分割共同财产50%，剩余由第一顺序继承人均分' : `${cnNodes.length}位第一顺序继承人均分`}
              color="red"
            />

            {/* ====== 日本侧 ====== */}
            <TreeColumn
              country="🇯🇵 日本法定继承"
              law="民法 第887-890条"
              rootLabel="被相続人"
              heirs={jpNodes}
              shareNote={data.spouse_exists ? '配偶固定为继承人，份额依其他继承人类型变化' : '按法定顺序继承'}
              color="amber"
            />
          </div>

          {/* 图例 */}
          <div className="flex flex-wrap gap-3 text-[11px] text-text-muted mt-4 pt-3 border-t border-border">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-100 border border-green-300" /> 正常</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300" /> 未成年/注意</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-300" /> 失联/死锁风险</span>
            <span className="ml-auto text-text-muted">继承规则差异巨大 · 分立架构可以打破默认分配</span>
          </div>
        </div>
      )}
    </div>
  )
}

function TreeColumn({ country, law, rootLabel, heirs, shareNote, color }: {
  country: string; law: string; rootLabel: string
  heirs: { label: string; sub: string; color: 'red' | 'amber' | 'green' | 'blue'; badge?: string }[]
  shareNote: string; color: 'red' | 'amber'
}) {
  const borderC = color === 'red' ? 'border-red-200' : 'border-amber-200'
  const bgC = color === 'red' ? 'bg-red-50' : 'bg-amber-50'
  const textC = color === 'red' ? 'text-red-deep' : 'text-amber-deep'
  const lineC = color === 'red' ? '#fca5a5' : '#fcd34d'

  return (
    <div className={`border ${borderC} rounded-xl overflow-hidden`}>
      <div className={`${bgC} px-3 py-2 border-b ${borderC} flex items-center justify-between`}>
        <span className={`text-sm font-semibold ${textC}`}>{country}</span>
        <span className="text-[11px] text-text-muted">{law}</span>
      </div>
      <div className="p-4 flex flex-col items-center">
        {/* 根节点 */}
        <NodeAvatar label={rootLabel} color="green" />

        {/* 连接线 */}
        {heirs.length > 0 && (
          <svg width="20" height="24" className="my-0">
            <line x1="10" y1="0" x2="10" y2="24" stroke={lineC} strokeWidth="2" />
          </svg>
        )}

        {/* 分支横线 + 继承人节点 */}
        {heirs.length > 0 && (
          <div className="relative w-full">
            {/* 横线 */}
            <svg width="100%" height="24" className="mb-1">
              <line x1={heirs.length === 1 ? '50%' : '10%'} y1="0" x2={heirs.length === 1 ? '50%' : '90%'} y2="0" stroke={lineC} strokeWidth="2" />
              {heirs.map((_, i) => (
                <line key={i} x1={heirs.length === 1 ? '50%' : `${10 + 80 * i / (heirs.length - 1)}%`} y1="0" x2={heirs.length === 1 ? '50%' : `${10 + 80 * i / (heirs.length - 1)}%`} y2="20" stroke={lineC} strokeWidth="2" />
              ))}
            </svg>
            {/* 节点 */}
            <div className={`flex ${heirs.length === 1 ? 'justify-center' : 'justify-between'} gap-1 flex-wrap`}>
              {heirs.map((h, i) => (
                <NodeAvatar key={i} label={h.label} sub={h.sub} color={h.color} badge={h.badge} />
              ))}
            </div>
          </div>
        )}

        {/* 说明 */}
        <div className={`mt-4 ${bgC} rounded-lg p-2 text-[11px] text-text-secondary text-center leading-relaxed w-full`}>
          {shareNote}
        </div>
      </div>
    </div>
  )
}
