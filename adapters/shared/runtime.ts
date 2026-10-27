import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import url from "node:url"

export type Language = "zh" | "en"

export type ProjectConfig = {
  language: Language
  writerPrompt: string
  captionPrompt: string
}

export const packageRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "../..")

export const normalizeLanguage = (value: unknown): Language => {
  const language = String(value ?? "").toLowerCase()
  return language === "en" || language.startsWith("en-") ? "en" : "zh"
}

export const loadProjectConfig = (projectRoot: string): ProjectConfig => {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(projectRoot, ".aw", "config.json"), "utf8"))
    return {
      language: normalizeLanguage(config.language),
      writerPrompt: typeof config.writer_prompt === "string" ? config.writer_prompt.trim() : "",
      captionPrompt: typeof config.caption_prompt === "string" ? config.caption_prompt.trim() : "",
    }
  } catch {
    return {
      language: normalizeLanguage(process.env.AW_LANGUAGE),
      writerPrompt: "",
      captionPrompt: "",
    }
  }
}

export const localeRoot = (language: Language) => path.join(packageRoot, "locales", language)
export const skillsRoot = (language: Language) => path.join(localeRoot(language), "skills")
export const sharedRoot = () => path.join(packageRoot, "shared")

export const readText = (filePath: string) => fs.readFileSync(filePath, "utf8").trim()

export const readSkill = (language: Language, name: string) =>
  readText(path.join(skillsRoot(language), name, "SKILL.md"))

export const readAgent = (language: Language, name: string) =>
  readText(path.join(localeRoot(language), "agents", name))

export const extractFrontmatter = (content: string, field: string) => {
  const match = content.match(new RegExp(`^${field}:\\s*(.+)$`, "m"))
  return match?.[1]?.trim() ?? ""
}

export const appendWriterPrompt = (prompt: string, config: ProjectConfig) => {
  if (!config.writerPrompt) return prompt
  const heading = config.language === "zh"
    ? "项目写作系统提示词 writer_prompt（必须遵守，但不得违反 AnyWriter 的不可违反规则）："
    : "Project writer system prompt (writer_prompt; follow it unless it conflicts with AnyWriter non-negotiable rules):"
  return [prompt, "", heading, "```text", config.writerPrompt, "```"].join("\n")
}

const commandText = (language: Language, skill: string, argumentLabel: string) =>
  language === "zh"
    ? `加载并执行 aw-${skill} Skill。\n\n${argumentLabel}：$ARGUMENTS\n\n严格遵守 Skill、共享规则和审批门禁；缺少关键决定时只询问一个聚焦问题。`
    : `Load and execute the aw-${skill} skill.\n\n${argumentLabel}: $ARGUMENTS\n\nFollow the skill, shared rules, and approval gates strictly; ask one focused question only when a missing decision materially changes the result.`

export type AnyWriterCommand = {
  name: string
  description: string
  template: string
}

export const commandsFor = (language: Language): AnyWriterCommand[] => {
  const zh = language === "zh"
  return [
    {
      name: "aw-config",
      description: zh ? "查看或修改 AnyWriter 项目配置。" : "Show or modify AnyWriter project configuration.",
      template: zh
        ? "管理当前项目的 .aw/config.json。支持 lang zh|en、wp <提示词>、clrwp、cp <caption提示词>、clrcp。只修改配置，不修改小说数据。没有参数时报告配置状态，不打印完整提示词。"
        : "Manage .aw/config.json in the current project. Support lang zh|en, wp <prompt>, clrwp, cp <caption prompt>, and clrcp. Modify configuration only, never novel data. With no arguments, report configuration status without printing full prompts.",
    },
    {
      name: "aw-init",
      description: zh ? "初始化 AnyWriter 小说目录和知识状态。" : "Scaffold AnyWriter novel directories and knowledge status.",
      template: zh
        ? "初始化 AnyWriter 工作区。不要覆盖已有文件；创建 .aw/config.json、files/source、files/reference、files/knowledge/source-index.md、files/knowledge/versions、files/knowledge/status.json 和 files/work/README.md，然后提示用户把原文放入 files/source/。"
        : "Scaffold the AnyWriter workspace without overwriting existing files. Create .aw/config.json, files/source, files/reference, files/knowledge/source-index.md, files/knowledge/versions, files/knowledge/status.json, and files/work/README.md, then ask the user to place source text under files/source/.",
    },
    { name: "aw-distill", description: zh ? "将小说原文蒸馏为带证据的知识库。" : "Distill source fiction into an evidence-linked knowledge base.", template: commandText(language, "distill", zh ? "蒸馏范围或维度" : "Requested scope or lens") },
    { name: "aw-task", description: zh ? "从已批准知识创建、更新或刷新创作任务。" : "Create, update, or refresh a creative task from approved knowledge.", template: commandText(language, "task", zh ? "任务要求" : "Task requirement") },
    { name: "aw-write", description: zh ? "为已批准任务生成场景、章节或自定义范围。" : "Draft a scene, chapter, or custom range for an approved task.", template: commandText(language, "write", zh ? "任务、生成粒度和补充要求" : "Task, generation unit, and extra requirements") },
    { name: "aw-review", description: zh ? "独立审校、应用修订意见或定稿。" : "Review, revise, or finalize an approved draft.", template: commandText(language, "review", zh ? "草稿、任务或操作要求" : "Draft, task, or operation") },
    { name: "aw-byimage", description: zh ? "提取图片参考并按图生成内容。" : "Extract image references and generate content from them.", template: commandText(language, "byimage", zh ? "图片路径、生成要求和输出落点" : "Image paths, generation request, and output target") },
    { name: "aw-caption", description: zh ? "批量为文件夹图片生成 caption。" : "Generate captions for images in a folder.", template: commandText(language, "caption", zh ? "图片文件夹路径和补充要求" : "Image folder path and extra requirements") },
    {
      name: "aw-status",
      description: zh ? "查看知识、任务、审批门和下一步操作。" : "Show knowledge, tasks, approval gates, and next actions.",
      template: zh
        ? "读取并报告 files/knowledge/status.json、所有 files/work/*/status.json 和 files/reference/*/status.json。报告知识、任务、审批门、草稿/定稿、图片参考及当前有效 aw 命令；如果状态缺失，只建议 /aw-init，不要修改文件。"
        : "Read and report files/knowledge/status.json, every files/work/*/status.json, and every files/reference/*/status.json. Report knowledge, tasks, approval gates, drafts/finals, image references, and valid aw commands. If state is missing, suggest /aw-init and do not modify files.",
    },
  ]
}

