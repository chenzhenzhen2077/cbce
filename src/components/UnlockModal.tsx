// ============================================================
// MBTI 风格解锁弹窗
// 免费预览 → 留联系方式 → 获取完整报告
// ============================================================

import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  moduleName: string
}

export function UnlockModal({ open, onClose, moduleName }: Props) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [contactType, setContactType] = useState<'wechat' | 'email'>('wechat')
  const [goal, setGoal] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!open) return null

  const canSubmit = name.trim() && contact.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    // 模拟提交（实际接入后端/邮件服务）
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 弹窗 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {!submitted ? (
          <>
            {/* 头部 */}
            <div className="bg-neutral-900 text-white px-6 py-5 text-center">
              <div className="text-3xl mb-2">🔓</div>
              <h3 className="text-lg font-semibold">解锁{moduleName}</h3>
              <p className="text-sm text-neutral-300 mt-1">
                留下联系方式，我们将为你生成个性化完整方案
              </p>
            </div>

            {/* 定价卡片 */}
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">进阶分析完整版</p>
                  <p className="text-xs text-text-muted">含传承方案设计 + 继承可行性评估 + 律师对接</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-text-primary">¥299</p>
                  <p className="text-[11px] text-text-muted">一次性</p>
                </div>
              </div>
            </div>

            {/* 表单 */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">你的称呼</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：张先生/李女士"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">联系方式</label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setContactType('wechat')}
                    className={`text-xs px-3 py-1 rounded-full border ${
                      contactType === 'wechat' ? 'border-green-500 bg-green-50 text-green-700' : 'border-border text-text-muted'
                    }`}
                  >
                    微信
                  </button>
                  <button
                    onClick={() => setContactType('email')}
                    className={`text-xs px-3 py-1 rounded-full border ${
                      contactType === 'email' ? 'border-green-500 bg-green-50 text-green-700' : 'border-border text-text-muted'
                    }`}
                  >
                    邮箱
                  </button>
                </div>
                <input
                  type={contactType === 'email' ? 'email' : 'text'}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={contactType === 'wechat' ? '微信号' : 'email@example.com'}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">你最关心哪个目标？（可选）</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'designate', label: '🎯 指定分配' },
                    { id: 'tax', label: '💰 费用最优' },
                    { id: 'simple', label: '⚡ 流程最简' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={`text-xs py-2 rounded-lg border transition-colors ${
                        goal === g.id ? 'border-neutral-900 bg-neutral-100 text-text-primary font-medium' : 'border-border text-text-secondary hover:border-neutral-300'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                提交并获取完整方案 →
              </button>

              <p className="text-[11px] text-text-muted text-center">
                提交后律师将在 24 小时内通过你留下的联系方式与你联系。你的信息仅用于本案服务，不会用于其他用途。
              </p>
            </div>
          </>
        ) : (
          /* 提交成功 */
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">提交成功</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              我们将在 24 小时内通过{contactType === 'wechat' ? '微信' : '邮箱'}联系你，为你生成个性化的完整传承方案。
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
