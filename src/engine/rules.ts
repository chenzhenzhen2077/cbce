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

  // ---- Rule 9: 日本2024继承登记强制义务 ----
  if (assets.jp_assets.includes('jp_re')) {
    report.warnings.push({
      code: 'WARN_JP_2024_REGISTRATION',
      title: '日本2024年继承登记强制义务（3年内必须完成）',
      detail:
        '2024年4月1日起，继承人须在继承开始后3年内完成不动产继承登记（相続登記）。既有未登记房产须在2027年3月31日前补登。逾期未登记最高罚款10万日元。',
    })
    report.roadmap.push({
      text: '【日本方案】继承开始后立即联系司法书士启动相続登記。注意3年期限从死亡时起算，不可延误。既有房产若从未登记，须在2027年3月前补办。',
      cost: { amount: '¥100,000-300,000', currency: 'JPY', time: '3-5 周（当前处理周期）' },
      priority: 'procedural',
    })
  }

  // ---- Rule 10: 外汇继承转移豁免（外籍继承人） ----
  if (input.identity.nationality !== 'CN' && (assets.cn_assets.includes('cn_re') || assets.cn_assets.includes('cn_fin'))) {
    report.warnings.push({
      code: 'INFO_FOREX_EXEMPTION',
      title: '外籍继承人外汇继承转移不受5万美元年度限额约束',
      detail:
        '外籍或港澳台继承人凭继承权公证书/法院判决书 + 资产清算证明 + 完税证明，可将继承资金一次性或分期汇出境外，不受个人年度5万美元购汇额度限制。但需提前向外管局备案。',
    })
    report.roadmap.push({
      text: '【外汇通道】备齐继承权公证+完税证明+资产清算文件，向外管局申请"继承转移"类外汇额度。此通道独立于个人购汇额度。',
      priority: 'informational',
    })
  }

  // ---- Rule 11: 日本继承放弃3个月期限 ----
  if ((assets.jp_assets.includes('jp_re') || assets.jp_assets.includes('jp_fin')) && input.heirs.heir_locations.includes('HEIR_THIRD')) {
    report.warnings.push({
      code: 'WARN_JP_RENUNCIATION_DEADLINE',
      title: '日本法下继承放弃仅3个月期限',
      detail:
        '日本民法规定继承人须在知道继承开始后3个月内向家庭裁判所申请放弃继承（相続放棄）。中国法相对宽松但日本期限极严格。第三国继承人若不知晓此期限，可能在不知情下被视为接受继承并承担债务。',
    })
    report.roadmap.push({
      text: '【日本方案】继承人（尤其第三国）须在知道被继承人去世后3个月内明确做出接受或放弃的决定并向日本家庭裁判所申报。',
      priority: 'procedural',
    })
  }

  // ---- Rule 12: 遗嘱形式效力 vs 实质效力两层审查 ----
  if (document.doc_type === 'JP_HOLOGRAPH' || document.doc_type === 'JP_NOTARY') {
    report.warnings.push({
      code: 'WARN_WILL_TWO_LAYER_VALIDITY',
      title: '遗嘱在中国使用须通过形式效力和实质效力两层审查',
      detail:
        '遗嘱形式效力（是否符合法定格式）：较宽松，符合立遗嘱时经常居所地/国籍/立遗嘱地任一法律即可（《法律适用法》第32条）。但实质效力（遗嘱内容是否有效）需符合立遗嘱时经常居所地或国籍法（第33条）。两层审查各自独立，形式有效不等于实质内容会被中国法院认可。',
    })
    report.roadmap.push({
      text: '【合规要点】日本遗嘱在中国使用时，先做海牙认证确保形式有效，再请中国涉外律师审查实质内容是否符合中国法律（如必留份规定）。两层缺一不可。',
      priority: 'procedural',
    })
  }

  // ---- Rule 13: 2024年日本国内联络人制度 ----
  if (assets.jp_assets.includes('jp_re') && input.identity.habitual_residence !== 'JP') {
    report.warnings.push({
      code: 'WARN_JP_CONTACT_PERSON',
      title: '海外居民持有日本不动产须登记在日联络人',
      detail:
        '2024年4月起，在日本无常住地址的外国人（自然人及法人）持有日本不动产，须向法務局登记一名在日联络人（姓名+地址）。继承人如果本身不在日本居住，在办理继承过户时将面临此额外要求。',
    })
    report.roadmap.push({
      text: '【日本方案】提前指定在日联络人（可为亲属、司法书士或税务师），在继承登记申请时一并提交联络人信息。',
      priority: 'informational',
    })
  }

  // ---- Rule 14: 中日判决互不承认策略 ----
  if (report.blockers.length > 0 && (assets.cn_assets.length > 0 && assets.jp_assets.length > 0)) {
    report.warnings.push({
      code: 'INFO_NON_RECOGNITION_STRATEGY',
      title: '中日民事判决互不承认——可利用对方判决作为"事实证据"',
      detail:
        '中国和日本之间无民事判决相互承认与执行条约。若某案等判例显示：中国法院虽不承认日本判决的既判力，但可接受其"事实认定"作为证据使用。策略意义：在两国分别启动程序时，先在一国取得有利判决，再在另一国将其作为事实证据提交，可大幅降低举证难度。',
    })
    report.roadmap.push({
      text: '【诉讼策略】如涉及两国资产且有争议，优先在日本取得家庭裁判所判决（日本程序通常更标准化），再在中国法院引用其事实认定部分。',
      priority: 'informational',
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
