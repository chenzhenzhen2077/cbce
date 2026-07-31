# 传到位 — 中日跨境家族资产传承诊断引擎

五步问诊，自动识别中日两国继承法冲突，生成红黄绿风险诊断 + 行动路线图。

## 在线访问

https://chenzhenzhen2077.github.io/cbce

## 本地运行

```bash
git clone https://github.com/chenzhenzhen2077/cbce.git
cd cbce
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | React 19 + TypeScript |
| 构建 | Vite |
| 样式 | Tailwind CSS 4 |
| PDF 导出 | jsPDF + html2canvas（截屏方案） |
| 部署 | GitHub Pages |
| 后端 | 无（纯前端） |

## 项目结构

```
src/
├── engine/
│   ├── rules.ts          # 14 条规则决策树
│   └── calculator.ts     # 法定继承费用模拟引擎
├── components/
│   ├── IntroPage.tsx       # 引导首页
│   ├── StepPreAssessment   # 前置评估（时机三问）
│   ├── StepIdentity        # 步骤1：身份与居所
│   ├── StepAssets          # 步骤2：资产大类
│   ├── StepHeirs           # 步骤3：继承人画像
│   ├── StepDocument        # 步骤4：文书与程序
│   ├── ReportView.tsx      # 结果页（Tab 分层）
│   ├── HeirDiagram         # 中日双轨法定继承关系图
│   ├── GoalPlanner         # 三项传承方案
│   ├── CalculatorPanel     # 费用参考计算
│   ├── ScenarioComparison  # 四方案对比
│   ├── AssetStructureCompare # 资产结构友好度
│   └── AffordabilityCheck  # 继承可行性评估
├── types.ts              # 全局类型定义
└── utils/pdf.ts          # PDF 导出
```

## AI 参与度

本工具由 **Claude Code** 辅助开发。从 PRD 梳理、规则引擎翻译（中日继承法条文 → TypeScript 决策树）、UI 迭代到部署上线，全程由 AI 协助完成。开发过程中的每次核对均基于真实法规文档和法院判例。

## 许可证

MIT
