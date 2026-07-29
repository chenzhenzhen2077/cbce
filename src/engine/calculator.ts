// ============================================================
// 法定继承模拟计算引擎 v3
// ⚠️ 重要：所有税费为参考框架和区间估算，不构成税务意见。
//    实际费用因个案情况、地方政策、汇率波动而异。
//    请咨询持牌税理士/税务师确认具体数字。
//
// 参考数据源（公开法定税率/费率）：
// - 登録免許税 土地1.5% 建筑2%
// - 不動産取得税 约3-4%
// - 固定資産税 约1.4%/年 + 都市計画税 约0.3%/年
// - 相続税 10%-55% 超额累进（基础扣除后）
// - 印紙税 按合同金额分档 ¥200-60,000
// - 中国继承公证费 0.5%-1.2% 分段累进
// 所有金额：万元 CNY（日本侧同时标万円，按 1 CNY ≈ 20 JPY 参考汇率）
// ============================================================

export interface CalcInput {
  totalValueCNY: number
  cnRealEstatePct: number
  cnFinancialPct: number
  cnLeveragePct: number
  jpRealEstatePct: number
  jpFinancialPct: number
  hasSpouse: boolean
  childrenCount: number
  grandchildrenCount: number
  parentsAlive: number
  habitualResidence: 'CN' | 'JP'
  maritalRegime: 'CN_community' | 'JP_separate' // 婚姻财产制度
  hasWill: boolean
  willType: string
}

export interface HeirCostItem {
  name: string
  amount: number
  rate: string
  country: 'CN' | 'JP'
  note?: string // v2: 补充说明
}

export interface HeirAllocation {
  label: string
  relationship: string
  sharePct: number
  grossAmount: number
  costs: HeirCostItem[]
  totalCost: number
  netAmount: number
  location: string
  specialNote: string
  riskBadge: 'high' | 'medium' | 'low'
}

export interface CalcResult {
  totalValueCNY: number
  cnAssetValue: number
  jpAssetValue: number
  jpAssetValueJPY: number
  estateNote: string
  heirs: HeirAllocation[]
  globalFeesTotal: number
  annualCostNote: string
  scenarioNote: string
  comparisonNote: string
  disclaimer: string            // v3: 免责声明
}

// ---- 日本继承税速算（万円单位）----
function jpInheritanceTaxForHeir(taxableManYen: number, isSpouse: boolean): number {
  if (taxableManYen <= 0) return 0
  const brackets = [
    { limit: 1000, rate: 0.10, deduct: 0 },
    { limit: 3000, rate: 0.15, deduct: 50 },
    { limit: 5000, rate: 0.20, deduct: 200 },
    { limit: 10000, rate: 0.30, deduct: 700 },
    { limit: 20000, rate: 0.40, deduct: 1700 },
    { limit: 30000, rate: 0.45, deduct: 2700 },
    { limit: Infinity, rate: 0.55, deduct: 5700 },
  ]
  let tax = 0
  for (const b of brackets) {
    if (taxableManYen <= b.limit) { tax = Math.max(0, taxableManYen * b.rate - b.deduct); break }
  }
  if (isSpouse) tax = Math.max(0, tax - Math.min(tax, 16000))
  return tax
}

// ---- 中国不动产公证费（分段累进）----
function cnNotaryFee(val: number): number {
  if (val <= 0) return 0
  if (val <= 20) return val * 0.012
  if (val <= 50) return 20 * 0.012 + (val - 20) * 0.01
  if (val <= 500) return 20 * 0.012 + 30 * 0.01 + (val - 50) * 0.008
  return 20 * 0.012 + 30 * 0.01 + 450 * 0.008 + (val - 500) * 0.005
}

// ---- 印紙税（按合同金额分档）----
function jpStampDuty(jpyManYen: number): number {
  if (jpyManYen <= 0) return 0
  if (jpyManYen <= 100) return 0.02   // 200 JPY
  if (jpyManYen <= 500) return 0.04   // 400 JPY
  if (jpyManYen <= 1000) return 0.1   // 1,000 JPY
  if (jpyManYen <= 5000) return 0.2   // 2,000 JPY
  return 0.6 // 6,000 JPY
}

