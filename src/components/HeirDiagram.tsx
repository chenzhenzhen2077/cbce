// ============================================================
// 中日双轨法定继承人关系图 v2
// 以示例人物 + 故事化讲解替代抽象图表
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
  totalValueLabel?: string
}

type Badge = 'minor' | 'missing' | 'incapacity' | 'mandatory' | 'ok'

function badgeEmoji(b: Badge): string {
  switch (b) {
    case 'minor': return '🧒'
    case 'missing': return '❓'
    case 'incapacity': return '🏥'
    case 'mandatory': return '⚖️'
    case 'ok': return ''
  }
}

export function HeirDiagram({ data }: Props) {
  // ---- 构建示例人物 ----
  const residenceCN = data.habitual_residence === 'JP' ? '日本' : '中国'

  // 中国侧
  const cnFirstOrder: { label: string; badge: Badge }[] = []
  if (data.spouse_exists) cnFirstOrder.push({ label: '配偶', badge: 'ok' })
  for (let i = 0; i < data.children_count; i++) {
    cnFirstOrder.push({ label: `子女${data.children_count > 1 ? i + 1 : ''}`, badge: i < data.children_minor_count ? 'minor' : 'ok' })
  }
  for (let i = 0; i < data.parents_alive_count; i++) {
    cnFirstOrder.push({ label: i === 0 ? '母亲' : '父亲', badge: 'ok' })
  }
  const cnHeirCount = cnFirstOrder.length
  const cnShare = cnHeirCount > 0 ? Math.round(100 / cnHeirCount) : 0

  // 日本侧
  const hasChildren = data.children_count > 0
  const hasParents = data.parents_alive_count > 0
  let jpOrderLabel = ''
  let jpHeirs: { label: string; sharePct: number; badge: Badge }[] = []

  if (data.spouse_exists && hasChildren) {
    jpOrderLabel = '配偶 + 子女'
    jpHeirs.push({ label: '配偶', sharePct: 50, badge: 'ok' })
    for (let i = 0; i < data.children_count; i++) {
      jpHeirs.push({ label: `子女${data.children_count > 1 ? i + 1 : ''}`, sharePct: Math.round(50 / data.children_count), badge: i < data.children_minor_count ? 'minor' : 'ok' })
    }
  } else if (data.spouse_exists && hasParents && !hasChildren) {
    jpOrderLabel = '配偶 + 父母'
    jpHeirs.push({ label: '配偶', sharePct: Math.round(200 / 3), badge: 'ok' })
    for (let i = 0; i < data.parents_alive_count; i++) {
      jpHeirs.push({ label: i === 0 ? '母亲' : '父亲', sharePct: Math.round(100 / 3 / data.parents_alive_count), badge: 'ok' })
    }
  } else if (data.spouse_exists && !hasChildren && !hasParents) {
    jpOrderLabel = '配偶 + 兄弟姐妹'
    jpHeirs.push({ label: '配偶', sharePct: 75, badge: 'ok' })
    jpHeirs.push({ label: '兄弟姐妹', sharePct: 25, badge: 'ok' })
  } else if (!data.spouse_exists && hasChildren) {
    jpOrderLabel = '子女'
    for (let i = 0; i < data.children_count; i++) {
      jpHeirs.push({ label: `子女${data.children_count > 1 ? i + 1 : ''}`, sharePct: Math.round(100 / data.children_count), badge: i < data.children_minor_count ? 'minor' : 'ok' })
    }
  } else if (!data.spouse_exists && hasParents && !hasChildren) {
    jpOrderLabel = '父母'
    for (let i = 0; i < data.parents_alive_count; i++) {
      jpHeirs.push({ label: i === 0 ? '母亲' : '父亲', sharePct: Math.round(100 / data.parents_alive_count), badge: 'ok' })
    }
  } else {
    jpOrderLabel = '待定'
  }

  // 失联扩散到非配偶
  if (data.has_missing_heir) {
    jpHeirs = jpHeirs.map((h) => (h.label !== '配偶' ? { ...h, badge: 'missing' as Badge } : h))
  }

  const isEmpty = cnFirstOrder.length === 0 && jpHeirs.length === 0

  // ---- 核心洞察 ----
  const cnResult = data.spouse_exists
    ? `配偶先从夫妻共同财产中分走 50%（这不是继承，是财产分割），剩余 50% 由 ${cnHeirCount} 位第一顺序继承人每人分得约 ${cnShare}%。`
    : `${cnHeirCount} 位第一顺序继承人每人分得 ${cnShare}%。`

  const jpKeyDiff = data.spouse_exists && data.children_count > 0
    ? `配偶固定拿 50%，${data.children_count} 名子女平分剩余 50%。注意：日本是分别财产制——登记在被继承人名下的全部进入遗产池，配偶不能像中国那样先分走一半。`
    : '日本法下配偶份额随其他继承人类型变化——与子女各半、与父母拿三分之二、与兄弟姐妹拿四分之三。'

  const criticalWarning = data.spouse_exists && data.habitual_residence === 'JP'
    ? '⚠️ 住在日本的家庭最容易被这个差异坑到：以为像中国一样配偶自动拿一半，实际上日本法下配偶只能通过继承取得份额，且需全体继承人配合才能完成不动产过户。'
    : ''

  return (
    <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
      <div className="bg-neutral-50 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          📐 如果不做任何安排，资产会怎么分？
        </h3>
        <p className="text-xs text-text-muted mt-0.5">
          以下是根据你在问卷中填写的信息，模拟法定继承的默认结果
        </p>
      </div>

      {isEmpty ? (
        <div className="p-8 text-center text-sm text-text-muted">
          请先在"继承人画像"步骤中填写继承人数量和分布信息
        </div>
      ) : (
        <div className="p-5 space-y-5">
          {/* === 第1步：看清谁有份 === */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center font-bold">1</span>
              <h4 className="text-sm font-semibold text-text-primary">谁有资格继承？（法定继承人清单）</h4>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              被继承人常住{residenceCN}。在不做任何文书安排的情况下，以下人员依法享有继承权。
            </p>

            {/* 双列继承人清单 */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* 中国侧 */}
              <div className="border border-red-200 rounded-xl overflow-hidden">
                <div className="bg-red-50 px-3 py-2 border-b border-red-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-red-deep">🇨🇳 中国法律</span>
                  <span className="text-[11px] text-red-500">《民法典》第1127条</span>
                </div>
                <div className="p-3">
                  <p className="text-xs text-text-muted mb-2">
                    第一顺序继承人均分{data.spouse_exists ? '（配偶先从共同财产中分走一半）' : ''}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {cnFirstOrder.map((h, i) => (
                      <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                        h.badge === 'minor' ? 'bg-amber-50 border-amber-300 text-amber-700' :
                        h.badge === 'missing' ? 'bg-red-50 border-red-300 text-red-700' :
                        'bg-white border-border text-text-primary'
                      }`}>
                        {badgeEmoji(h.badge)}{h.label} {cnShare}%
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-text-muted mt-2 leading-relaxed">{cnResult}</p>
                </div>
              </div>

              {/* 日本侧 */}
              <div className="border border-amber-200 rounded-xl overflow-hidden">
                <div className="bg-amber-50 px-3 py-2 border-b border-amber-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-amber-deep">🇯🇵 日本法律</span>
                  <span className="text-[11px] text-amber-600">民法 第887-890条</span>
                </div>
                <div className="p-3">
                  <p className="text-xs text-text-muted mb-2">
                    继承顺序：{jpOrderLabel}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {jpHeirs.map((h, i) => (
                      <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                        h.badge === 'minor' ? 'bg-amber-50 border-amber-300 text-amber-700' :
                        h.badge === 'missing' ? 'bg-red-50 border-red-300 text-red-700' :
                        'bg-white border-border text-text-primary'
                      }`}>
                        {badgeEmoji(h.badge)}{h.label} {h.sharePct}%
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-text-muted mt-2 leading-relaxed">{jpKeyDiff}</p>
                </div>
              </div>
            </div>

            {/* 关键差异提示 */}
            {data.spouse_exists && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>🔍 关键发现：</strong>
                  中国法下配偶先拿回自己的 50% 共同财产再参与继承；日本法下配偶没有这个权利——登记在被继承人名下的全部进入遗产池。
                  {data.habitual_residence === 'JP' && ' 你常住日本，这个差异对你影响最大。'}
                </p>
              </div>
            )}
          </div>

          {/* === 第2步：两国规则打架的后果 === */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center font-bold">2</span>
              <h4 className="text-sm font-semibold text-text-primary">两国规则不一样，会出什么问题？</h4>
            </div>

            <div className="space-y-3">
              {/* 问题1 */}
              <div className="border border-red-200 rounded-lg p-3 bg-red-50/50">
                <p className="text-xs font-medium text-red-800 mb-1">
                  🚫 问题一：继承权"各说各话"
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {data.habitual_residence === 'JP'
                    ? '你常住日本，名下可能有中国房产。中国法律规定不动产继承适用中国法——但中国房管局不认日本出具的继承权证明。你需要先在日本取得继承相关文书，再经过海牙认证+翻译质证，才能在中国办手续。反过来也一样。'
                    : '如果你在日本有房产，日本法務局不认中国公证处出具的继承权公证书。你需要在中国办完公证后，再走日本外务省的认证流程。'}
                </p>
              </div>

              {/* 问题2 */}
              {data.has_missing_heir && (
                <div className="border border-red-200 rounded-lg p-3 bg-red-50/50">
                  <p className="text-xs font-medium text-red-800 mb-1">
                    🚫 问题二：继承人失联 = 绝对死锁
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    日本不动产过户需要全体继承人在《遗产分割协议书》上盖章并附印鑑証明書。有继承人失联或拒绝配合的情况下，该不动产在法律上无法过户，只能通过法院诉讼解决——耗时 1-3 年，费用数十万日元起。
                  </p>
                </div>
              )}

              {/* 问题3 */}
              {data.children_minor_count > 0 && (
                <div className="border border-amber-200 rounded-lg p-3 bg-amber-50/50">
                  <p className="text-xs font-medium text-amber-800 mb-1">
                    ⚠️ 问题三：未成年继承人需要特别代理人
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    你有 {data.children_minor_count} 名未成年继承人。在日本法下，未成年人不能独立签署遗产分割协议，需要向家庭裁判所申请选任"特別代理人"。这个程序独立于主继承流程，额外耗时 2-4 个月，费用 5-15 万日元。
                  </p>
                </div>
              )}

              {/* 问题4 */}
              {data.grandchildren_count > 0 && (
                <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                  <p className="text-xs font-medium text-blue-800 mb-1">
                    💡 问题四：孙辈不在法定继承序列中
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    你想把资产留给 {data.grandchildren_count} 名孙辈，但中日两国的法定继承都不包含孙辈（除非其父母先于被继承人去世，触发代位继承）。要实现隔代传承，<strong>必须有明确的遗嘱或遗赠文书</strong>，口头意愿没有法律效力。
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* === 第3步：你可以做什么 === */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center font-bold">3</span>
              <h4 className="text-sm font-semibold text-text-primary">提前规划可以避免哪些麻烦？</h4>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="border border-green-200 rounded-lg p-3 bg-green-50/50">
                <p className="text-xs font-medium text-green-800 mb-1">✅ 如果提前立好公证遗嘱</p>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>· 中国资产用中国公证遗嘱，国内程序无需海牙认证</li>
                  <li>· 日本资产用日本公正证书遗嘱，指定"遗言执行者"</li>
                  <li>· 绕过全体继承人盖章签字的死锁</li>
                  <li>· 孙辈继承：通过遗赠明确指定，避免法定继承的"默认分配"</li>
                </ul>
              </div>
              <div className="border border-red-200 rounded-lg p-3 bg-red-50/50">
                <p className="text-xs font-medium text-red-800 mb-1">❌ 如果什么都不做</p>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>· 继承人需要在中日两地各自办理全套公证+认证</li>
                  <li>· 日本不动产：全体签字盖章，缺一不可</li>
                  <li>· 一旦有继承人失联或分歧，资产冻结 1-3 年</li>
                  <li>· 孙辈在法律上拿不到一分钱</li>
                </ul>
              </div>
            </div>

            {criticalWarning && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-800 leading-relaxed">{criticalWarning}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 图例 */}
      {!isEmpty && (
        <div className="border-t border-border px-4 py-2 flex flex-wrap gap-3 text-[11px] text-text-muted">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-100 border border-amber-300" /> 未成年人</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-300" /> 失联/不配合</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-300" /> 非法定（需遗嘱）</span>
          <span className="ml-auto">提前规划的核心不是"分给谁"——是"让分的过程不卡住"</span>
        </div>
      )}
    </div>
  )
}
