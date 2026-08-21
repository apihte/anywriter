---
name: aw-task
description: 当用户要求修改、扩展、续写、重写、分支或重述人物、背景、情节、场景、叙事或风格，或刷新过期任务时，规划 AnyWriter 小说变更。
---

# AW 小说改编规划

将自然语言创作要求转成已批准约束和可执行大纲。

## 共享参考

- 规则：`../../../../shared/rules.md`
- 生命周期：`../../../../shared/lifecycle.md`
- 产物契约：`../../../../shared/artifact-contracts.md`
- 状态 Schema：`../../../../shared/task-status.schema.json`
- 模板：`../../../../shared/templates/`

## 规划流程

1. 读取共享规则、生命周期和产物契约。
2. 确认知识状态为 `knowledge_approved`；否则停在知识审批门。
3. 在 `files/work/` 创建唯一任务目录，不覆盖已有任务。
4. 将要求规范化为 `brief-v1.md`：操作类型、原文锚点、必须改变、保留项、禁止项、风格模式、视角、时态、目标结果和生成粒度。
5. 对会实质改变方案的未决项逐项提问，将答案写入 `decisions.md`。
6. 基于确切批准知识路径和相关原文证据创建 `impact-analysis-v1.md`，覆盖人物、规则、时间线、因果、伏笔和下游风险。
7. 将状态设为 `brief_pending_approval`，等待简报和影响分析批准。
8. 记录两项独立批准后创建 `outline-v1.md`，包含单元目标、必须事件、禁止事件、起止状态和连续性依赖。
9. 将状态设为 `outline_pending_approval`，等待大纲批准。
10. 批准后记录决定，将状态设为 `ready_to_write`。

## 过期任务刷新

1. 仅对 `stale: true` 的任务执行，通常通过 `/aw-task refresh <task-id>` 调用。
2. 比较任务记录的知识版本与当前批准知识路径。
3. 创建新的 `impact-analysis-vN.md`；只有受影响时才创建新简报或大纲版本。
4. 每个变更产物都必须等待用户批准。
5. 更新活动产物路径和知识版本，清除 `stale`，恢复任务原本的有效状态。

## 完成标准

- 任务目录唯一，状态文件符合共享 task Schema。
- 简报区分必须项、保留项和禁止项。
- 影响分析引用确切批准知识或原文证据。
- 状态变为 `ready_to_write` 前必须存在已批准大纲。
