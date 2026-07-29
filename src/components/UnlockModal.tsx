// ============================================================
// 解锁弹窗 v2 —— ¥99 邮件交付
// 付费渠道暂不加，后续根据平台再加
// ============================================================

import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  moduleName: string
}

export function UnlockModal({ open, onClose, moduleName }: Props) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!open) return null

  const canSubmit = email.trim() && email.includes('@')

  const handleSubmit = () => {
    if (!canSubmit) return
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {!submitted ? (
          <>
            {/* 头部 */}
            <div className="bg-neutral-900 text-white px-6 py-5 text-center">
              <div className="text-3xl mb-2">🔓</div>
              <h3 className="text-lg font-semibold">解锁{moduleName}</h3>
              <p className="text-sm text-neutral-300 mt-1">
                支付 ¥99，完整方案发送至你的邮箱
              </p>
            </div>

            {/* 定价说明 */}
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">传承方案设计（三项方案完整版）</span>
                <span className="text-lg font-bold text-text-primary">¥99</span>
              </div>
              <div className="text-xs text-text-muted space-y-0.5">
                <p>✓ 指定分配 · 费用最优 · 流程最简 三项目标完整方案</p>
                <p>✓ 详细法律文件清单 + 分步办理指南</p>
                <p>✓ 针对性注意事项与风险提示</p>
                <p>✓ 发送至你的邮箱，可转发给家人或律师</p>
              </div>
            </div>

            {/* 表单 */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">
                  接收报告的邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-neutral-400"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                确认并发送 →
              </button>

              <p className="text-[11px] text-text-muted text-center leading-relaxed">
                付费渠道将在后续版本上线。当前版本中，提交后我们会通过邮件与你联系确认。
              </p>
            </div>
          </>
        ) : (
          /* 提交成功 */
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-3">📬</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">已收到你的请求</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-2">
              我们将向 <strong>{email}</strong> 发送完整方案。
            </p>
            <p className="text-xs text-text-muted mb-6">
              付费渠道即将上线。如需加急，可直接联系律师。
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
