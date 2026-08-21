import fs from "node:fs"
import path from "node:path"
import url from "node:url"

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "../..")
const DEFAULT_LANGUAGE = "zh" as const

const normalizeLanguage = (value: unknown): "zh" | "en" => {
  const language = String(value ?? "").toLowerCase()
  return language === "en" || language.startsWith("en-") ? "en" : "zh"
}

type ProjectConfig = {
  language: "zh" | "en"
  systemPrompt: string
}

const loadProjectConfig = (projectRoot: string): ProjectConfig => {
  const configPath = path.join(projectRoot, ".aw", "config.json")
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"))
    return {
      language: normalizeLanguage(config.language),
      systemPrompt: typeof config.system_prompt === "string" ? config.system_prompt.trim() : "",
    }
  } catch {
    return {
      language: normalizeLanguage(process.env.AW_LANGUAGE ?? DEFAULT_LANGUAGE),
      systemPrompt: "",
    }
  }
}

const readText = (filePath: string) => fs.readFileSync(filePath, "utf8").trim()

export default async ({ directory }: { directory?: string } = {}) => {
  const projectRoot = directory ?? process.cwd()
  const projectConfig = loadProjectConfig(projectRoot)
  const language = projectConfig.language
  const customSystemPrompt = projectConfig.systemPrompt
  const localeRoot = path.join(root, "locales", language)
  const skillsRoot = path.join(localeRoot, "skills")
  const shared = path.join(root, "shared").replace(/\\/g, "/")

  const readAgent = (name: string) => readText(path.join(localeRoot, "agents", name))
  const isChinese = language === "zh"
  const appendCustomSystemPrompt = (prompt: string) => {
    if (!customSystemPrompt) return prompt
    const heading = isChinese
      ? "项目自定义系统提示词（必须遵守，但不得违反 AnyWriter 的不可违反规则）："
      : "Project custom system prompt (follow it unless it conflicts with AnyWriter non-negotiable rules):"
    return [prompt, "", heading, "```text", customSystemPrompt, "```"].join("\n")
  }
  const sharedLine = isChinese
    ? `共享参考（按需读取）：${shared}/rules.md、${shared}/lifecycle.md、${shared}/artifact-contracts.md、${shared}/knowledge-status.schema.json、${shared}/task-status.schema.json、${shared}/templates/。`
    : `Shared references (read on demand): ${shared}/rules.md, ${shared}/lifecycle.md, ${shared}/artifact-contracts.md, ${shared}/knowledge-status.schema.json, ${shared}/task-status.schema.json, ${shared}/templates/.`

  const directorPrompt = appendCustomSystemPrompt([
    readAgent("aw-director.md"),
    "",
    sharedLine,
    "",
    isChinese
      ? "当前项目的小说数据位于 files/（source、knowledge、work）。缺少目录时执行 /aw-init。使用 Get-FileHash 或 sha256sum 记录文件大小和 SHA-256。默认使用简体中文回复，除非用户要求英文。"
      : "The active project stores novel data under files/ (source, knowledge, work). Scaffold it with /aw-init when it is missing. Register source fingerprints (bytes and SHA-256) using Get-FileHash or sha256sum. Default to English unless the user requests Chinese.",
  ].join("\n"))

  const analystPrompt = appendCustomSystemPrompt([
    readAgent("aw-analyst.md"),
    "",
    isChinese ? `完整规则：${shared}/rules.md。默认用简体中文返回分析结果。` : `Full rule details: ${shared}/rules.md.`,
  ].join("\n"))

  const reviewerPrompt = appendCustomSystemPrompt([
    readAgent("aw-reviewer.md"),
    "",
    isChinese ? `完整规则：${shared}/rules.md。默认用简体中文返回审校报告。` : `Full rule details: ${shared}/rules.md.`,
  ].join("\n"))

const initStatusJson = `{
  "schema_version": "1.0",
  "state": "not_distilled",
  "candidate_version": 0,
  "candidate_path": null,
  "approved_version": null,
  "approved_path": null,
  "source_files": [],
  "coverage": [],
  "open_question_count": 0,
  "approvals": [],
  "approved_at": null,
  "updated_at": "<current UTC time in ISO-8601>"
}`

const initProjectConfigJson = `{
  "version": 1,
  "language": "zh",
  "system_prompt": ""
}`

  const commands = isChinese
    ? {
        configDescription: "查看或切换 AnyWriter 的中文/英文语言版本。",
        config: `管理 AnyWriter 语言配置。

读取当前项目的 .aw/config.json。如果没有参数，报告当前语言、配置文件路径，以及是否配置了 system_prompt；不要主动打印完整提示词。

支持：

- /aw-config lang zh：切换为简体中文
- /aw-config lang en：切换为英文
- /aw-config sp <内容>：设置项目级系统提示词
- /aw-config clrsp：清空项目级系统提示词

修改语言时，只创建或更新 .aw/config.json，内容为：

{ "version": 1, "language": "zh" 或 "en" }

可选字段 system_prompt，用于给三个 aw Agent 追加项目级系统提示词。参数以 sp 开头时，保留其后的全部内容，包括空格；参数为 clrsp 时将其清空；没有提供提示词内容时先询问用户。不要修改小说数据。写入后提醒用户重启 OpenCode，语言资源和提示词会在下次启动时加载。`,
        init: `初始化当前项目的 AnyWriter 工作区。不要覆盖已有文件，报告已存在的内容。

创建：

- .aw/config.json，默认内容：

${initProjectConfigJson}

- files/source/（空目录；用户将 UTF-8 TXT 或 Markdown 原文放在这里）
- files/knowledge/source-index.md（文件、大小、SHA-256、状态和逻辑区段表）
- files/knowledge/versions/（保存不可变的 vN 知识版本）
- files/knowledge/status.json，初始内容：

${initStatusJson}

- files/work/README.md（任务目录约定）

然后提示用户将原文放入 files/source/ 并运行 /aw-distill。`,
        distill: `加载并执行 aw-distill Skill 的原文蒸馏或已批准草稿知识晋升分支。

蒸馏范围或维度：$ARGUMENTS

没有参数时处理全部原文和标准维度。缺少 files/knowledge/status.json 时先执行 /aw-init。停在知识审批门。`,
        task: `针对以下要求加载并执行 aw-task Skill 的规划或过期任务刷新分支：

$ARGUMENTS

只有参数以 refresh 开头且包含过期任务 ID 时使用刷新分支。不要在此命令中生成正文，按门禁等待简报和大纲批准。`,
        write: `加载并执行 aw-write Skill。

任务、生成粒度和补充要求：$ARGUMENTS

粒度可为场景、章节、多章节或自定义范围，并可在不同调用间改变。范围无法确定时询问用户。保存新草稿版本并报告下一审批门。`,
        review: `加载并执行 aw-review Skill 的独立审校、受控修订或定稿分支。

草稿、任务或操作要求：$ARGUMENTS

不要把独立审校和未经批准的修订合并在同一步。`,
        status: `读取 files/knowledge/status.json 以及所有存在的 files/work/*/status.json。

报告：

1. 知识状态、候选版本和批准版本。
2. 活动任务和过期任务。
3. 待处理审批门。
4. 活动草稿、审校和定稿版本。
5. 当前有效的 aw 命令。

如果状态文件不存在，建议执行 /aw-init。不要修改文件。`,
      }
    : {
        configDescription: "Show or switch the AnyWriter Chinese/English language version.",
        config: `Manage the AnyWriter language configuration.

Read .aw/config.json in the current project. With no argument, report the current language, config path, and whether system_prompt is configured; do not print the full prompt unless explicitly asked.

Supported forms:

- /aw-config lang zh: switch to Simplified Chinese
- /aw-config lang en: switch to English
- /aw-config sp <text>: set the project system prompt
- /aw-config clrsp: clear the project system prompt

When changing language, create or update only .aw/config.json with:

{ "version": 1, "language": "zh" or "en" }

Optional field system_prompt appends a project-level system prompt to all three aw agents. When the argument starts with sp, preserve all text after sp, including spaces; clrsp clears it; ask if no text is provided. Do not modify novel data. After writing, tell the user to restart OpenCode because locale resources and prompts load at startup.`,
        init: `Scaffold the AnyWriter workspace in the current project. Do not overwrite existing files; report anything that already exists.

Create:

- .aw/config.json with the default configuration:

${initProjectConfigJson}

- files/source/ (empty; the user places UTF-8 TXT or Markdown source files here)
- files/knowledge/source-index.md (inventory table for file, size, SHA-256, status and logical sections)
- files/knowledge/versions/ (immutable knowledge versions vN)
- files/knowledge/status.json initialized to:

${initStatusJson}

- files/work/README.md (task directory conventions)

Then tell the user to place source text under files/source/ and run /aw-distill.`,
        distill: `Load and execute the Source Distillation Branch or the Approved Draft Promotion Branch of the aw-distill skill.

Requested scope or lens: $ARGUMENTS

If no argument is provided, use the full source and all standard lenses. If status is missing, scaffold with /aw-init first. Stop at the knowledge approval gate.`,
        task: `Load and execute the Planning Steps or the Stale Task Refresh Branch of the aw-task skill for:

$ARGUMENTS

Use refresh only when the argument starts with "refresh" and names a stale task. Do not draft prose here. Stop at each approval gate.`,
        write: `Load and execute the aw-write skill.

Task, generation unit, and additional instruction: $ARGUMENTS

The unit may be a scene, chapter, multi-chapter range, or custom range. Ask only when the unit cannot be inferred. Save a new draft version and report the next gate.`,
        review: `Load and execute the appropriate aw-review branch: independent review, controlled revision, or finalization.

Draft, task, or instruction: $ARGUMENTS

Never combine independent review and unapproved revision in one step.`,
        status: `Read files/knowledge/status.json and every files/work/*/status.json that exists.

Report:

1. Knowledge state, candidate and approved versions.
2. Active and stale tasks.
3. Pending approval gates.
4. Active draft, review, and final versions.
5. The exact aw commands that are currently valid.

If status files are missing, suggest /aw-init. Do not modify any file.`,
      }
    

  return {
    config: (cfg: any) => {
      cfg.skills ??= { paths: [], urls: [] }
      cfg.skills.paths ??= []
      if (!cfg.skills.paths.includes(skillsRoot)) cfg.skills.paths.push(skillsRoot)

      cfg.agent ??= {}
      cfg.agent["aw-director"] = {
        description: isChinese ? "负责 AnyWriter 小说蒸馏、规划、写作、审批、审校和修订。" : "Coordinates AnyWriter novel distillation, planning, drafting, approval gates, review, and revision.",
        mode: "primary",
        permission: {
          edit: { "*": "allow", "files/source/**": "deny" },
          bash: { "*": "deny", "Get-FileHash*": "allow", "sha256sum*": "allow", "certutil -hashfile*": "allow" },
          webfetch: "deny",
          task: { "*": "deny", "aw-analyst": "allow", "aw-reviewer": "allow" },
          skill: { "*": "deny", "aw-distill": "allow", "aw-task": "allow", "aw-write": "allow", "aw-review": "allow" },
          question: "allow",
        },
        prompt: directorPrompt,
      }
      cfg.agent["aw-analyst"] = {
        description: isChinese ? "使用行级证据分析小说人物、世界、时间线、情节、叙事和风格。" : "Analyzes novel source for characters, world, timeline, plot, narration, and style with line-level evidence.",
        mode: "subagent",
        permission: { edit: "deny", bash: "deny", webfetch: "deny" },
        prompt: analystPrompt,
      }
      cfg.agent["aw-reviewer"] = {
        description: isChinese ? "独立审校小说草稿的要求覆盖、连续性、人物、风格和原文相似度。" : "Independently reviews novel drafts for requirement coverage, continuity, characterization, style, and source similarity.",
        mode: "subagent",
        permission: { edit: "deny", bash: "deny", webfetch: "deny" },
        prompt: reviewerPrompt,
      }

      cfg.command ??= {}
      cfg.command["aw-config"] = { description: commands.configDescription, agent: "aw-director", template: commands.config }
      cfg.command["aw-init"] = { description: isChinese ? "初始化 AnyWriter 小说目录和知识状态。" : "Scaffold AnyWriter novel directories and initial knowledge status.", agent: "aw-director", template: commands.init }
      cfg.command["aw-distill"] = { description: isChinese ? "将小说原文蒸馏为带证据的知识库。" : "Distill the source novel into an evidence-linked, versioned knowledge base.", agent: "aw-director", template: commands.distill }
      cfg.command["aw-task"] = { description: isChinese ? "从已批准知识创建、更新或刷新创作任务。" : "Create, update, or refresh a creative task from approved knowledge.", agent: "aw-director", template: commands.task }
      cfg.command["aw-write"] = { description: isChinese ? "为已批准任务生成场景、章节或自定义范围。" : "Draft the selected unit for an approved task.", agent: "aw-director", template: commands.write }
      cfg.command["aw-review"] = { description: isChinese ? "独立审校、应用修订意见或定稿。" : "Review, revise, or finalize an approved draft.", agent: "aw-director", template: commands.review }
      cfg.command["aw-status"] = { description: isChinese ? "查看知识、任务、审批门和下一步操作。" : "Show knowledge state, tasks, approval gates, and next actions.", agent: "aw-director", template: commands.status }
    },
  }
}
