// ============================================================
// 引导首页 —— 告诉用户这个工具干什么、怎么用
// ============================================================

export function IntroPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 主视觉区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 text-center">
        {/* 图标 */}
        <div className="text-5xl mb-5">🏛️</div>

        <h1 className="text-2xl font-bold text-text-primary mb-3 leading-tight">
          中日跨境<br />家族资产传承诊断
        </h1>

        <p className="text-sm text-text-secondary leading-relaxed max-w-xs mb-8">
          5 分钟搞清楚一件事：<br />
          如果你不做任何安排，你的资产会怎么分，<br />
          你的家人要跑多少手续、花多少钱才能拿到。
        </p>

        {/* 三步说明 */}
        <div className="grid gap-3 max-w-xs w-full mb-8">
          {[
            { emoji: '📝', title: '回答 5 组问题', desc: '资产在哪、家人有谁、有无安排' },
            { emoji: '🔍', title: 'AI 自动诊断', desc: '中日法规比对，找出程序卡点和风险' },
            { emoji: '📋', title: '获取行动方案', desc: '具体到每一步该做什么、要准备什么文件' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 bg-surface-card border border-border rounded-xl px-4 py-3 text-left">
              <span className="text-2xl shrink-0">{s.emoji}</span>
              <div>
                <p className="text-sm font-medium text-text-primary">{s.title}</p>
                <p className="text-xs text-text-muted">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className="w-full max-w-xs px-8 py-3.5 bg-neutral-900 text-white rounded-xl text-base font-semibold hover:bg-neutral-800 transition-colors shadow-lg"
        >
          开始诊断 →
        </button>
        <p className="text-[11px] text-text-muted mt-3">免费 · 无需注册 · 数据不留存</p>
      </div>

      {/* 底部 */}
      <div className="text-center pb-8">
        <p className="text-[11px] text-text-muted">
          基于《民法典》《涉外民事关系法律适用法》<br />日本民法 · 中日判例 · 专业法律研析
        </p>
      </div>
    </div>
  )
}
