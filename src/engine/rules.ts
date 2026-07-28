import type { ComplianceInput, ReportOutput } from '../types'
import { evaluatePreAssessment } from '../types'

export function runComplianceRules(input: ComplianceInput): ReportOutput {
  const preResult = evaluatePreAssessment(input.pre)

  const report: ReportOutput = {
    status: 'GREEN',
    blockers: [],
    warnings: [],
    roadmap: [],
    planningMode:
      preResult === 'GO'
        ? input.pre.has_urgent_reason
          ? 'urgent'
          : 'standard'
        : 'elastic',
  }

  const { identity, assets, heirs, document } = input

  // ---- Rule 1: 日本不动产 + 继承人失联 (致命死锁) ----
  if (assets.jp_assets.includes('jp_re') && heirs.has_missing_heir) {
    report.status = 'RED'
    report.blockers.push({
      code: 'ERR_JP_RE_DEADLOCK',
      title: '日本不动产登记绝对死锁',
      detail:
        '日本地方法务局在办理资产继承过户时，极度依赖全体继承人盖章并附带印章证明书（印鑑証明書）的《遗产分割协议书》。若存在继承人失联或拒绝配合，该不动产将无法变现或过户。',
    })
    report.roadmap.push({
      text: '【日本方案】放弃全球单一传承方案，建议在日本当地由公证人设立"公正证书遗嘱"并指定专业的"遗言执行者"，依法绕过所有继承人的二次签字盖章。',
      cost: { amount: '¥30,000-80,000', currency: 'JPY', time: '1-2 周' },
      priority: 'critical',
    })
  }

  // ---- Rule 2: 日本自笔遗嘱 + 中国房产 (形式要件阻断) ----
  if (
    document.doc_type === 'JP_HOLOGRAPH' &&
    assets.cn_assets.includes('cn_re')
  ) {
    if (!document.has_apostille) {
      report.status = 'RED'
      report.blockers.push({
        code: 'ERR_CN_RE_NOTARY_REJECT',
        title: '日本自笔证书遗嘱在中国内地无法直接办理房产过户',
        detail:
          '拟用日本签署的手写自笔证书遗嘱处理中国内地房产，中国公证处及房管局无法直接核验外文签名真实性，且缺少法定见证与认证环节，非诉过户程序直接被拒绝。',
      })
      report.roadmap.push({
        text: '【中日认证】该日本文书必须提交日本外务省完成海牙认证（Apostille），并在中国内地由具备涉外资质的公证处完成官方宣誓翻译质证。',
        cost: { amount: '¥500-3,500', currency: 'CNY', time: '3-6 周' },
        priority: 'critical',
      })
    }
  }

  // ---- Rule 3: 境内杠杆/配资 + 居住在日本 (流动性冻结) ----
  if (
    assets.cn_assets.includes('cn_leverage') &&
    identity.habitual_residence === 'JP'
  ) {
    report.warnings.push({
      code: 'WARN_CN_LEVERAGE_LIQUIDATION',
      title: '境内杠杆/配资账户穿仓强平风险',
      detail:
        '被继承人发生意外后，境内融资融券/配资账户因缺乏跨境应急授权，券商/资管方将依约直接强平。普通继承公证程序耗时较长（通常>6个月），无法及时应对市场波动。',
    })
    report.roadmap.push({
      text: '【流动性隔离】须在境内设立专属商事授权或应急流动性接管路径，将高杠杆证券账户与普通民事继承程序剥离。',
      cost: { amount: '¥3,000-10,000', currency: 'CNY', time: '2-4 周' },
      priority: 'protective',
    })
  }

  // ---- Rule 4: 虚拟/数字资产 (权属蒸发风险) ----
  if (
    assets.cn_assets.includes('cn_digital') ||
    assets.jp_assets.includes('jp_digital')
  ) {
    report.warnings.push({
      code: 'WARN_DIGITAL_ASSET_LOST',
      title: '虚拟/数字资产法定执行盲区',
      detail:
        '中日两地不动产登记局或银行均无加密货币、冷钱包私钥的法定托管通道。现有传承文书无法被司法机关强制执行。',
    })
    report.roadmap.push({
      text: '【私钥托管】建立线下的私钥安全交接与双重备份机制，确保法定继承人能够知晓并获取技术资产。此项不通过法律程序执行，仅靠线下信任安排。',
      priority: 'protective',
    })
  }

  // ---- Rule 5: 尚无文书的通用提示 ----
  if (document.doc_type === 'NONE') {
    report.warnings.push({
      code: 'WARN_STATUTORY_HEIR_COST',
      title: '纯法定继承流转成本与时间过长',
      detail:
        '无传承方案状态下将完全依中日涉外冲突法推演，两地证明文件（如亲属关系公证、海牙认证等）互调验证周期通常在 1 年以上。',
    })
    report.roadmap.push({
      text: '【分立架构】强烈建议采取"分立遗嘱（Split Wills）"架构，中国资产由中国公证文书管辖，日本资产由日本法文书管辖。',
      cost: { amount: '¥1,500-3,000（中国侧）+ ¥30,000-80,000（日本侧）', currency: 'CNY', time: '2-4 周' },
      priority: 'procedural',
    })
  }

  // ---- Rule 6: 第三国继承人 + 中国不动产 (三国认证链) ----
  if (
    heirs.heir_locations.includes('HEIR_THIRD') &&
    assets.cn_assets.includes('cn_re')
  ) {
    report.warnings.push({
      code: 'WARN_THIRD_COUNTRY_AUTH_CHAIN',
      title: '三国领事认证链条过长风险',
      detail:
        '第三国继承人参与中国不动产继承时，身份证明、亲属关系公证需经第三国外交部→中国驻第三国使领馆的双重认证（或海牙认证→中方质证）。三国公文互认链条通常耗时12-18个月。',
    })
    report.roadmap.push({
      text: '【认证前置】建议第三国继承人提前在所在国办理海牙认证（Apostille）或领事认证，并委托中国境内涉外公证处预审文件。',
      cost: { amount: '所在国费用不等 + ¥500-3,000（中国侧翻译质证）', currency: 'CNY', time: '提前 6-12 个月启动' },
      priority: 'procedural',
    })
  }

  // ---- Rule 7: 限制行为能力继承人 + 日本资产 (特别代理人) ----
  if (
    heirs.has_incapacity_heir &&
    (assets.jp_assets.includes('jp_re') || assets.jp_assets.includes('jp_fin'))
  ) {
    report.warnings.push({
      code: 'WARN_JP_INCAPACITY_GUARDIAN',
      title: '日本家庭裁判所特别代理人选任程序',
      detail:
        '继承人中包含未成年人或限制民事行为能力人时，日本家庭裁判所需另行选任"特别代理人"（特別代理人）代表其参与遗产分割协议。该程序独立于主继承流程。',
    })
    report.roadmap.push({
      text: '【日本方案】须在继承开始后立即向日本家庭裁判所申请特别代理人选任，不可跳过。建议提前与司法书士确认监护人资格。',
      cost: { amount: '¥50,000-150,000', currency: 'JPY', time: '额外 2-4 个月' },
      priority: 'procedural',
    })
  }

  // ---- Rule 8: 永住者(PR) + 中国金融资产 (外汇管制审查) ----
  if (
    identity.jp_legal_status === 'PR' &&
    assets.cn_assets.includes('cn_fin')
  ) {
    report.warnings.push({
      code: 'WARN_PR_CN_FOREX',
      title: '永住者身份触发外汇管制额外审查',
      detail:
        '中国境内银行对"境外永久居留权"持有人的继承资金购汇汇出有额外审查要求，需提供《境外永久居留权证明》翻译公证 + 外汇管理局备案。',
    })
    report.roadmap.push({
      text: '【资金通道】提前确认外汇管理局备案路径，或在传承方案中指定境内受益人以人民币形式继承，避免跨境汇出审查。',
      cost: { amount: '¥500-2,000（翻译公证）', currency: 'CNY', time: '1-3 个月（含外管局备案）' },
      priority: 'protective',
    })
  }

  // ---- 最终状态判定 + Roadmap 排序 ----
  if (report.blockers.length > 0) {
    report.status = 'RED'
  } else if (report.warnings.length > 0) {
    report.status = 'YELLOW'
  }

  // 按优先级排序：critical > procedural > protective > informational
  const order = { critical: 0, procedural: 1, protective: 2, informational: 3 }
  report.roadmap.sort((a, b) => order[a.priority] - order[b.priority])

  return report
}
