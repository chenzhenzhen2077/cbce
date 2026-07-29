// ============================================================
// PDF 导出 v2 —— 使用 html2canvas 截屏，避开 jsPDF 中文乱码
// ============================================================

import jsPDF from 'jspdf'

export async function downloadPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId)
  if (!element) {
    alert('无法找到报告内容，请刷新后重试。')
    return
  }

  // 动态导入 html2canvas（减少首屏加载）
  const html2canvas = (await import('html2canvas')).default

  try {
    const canvas = await html2canvas(element, {
      scale: 2,                     // 高清输出
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2], // scale=2, 所以除以2回到实际尺寸
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)

    // 如果内容超过一页，分页
    const pageHeight = pdf.internal.pageSize.getHeight()
    let remainingHeight = canvas.height / 2

    while (remainingHeight > pageHeight) {
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, -(pageHeight), canvas.width / 2, canvas.height / 2)
      remainingHeight -= pageHeight
    }

    pdf.save(filename)
  } catch (err) {
    console.error('PDF 生成失败:', err)
    alert('PDF 生成失败，请重试。')
  }
}
