import jsPDF from 'jspdf'
import type { ComplianceInput, ReportOutput } from '../types'

function fmtCost(amount: string, currency: string) {
  const sym = currency === 'JPY' ? '¥' : '¥'
  return `${sym}${amount}${currency === 'JPY' ? ' JPY' : ''}`
}

export function generateReportPDF(
  _input: ComplianceInput,
  report: ReportOutput
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const m = 20
  let y = m

  const statusLabel =
    report.status === 'RED' ? '🔴 红灯阻断' : report.status === 'YELLOW' ? '🟡 黄灯预警' : '🟢 流程顺畅'

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('中日跨境程序合规与执行路径诊断书', m, y)
  y += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`诊断时间: ${new Date().toLocaleDateString('zh-CN')}`, m, y)
  y += 5
  doc.text(`案情编号: ${Date.now().toString(36).toUpperCase()}`, m, y)
  y += 8

  // Status badge
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(report.status === 'RED' ? 153 : report.status === 'YELLOW' ? 146 : 22, 101, 52)
  doc.text(`诊断状态: ${statusLabel}`, m, y)
  y += 12

  doc.setTextColor(30)
  doc.setFontSize(11)

  // Blockers
  if (report.blockers.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('程序阻断项 (Blockers)', m, y)
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    for (const b of report.blockers) {
      if (y > 250) { doc.addPage(); y = m }
      doc.setFont('helvetica', 'bold')
      doc.text(b.title, m, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(b.detail, 170)
      doc.text(lines, m, y)
      y += lines.length * 4.5 + 4
    }
  }

  // Warnings
  if (report.warnings.length > 0) {
    if (y > 230) { doc.addPage(); y = m }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('预警项 (Warnings)', m, y)
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    for (const w of report.warnings) {
      if (y > 250) { doc.addPage(); y = m }
      doc.setFont('helvetica', 'bold')
      doc.text(w.title, m, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(w.detail, 170)
      doc.text(lines, m, y)
      y += lines.length * 4.5 + 4
    }
  }

  // Roadmap
  if (y > 220) { doc.addPage(); y = m }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('通行路线图 (Roadmap)', m, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  for (let i = 0; i < report.roadmap.length; i++) {
    if (y > 260) { doc.addPage(); y = m }
    const r = report.roadmap[i]
    const text = `${i + 1}. ${r.text}${r.cost ? ` [预估费用: ${fmtCost(r.cost.amount, r.cost.currency)}, 耗时: ${r.cost.time}]` : ''}`
    const lines = doc.splitTextToSize(text, 170)
    doc.text(lines, m, y)
    y += lines.length * 4.5 + 3
  }

  // Green case
  if (report.status === 'GREEN') {
    doc.setFontSize(12)
    doc.setTextColor(22, 101, 52)
    const msg = '当前资产与继承人画像下未检测到程序阻断或显著风险点。建议仍就具体个案咨询涉外律师确认细节。'
    const lines = doc.splitTextToSize(msg, 170)
    doc.text(lines, m, y)
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(160)
  const footer = '本报告由中日跨境程序合规诊断引擎 (CBCE) 自动生成，仅供参考，不构成法律意见。'
  doc.text(footer, m, 280, { align: 'left' })

  return doc
}

export function downloadPDF(input: ComplianceInput, report: ReportOutput) {
  const doc = generateReportPDF(input, report)
  doc.save(`CBCE_诊断报告_${Date.now().toString(36).toUpperCase()}.pdf`)
}