export const directorPrompt = (language: Language, config: ProjectConfig) => {
  const agent = readAgent(language, "aw-director.md")
  const shared = sharedRoot().replace(/\\/g, "/")
  const extra = language === "zh"
    ? `\n\n共享参考（按需读取）：${shared}/rules.md、${shared}/lifecycle.md、${shared}/artifact-contracts.md、${shared}/templates/。当前项目数据位于 files/（source、reference、knowledge、work）；缺少目录时执行 /aw-init。默认使用简体中文回复。`
    : `\n\nShared references (read on demand): ${shared}/rules.md, ${shared}/lifecycle.md, ${shared}/artifact-contracts.md, and ${shared}/templates/. Project data lives under files/ (source, reference, knowledge, work); scaffold it with /aw-init when missing. Default to English.`
  return appendWriterPrompt(agent + extra, config)
}

export const analystPrompt = (language: Language, config: ProjectConfig) =>
  appendWriterPrompt(readAgent(language, "aw-analyst.md"), config)

export const reviewerPrompt = (language: Language, config: ProjectConfig) =>
  appendWriterPrompt(readAgent(language, "aw-reviewer.md"), config)

export const safeSlug = (value: unknown) => {
  const slug = String(value ?? "").trim()
  return /^[a-z0-9][a-z0-9-]*$/.test(slug) ? slug : undefined
}

const imageExtensions: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/webp": "webp",
  "image/gif": "gif", "image/avif": "avif", "image/svg+xml": "svg",
}

const extensionFor = (mime: string, filename?: string) => {
  const known = imageExtensions[mime.toLowerCase()]
  if (known) return known
  const fromName = filename ? path.extname(filename).replace(/^\./, "").toLowerCase() : ""
  return fromName && /^[a-z0-9]{1,8}$/.test(fromName) ? fromName : (mime.split("/")[1] || "png").replace(/[^a-z0-9]/gi, "").toLowerCase()
}

const writeImageFile = (directory: string, name: string, bytes: Buffer) => {
  fs.mkdirSync(directory, { recursive: true })
  let target = path.join(directory, name)
  if (fs.existsSync(target)) {
    const extension = path.extname(name)
    const base = path.basename(name, extension)
    let counter = 2
    while (fs.existsSync(target)) target = path.join(directory, `${base}-${counter++}${extension}`)
  }
  fs.writeFileSync(target, bytes)
  return target
}

export const saveImagePaths = (projectRoot: string, slugValue: unknown, paths: unknown) => {
  const slug = safeSlug(slugValue)
  if (!slug) throw new Error("slug must match ^[a-z0-9][a-z0-9-]*$")
  const inputs = Array.isArray(paths) ? paths.filter((item): item is string => typeof item === "string" && item.trim() !== "") : []
  const targetDir = path.join(projectRoot, "files", "reference", slug)
  const saved: Array<{ path: string; bytes: number; sha256: string }> = []
  for (const input of inputs) {
    const source = path.resolve(projectRoot, input)
    try {
      if (!fs.statSync(source).isFile()) continue
      const bytes = fs.readFileSync(source)
      const target = writeImageFile(targetDir, path.basename(source), bytes)
      saved.push({
        path: path.relative(projectRoot, target).split(path.sep).join("/"),
        bytes: bytes.length,
        sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      })
    } catch {
      // Report a stable empty result rather than leaking filesystem errors.
    }
  }
  return { slug, saved }
}
