// ============================================================
// 法定继承模拟计算引擎 v2
// 核心理念：假设被继承人已去世，所有程序费用由各继承人承担
// 输出：每人 → 应得份额 → 要付的费用 → 实际到手
// 所有金额单位：万元人民币（日本侧同时标注万円）
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
  hasWill: boolean
  willType: string
}

export interface HeirCostItem {
  name: string
  amount: number          // 万元 CNY
  rate: string
  country: 'CN' | 'JP'
}

export interface HeirAllocation {
  label: string
  relationship: string
  sharePct: number
  grossAmount: number     // 应得总额（万元）
  costs: HeirCostItem[]   // 该继承人需承担的费用
  totalCost: number       // 费用小计（万元）
  netAmount: number       // 实际到手（万元）
  location: string
  specialNote: string
  riskBadge: 'high' | 'medium' | 'low'
}

export interface CalcResult {
  totalValueCNY: number
  cnAssetValue: number
  jpAssetValue: number
  jpAssetValueJPY: number
  heirs: HeirAllocation[]
  globalFeesTotal: number
  scenarioNote: string
  comparisonNote: string
}

// ---- 费用计算工具 ----

// 中国不动产公证费（分段累进，万元单位）
function cnNotaryFee(cnREVal: number): number {
  if (cnREVal <= 0) return 0
  if (cnREVal <= 20) return cnREVal * 0.012
  if (cnREVal <= 50) return 20 * 0.012 + (cnREVal - 20) * 0.01
  if (cnREVal <= 500) return 20 * 0.012 + 30 * 0.01 + (cnREVal - 50) * 0.008
  return 20 * 0.012 + 30 * 0.01 + 450 * 0.008 + (cnREVal - 500) * 0.005
}

// JP 继承税（万円单位）
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
    if (taxableManYen <= b.limit) {
      tax = Math.max(0, taxableManYen * b.rate - b.deduct)
      break
    }
  }
  // 配偶抵免：最高 1.6 亿 JPY = 16000 万円
  if (isSpouse) tax = Math.max(0, tax - Math.min(tax, 16000))
  return tax
}

