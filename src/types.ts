export type Step = 'pre' | 'identity' | 'assets' | 'heirs' | 'document' | 'report'

// ---- 前置评估 ----
export interface PreAssessmentInput {
  is_accumulation_phase: boolean    // Q1: 仍处于财富积累阶段
  has_retirement_separated: boolean // Q2: 养老资金已隔离
  has_urgent_reason: boolean        // Q3: 有紧迫原因
}

export type PreAssessmentResult = 'STOP' | 'CAUTION' | 'GO'

export function evaluatePreAssessment(input: PreAssessmentInput): PreAssessmentResult {
  if (!input.has_retirement_separated) return 'STOP'    // 养老未隔离 → 暂停
  if (input.has_urgent_reason) return 'GO'              // 紧迫 → 尽快
  if (input.is_accumulation_phase) return 'CAUTION'     // 积累期 → 弹性规划
  return 'GO'                                            // 绿灯
}

// ---- 板块一：身份与居所 ----
export interface IdentityInput {
  habitual_residence: 'CN' | 'JP' | ''
  jp_legal_status: 'VISA' | 'PR' | 'CITIZEN' | ''
  nationality: 'CN' | 'JP' | 'THIRD' | ''
}

// ---- 板块二：资产大类 ----
export interface AssetInput {
  cn_assets: AssetCN[]
  jp_assets: AssetJP[]
}

export type AssetCN = 'cn_re' | 'cn_fin' | 'cn_leverage' | 'cn_digital'
export type AssetJP = 'jp_re' | 'jp_fin' | 'jp_digital'

// ---- 板块三：继承人画像 ----
export interface HeirInput {
  spouse_exists: boolean         // 是否有配偶
  children_count: number         // 子女人数（0-N）
  children_minor_count: number   // 其中未成年子女人数
  grandchildren_count: number    // 指定继承的孙辈人数（非法定，须遗嘱指定）
  parents_alive_count: number    // 在世父母人数（0/1/2）
  heir_locations: HeirLocation[]
  has_missing_heir: boolean
  has_incapacity_heir: boolean
  has_mandatory_share: boolean
}

export type HeirLocation = 'HEIR_CN' | 'HEIR_JP' | 'HEIR_THIRD'

// ---- 板块四：文书与程序 ----
export interface DocumentInput {
  doc_type: 'NONE' | 'JP_HOLOGRAPH' | 'JP_NOTARY' | 'CN_NOTARY' | ''
  has_apostille: boolean
}

// ---- 完整输入 ----
export interface ComplianceInput {
  pre: PreAssessmentInput
  identity: IdentityInput
  assets: AssetInput
  heirs: HeirInput
  document: DocumentInput
}

// ---- 规则引擎输出 ----
export type ReportStatus = 'RED' | 'YELLOW' | 'GREEN'

export interface CostEstimate {
  amount: string
  currency: 'CNY' | 'JPY'
  time: string
}

export interface Blocker {
  code: string
  title: string
  detail: string
}

export interface Warning {
  code: string
  title: string
  detail: string
}

export interface RoadmapItem {
  text: string
  cost?: CostEstimate
  priority: 'critical' | 'procedural' | 'protective' | 'informational'
}

export interface ReportOutput {
  status: ReportStatus
  blockers: Blocker[]
  warnings: Warning[]
  roadmap: RoadmapItem[]
  planningMode: 'urgent' | 'elastic' | 'standard'  // 来自前置评估
}

// ---- 标签映射 ----
export const CN_ASSET_LABELS: Record<AssetCN, string> = {
  cn_re: '不动产（住宅/商业）',
  cn_fin: '金融资产（存款/理财/股票）',
  cn_leverage: '杠杆/配资/融资融券/资管账户',
  cn_digital: '虚拟/数字资产',
}

export const JP_ASSET_LABELS: Record<AssetJP, string> = {
  jp_re: '日本不动产（一户建/公寓/土地）',
  jp_fin: '日本金融资产（银行存款/证券口座）',
  jp_digital: '境外加密货币/冷钱包私钥',
}

export const HEIR_LOCATION_LABELS: Record<HeirLocation, string> = {
  HEIR_CN: '中国大陆',
  HEIR_JP: '日本',
  HEIR_THIRD: '第三国/地区',
}

export const DOC_TYPE_LABELS: Record<string, string> = {
  NONE: '尚无文书，准备走纯法定继承流程',
  JP_HOLOGRAPH: '日本签署的自笔证书遗嘱',
  JP_NOTARY: '日本签署的公正证书遗嘱',
  CN_NOTARY: '中国大陆办理的公证遗嘱',
}