// ---- 主计算 ----
export function calculate(input: CalcInput): CalcResult {
  const T = input.totalValueCNY
  const isCNRegime = input.maritalRegime === 'CN_community'

  // 各类资产价值
  const cnRE = T * input.cnRealEstatePct / 100
  const cnFin = T * input.cnFinancialPct / 100
  const cnLev = T * input.cnLeveragePct / 100
  const jpRE = T * input.jpRealEstatePct / 100
  const jpFin = T * input.jpFinancialPct / 100
  const cnTotal = cnRE + cnFin + cnLev
  const jpTotal = jpRE + jpFin
  const jpTotalJPY = jpTotal * 20

  // ---- 婚姻财产制度影响 ----
  // CN共同财产制：配偶先拿50%共同财产，剩余50%才是遗产
  // JP分别财产制：登记在被继承人名下的全部进入遗产，配偶须另行证明贡献
  let estatePct = 100
  let estateNote = ''
  let spousePreShare = 0

  if (input.hasSpouse) {
    if (isCNRegime) {
      spousePreShare = 50 // 配偶先分走50%共同财产（非继承，是财产分割）
      estatePct = 50
      estateNote = `中国共同财产制：配偶先分割夫妻共同财产的 50%（${Math.round(T * 0.5)} 万元），剩余 ${Math.round(T * 0.5)} 万元进入遗产池由继承人分配。`
    } else {
      spousePreShare = 0
      estateNote = `日本分别财产制：登记在被继承人名下的全部资产（${T} 万元）进入遗产池。配偶不能自动取得50%——须另行证明共有贡献才能从遗产中排除个人财产。`
    }
  } else {
    estateNote = '无配偶，全部资产进入遗产池。'
  }

  const totalEstate = T * estatePct / 100

  // 法定继承人
  const heirs: HeirAllocation[] = []
  const cnHeirCount = (input.hasSpouse ? 1 : 0) + input.childrenCount + input.parentsAlive

  // 日本继承税
  const statutoryHeirs = (input.hasSpouse ? 1 : 0) + input.childrenCount
  const basicDeductionJPY = 3000 + 600 * statutoryHeirs
  const jpEstateJPY = jpTotalJPY // 日本侧全部（无配偶预先分割）
  const taxableJPY = Math.max(0, jpEstateJPY - basicDeductionJPY)

  // v2: 年度持有成本
  const jpRE_annualTax = jpRE * 0.017 // 固定資産税 1.4% + 都市計画税 0.3%
  const annualCostNote = jpRE > 0
    ? `⚠️ 日本不动产年度持有成本约 ${Math.round(jpRE_annualTax * 100) / 100} 万元/年（固定資産税 1.4% + 都市計画税 0.3%）。继承人完成登记后需持续承担。`
    : ''

  function addHeir(
    label: string, relationship: string, cnShareOfEstate: number,
    location: string, risk: HeirAllocation['riskBadge'],
    specialNote: string, isSpouse: boolean
  ) {
    const shareOfEstate = cnShareOfEstate / 100
    const grossFromEstate = totalEstate * shareOfEstate
    const grossAmount = input.hasSpouse && isCNRegime && relationship === '配偶'
      ? grossFromEstate + T * spousePreShare / 100 // 配偶 = 遗产份额 + 共同财产50%
      : grossFromEstate
    const costs: HeirCostItem[] = []

    // --- CN 不动产费用 ---
    const heirCNRE = cnRE * shareOfEstate
    if (heirCNRE > 0.01) {
      const nFee = cnNotaryFee(heirCNRE)
      if (nFee > 0) costs.push({ name: '不动产继承公证费', amount: Math.round(nFee * 100) / 100, rate: '0.5%–1.2% 分段累进', country: 'CN' })
      costs.push({ name: '不动产过户登记费', amount: 0.055, rate: '¥550/件', country: 'CN' })
      costs.push({ name: '印花税', amount: Math.round(heirCNRE * 0.05) / 100, rate: '0.05%', country: 'CN' })
    }

    // --- CN 金融 ---
    const heirCNFin = cnFin * shareOfEstate
    if (heirCNFin > 0.01) {
      costs.push({ name: '继承权公证 + 银行解冻', amount: Math.round(heirCNFin * 0.5) / 100, rate: '~0.5%', country: 'CN' })
    }

    // --- CN 杠杆 ---
    const heirCNLev = cnLev * shareOfEstate
    if (heirCNLev > 0.01) {
      costs.push({ name: '券商应急授权 + 法律咨询', amount: Math.round(heirCNLev * 1) / 100, rate: '~1%', country: 'CN' })
    }

    // --- JP 不动产 ---
    const heirJPRE = jpRE * shareOfEstate
    if (heirJPRE > 0.01) {
      const heirJPRE_JPY = heirJPRE * 20
      // v2修正: 登録免許税 土地1.5% / 建筑2.0%，取均值1.75%
      const regTax = heirJPRE_JPY * 0.0175
      costs.push({ name: '登録免許税（改正後）', amount: Math.round(regTax / 20 * 100) / 100, rate: '土地1.5% / 建筑2.0%', country: 'JP' })
      // v2新增: 不動産取得税 3-4%，取3.5%
      const acqTax = heirJPRE_JPY * 0.035
      costs.push({ name: '不動産取得税', amount: Math.round(acqTax / 20 * 100) / 100, rate: '3-4%（继承取得）', country: 'JP', note: '一次性，取得时缴纳' })
      // 司法书士
      costs.push({ name: '司法书士报酬', amount: Math.round((10 + heirJPRE_JPY * 0.002) / 20 * 100) / 100, rate: '¥10万起 + 0.2%', country: 'JP' })
      // v2新增: 印紙税
      const stamp = jpStampDuty(heirJPRE_JPY)
      if (stamp > 0) costs.push({ name: '印紙税（契約書）', amount: Math.round(stamp / 20 * 100) / 100, rate: '按金额分档 ¥200–6,000', country: 'JP' })
      // 年度持有成本提醒
      costs.push({ name: '固定資産税+都市計画税（年）', amount: Math.round(heirJPRE * 0.017 * 100) / 100, rate: '1.4%+0.3%=1.7%/年', country: 'JP', note: '年度持有成本，继承人持续承担' })
    }

    // --- JP 金融 ---
    const heirJPFin = jpFin * shareOfEstate
    if (heirJPFin > 0.01) {
      costs.push({ name: '金融口座解冻/名义变更', amount: Math.round(heirJPFin * 0.002 * 100) / 100, rate: '~0.02%', country: 'JP' })
    }

    // --- JP 继承税 ---
    if (taxableJPY > 0 && jpTotal > 0) {
      const heirJPTotal = heirJPRE + heirJPFin
      const heirTaxableJPY = taxableJPY * (heirJPTotal / jpTotal)
      const rawTax = jpInheritanceTaxForHeir(heirTaxableJPY, isSpouse)
      costs.push({
        name: '相続税（继承税）',
        amount: Math.round(rawTax / 20 * 100) / 100,
        rate: `应税 ${Math.round(heirTaxableJPY)} 万円 · 10-55%累进`,
        country: 'JP',
      })
    } else if (jpTotal > 0) {
      costs.push({ name: '相続税（继承税）', amount: 0, rate: '未超基础扣除，免缴', country: 'JP' })
    }

    const totalCost = Math.round(costs.reduce((s, c) => s + c.amount, 0) * 100) / 100
    const netAmount = Math.round((grossAmount - totalCost) * 100) / 100

    heirs.push({ label, relationship, sharePct: cnShareOfEstate, grossAmount: Math.round(grossAmount * 100) / 100, costs, totalCost, netAmount, location, specialNote, riskBadge: risk })
  }

  // ---- 构建继承人 ----
  if (cnHeirCount > 0) {
    if (input.hasSpouse) {
      const residue = Math.round(50 / cnHeirCount * 10) / 10
      const note = isCNRegime
        ? `先分走夫妻共同财产50%（${Math.round(T * 0.5)}万），再参与剩余遗产均分`
        : '日本分别财产制下无自动50%分割，配偶份额来自遗产继承'
      addHeir('配偶', '配偶', 50 + residue, input.habitualResidence === 'JP' ? '日本' : '中国', 'low', note, true)
    }
    const childShare = input.hasSpouse ? Math.round(50 / cnHeirCount * 10) / 10 : Math.round(100 / cnHeirCount)
    for (let i = 0; i < input.childrenCount; i++) {
      addHeir(`子女${input.childrenCount > 1 ? i + 1 : ''}`, '子女', childShare, input.habitualResidence === 'JP' ? '日本' : '中国', 'low', input.hasSpouse ? '参与剩余遗产均分' : '与其他第一顺序继承人均分', false)
    }
    const parentShare = input.hasSpouse ? Math.round(50 / cnHeirCount * 10) / 10 : (input.parentsAlive > 0 ? Math.round(100 / cnHeirCount) : 0)
    for (let i = 0; i < input.parentsAlive; i++) {
      addHeir(i === 0 ? '母亲' : '父亲', '父母', parentShare, '中国大陆', 'medium', '需亲属关系公证 + 海牙认证（如本人在境外）', false)
    }
  }

  const globalFeesTotal = Math.round(heirs.reduce((s, h) => s + h.totalCost, 0) * 100) / 100

  const willLabelMap: Record<string, string> = { none: '无文书', cn_notary: '中国公证遗嘱', jp_notary: '日本公正证书遗嘱', jp_holograph: '日本自笔证书遗嘱', split_wills: '中日分立架构' }
  const resLabel = input.habitualResidence === 'JP' ? '日本' : '中国'
  const willLabel = willLabelMap[input.willType] || '未指定'

  const scenarioNote = `被继承人常住${resLabel}，适用${isCNRegime ? '中国共同财产制' : '日本分别财产制'}。${input.hasSpouse ? '有配偶' : '无配偶'}，${input.childrenCount} 名子女，${input.parentsAlive} 位父母在世。遗产池 ${Math.round(totalEstate)} 万元。文书：${willLabel}。`

  const totalFeePct = T > 0 ? Math.round(globalFeesTotal / T * 1000) / 10 : 0
  let comparisonNote = ''
  if (!input.hasWill || input.willType === 'none') {
    comparisonNote = `纯法定继承预估总费用 ${globalFeesTotal} 万元（${totalFeePct}%）。如提前设立分立架构，预估可降至约 ${Math.round(globalFeesTotal * 0.55 * 100) / 100} 万元。`
  } else if (input.willType === 'split_wills') {
    comparisonNote = '已采用最优分立架构，费用接近最低水平。'
  } else {
    comparisonNote = `当前部分文书安排可减轻费用。升级分立架构预估还可节省约 ${Math.round(globalFeesTotal * 0.3 * 100) / 100} 万元。`
  }

  return {
    totalValueCNY: T,
    cnAssetValue: Math.round(cnTotal * 100) / 100,
    jpAssetValue: Math.round(jpTotal * 100) / 100,
    jpAssetValueJPY: Math.round(jpTotalJPY),
    estateNote,
    heirs,
    globalFeesTotal,
    annualCostNote,
    scenarioNote,
    comparisonNote,
    disclaimer: '⚠️ 以上所有费用和税费均为基于公开法定税率/费率的参考估算框架，不构成税务意见。实际金额因个案情况、资产评估方式、地方政策差异和汇率波动而异。请务必咨询持牌税理士/税务师确认具体数字。',
  }
}
