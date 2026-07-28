// ============================================================
// 付费锁定模块：显示功能预览 + 解锁 CTA
// ============================================================

export function LockedModule({
  icon,
  title,
  teaser,
  bullets,
}: {
  icon: string
  title: string
  teaser: string
  bullets: string[]
}) {
  return (
    <div className="bg-surface-card border border-border rounded-xl overflow-hidden opacity-90">
      {/* 锁定遮罩 */}
      <div className="relative">
        {/* 模糊预览区 */}
        <div className="px-5 py-4 filter blur-[2px] select-none pointer-events-none">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{icon}</span>
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed mb-3">{teaser}</p>
          <div className="space-y-1.5">
            {bullets.map((_, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                <span className="h-3 bg-neutral-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>

        {/* 锁定浮层 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60">
          <div className="text-center px-6">
            <div className="text-3xl mb-2">🔒</div>
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              进阶分析（付费功能）
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed mb-4 max-w-xs">
              {teaser}
            </p>
            <div className="space-y-1.5 mb-4">
              {bullets.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="text-green-500">✓</span>
                  {b}
                </div>
              ))}
            </div>
            <button className="px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
              解锁完整分析 →
            </button>
            <p className="text-[11px] text-text-muted mt-2">
              包含费用精算 · 方案对比 · 资产结构优化建议
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