// ---- 主计算 ----
export function calculate(input: CalcInput): CalcResult {
  const T = input.totalValueCNY

  // 各类资产价值（万元 CNY）
  const cnRE = T * input.cnRealEstatePct / 100
  const cnFin = T * input.cnFinancialPct / 100
  const cnLev = T * input.cnLeveragePct / 100
  const jpRE = T * input.jpRealEstatePct / 100
  const jpFin = T * input.jpFinancialPct / 100
  const cnTotal = cnRE + cnFin + cnLev
  const jpTotal = jpRE + jpFin
  const jpTotalJPY = jpTotal * 20

  // 法定继承人
  const heirs: HeirAllocation[] = []
  const cnHeirCount = (input.hasSpouse ? 1 : 0) + input.childrenCount + input.parentsAlive

  // 日本继承税基础扣除
  const statutoryHeirs = (input.hasSpouse ? 1 : 0) + input.childrenCount
  const basicDeductionJPY = 3000 + 600 * statutoryHeirs // 万円
  const taxableJPY = Math.max(0, jpTotalJPY - basicDeductionJPY)

  // 中国侧：第一顺序继承人均分（配偶先分50%共同财产）
  function addHeir(label: string, relationship: string, cnSharePct: number, location: string, risk: HeirAllocation['riskBadge'], specialNote: string, isSpouse: boolean) {
    const grossAmount = T * cnSharePct / 100
    const costs: HeirCostItem[] = []

    // 该继承人承担的 CN 不动产费用（按份额比例）
    const heirCNRE = cnRE * cnSharePct / 100
    if (heirCNRE > 0.01) {
      const nFee = cnNotaryFee(heirCNRE)
      if (nFee > 0) costs.push({ name: '不动产继承公证费', amount: Math.round(nFee * 100) / 100, rate: '0.5%–1.2% 分段', country: 'CN' })
      costs.push({ name: '不动产过户登记', amount: 0.055, rate: '¥550/件', country: 'CN' })
      if (heirCNRE > 0) costs.push({ name: '印花税', amount: Math.round(heirCNRE * 0.05) / 100, rate: '0.05%', country: 'CN' })
    }

    // CN 金融资产
    const heirCNFin = cnFin * cnSharePct / 100
    if (heirCNFin > 0.01) {
      costs.push({ name: '继承权公证 + 银行解冻', amount: Math.round(heirCNFin * 0.5) / 100, rate: '~0.5%', country: 'CN' })
    }

    // CN 杠杆
    const heirCNLev = cnLev * cnSharePct / 100
    if (heirCNLev > 0.01) {
      costs.push({ name: '券商应急授权 + 法律咨询', amount: Math.round(heirCNLev * 1) / 100, rate: '~1%', country: 'CN' })
    }

    // JP 不动产
    const heirJPRE = jpRE * cnSharePct / 100
    if (heirJPRE > 0.01) {
      const heirJPRE_JPY = heirJPRE * 20
      costs.push({ name: '登録免許税', amount: Math.round(heirJPRE_JPY * 0.004 / 20 * 100) / 100, rate: '0.4%', country: 'JP' })
      costs.push({ name: '司法书士报酬', amount: Math.round((5 + heirJPRE_JPY * 0.002) / 20 * 100) / 100, rate: '¥5万起 + 0.2%', country: 'JP' })
    }

    // JP 金融
    const heirJPFin = jpFin * cnSharePct / 100
    if (heirJPFin > 0.01) {
      costs.push({ name: '金融口座解冻/名义变更', amount: Math.round(heirJPFin * 0.02) / 100, rate: '~0.02%', country: 'JP' })
    }

    // JP 继承税（按该继承人 JP 资产份额比例）
    if (taxableJPY > 0 && jpTotal > 0) {
      const heirJPTotal = heirJPRE + heirJPFin
      const heirTaxableJPY = taxableJPY * (heirJPTotal / jpTotal)
      const rawTax = jpInheritanceTaxForHeir(heirTaxableJPY, isSpouse)
      costs.push({
        name: '相続税（继承税）',
        amount: Math.round(rawTax / 20 * 100) / 100,
        rate: `应税 ${Math.round(heirTaxableJPY)} 万円`,
        country: 'JP',
      })
    } else if (jpTotal > 0) {
      costs.push({ name: '相続税（继承税）', amount: 0, rate: '未超基础扣除，免缴', country: 'JP' })
    }

    const totalCost = Math.round(costs.reduce((s, c) => s + c.amount, 0) * 100) / 100
    const netAmount = Math.round((grossAmount - totalCost) * 100) / 100

    heirs.push({ label, relationship, sharePct: cnSharePct, grossAmount: Math.round(grossAmount * 100) / 100, costs, totalCost, netAmount, location, specialNote, riskBadge: risk })
  }

  if (cnHeirCount > 0) {
    // 配偶
    if (input.hasSpouse) {
      const residue = Math.round(50 / cnHeirCount * 10) / 10
      addHeir('配偶', '配偶', 50 + residue, input.habitualResidence === 'JP' ? '日本' : '中国', 'low', '先分走夫妻共同财产 50%，再参与剩余 50% 均分', true)
    }
    // 子女
    const childShare = input.hasSpouse ? Math.round(50 / cnHeirCount * 10) / 10 : Math.round(100 / cnHeirCount)
    for (let i = 0; i < input.childrenCount; i++) {
      addHeir(`子女${input.childrenCount > 1 ? i + 1 : ''}`, '子女', childShare, input.habitualResidence === 'JP' ? '日本' : '中国', 'low', input.hasSpouse ? '参与剩余 50% 均分' : '与其他第一顺序继承人均分', false)
    }
    // 父母
    const parentShare = input.hasSpouse ? Math.round(50 / cnHeirCount * 10) / 10 : (input.parentsAlive > 0 ? Math.round(100 / cnHeirCount) : 0)
    for (let i = 0; i < input.parentsAlive; i++) {
      addHeir(i === 0 ? '父亲' : '母亲', '父母', parentShare, '中国大陆', 'medium', '需办理亲属关系公证 + 海牙认证（如本人在境外）', false)
    }
  }

  // 汇总
  const globalFeesTotal = Math.round(heirs.reduce((s, h) => s + h.totalCost, 0) * 100) / 100
  const willLabelMap: Record<string, string> = { none: '无文书', cn_notary: '中国公证遗嘱', jp_notary: '日本公正证书遗嘱', jp_holograph: '日本自笔证书遗嘱', split_wills: '中日分立架构' }
  const resLabel = input.habitualResidence === 'JP' ? '日本' : '中国'
  const willLabel = willLabelMap[input.willType] || '未指定'

  const scenarioNote = `被继承人常住${resLabel}，${input.hasSpouse ? '有配偶' : '无配偶'}，${input.childrenCount} 名子女，${input.parentsAlive} 位父母在世。中国法定第一顺序继承人共 ${cnHeirCount} 人。当前文书：${willLabel}。`

  const totalFeePct = T > 0 ? Math.round(globalFeesTotal / T * 1000) / 10 : 0
  let comparisonNote = ''
  if (!input.hasWill || input.willType === 'none') {
    comparisonNote = `纯法定继承下，${heirs.length} 位继承人合计需承担约 ${globalFeesTotal} 万元费用（占总资产 ${totalFeePct}%）。如提前设立分立架构（中国公证 + 日本公正证书遗嘱同时安排），预估总费用可降至约 ${Math.round(globalFeesTotal * 0.55 * 100) / 100} 万元。`
  } else if (input.willType === 'split_wills') {
    comparisonNote = '已采用最优分立架构，各继承人程序费用已接近最低水平。'
  } else {
    comparisonNote = `当前部分文书安排可减轻部分费用。升级为分立架构后，预估还可节省约 ${Math.round(globalFeesTotal * 0.3 * 100) / 100} 万元。`
  }

  return {
    totalValueCNY: T,
    cnAssetValue: Math.round(cnTotal * 100) / 100,
    jpAssetValue: Math.round(jpTotal * 100) / 100,
    jpAssetValueJPY: Math.round(jpTotalJPY),
    heirs,
    globalFeesTotal,
    scenarioNote,
    comparisonNote,
  }
}
