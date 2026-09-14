import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import url from "node:url"

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "../..")
const DEFAULT_LANGUAGE = "zh" as const

const imageExtensions: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
}

const extensionFor = (mime: string, filename?: string) => {
  const known = imageExtensions[mime.toLowerCase()]
  if (known) return known
  const fromName = filename ? path.extname(filename).replace(/^\./, "").toLowerCase() : ""
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName
  const fromMime = mime.split("/")[1]?.replace(/[^a-z0-9]/gi, "").toLowerCase()
  return fromMime || "png"
}

const safeSlug = (value: unknown) => {
  const slug = String(value ?? "").trim()
  return /^[a-z0-9][a-z0-9-]*$/.test(slug) ? slug : undefined
}

const isImagePart = (part: any) =>
  part?.type === "file" &&
  typeof part.mime === "string" &&
  part.mime.startsWith("image/") &&
  typeof part.url === "string" &&
  part.url.startsWith("data:") &&
  part.url.includes(";base64,")

const writeImageFile = (directory: string, name: string, bytes: Buffer) => {
  fs.mkdirSync(directory, { recursive: true })
  let target = path.join(directory, name)
  if (fs.existsSync(target)) {
    const extension = path.extname(name)
    const base = path.basename(name, extension)
    let counter = 2
    while (fs.existsSync(target)) {
      target = path.join(directory, `${base}-${counter}${extension}`)
      counter += 1
    }
  }
  fs.writeFileSync(target, bytes)
  return target
}

const fingerprint = (base: string, filePath: string, bytes: Buffer) => ({
  path: path.relative(base, filePath).split(path.sep).join("/"),
  bytes: bytes.length,
  sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
})


const normalizeLanguage = (value: unknown): "zh" | "en" => {
  const language = String(value ?? "").toLowerCase()
  return language === "en" || language.startsWith("en-") ? "en" : "zh"
}

type ProjectConfig = {
  language: "zh" | "en"
  writerPrompt: string
}

const loadProjectConfig = (projectRoot: string): ProjectConfig => {
  const configPath = path.join(projectRoot, ".aw", "config.json")
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"))
    const writerPrompt =
      typeof config.writer_prompt === "string"
        ? config.writer_prompt
        : typeof config.system_prompt === "string"
          ? config.system_prompt
          : ""
    return {
      language: normalizeLanguage(config.language),
      writerPrompt: writerPrompt.trim(),
    }
  } catch {
    return {
      language: normalizeLanguage(process.env.AW_LANGUAGE ?? DEFAULT_LANGUAGE),
      writerPrompt: "",
    }
  }
}

const readText = (filePath: string) => fs.readFileSync(filePath, "utf8").trim()

export default async ({ directory, client }: { directory?: string; client?: any } = {}) => {
  const projectRoot = directory ?? process.cwd()
  const projectConfig = loadProjectConfig(projectRoot)
  const language = projectConfig.language
  const writerPrompt = projectConfig.writerPrompt
  const localeRoot = path.join(root, "locales", language)
  const skillsRoot = path.join(localeRoot, "skills")
  const shared = path.join(root, "shared").replace(/\\/g, "/")

  const readAgent = (name: string) => readText(path.join(localeRoot, "agents", name))
  const isChinese = language === "zh"
  const appendWriterPrompt = (prompt: string) => {
    if (!writerPrompt) return prompt
    const heading = isChinese
      ? "项目写作系统提示词 writer_prompt（必须遵守，但不得违反 AnyWriter 的不可违反规则）："
      : "Project writer system prompt (writer_prompt; follow it unless it conflicts with AnyWriter non-negotiable rules):"
    return [prompt, "", heading, "```text", writerPrompt, "```"].join("\n")
  }
  const sharedLine = isChinese
    ? `共享参考（按需读取）：${shared}/rules.md、${shared}/lifecycle.md、${shared}/artifact-contracts.md、${shared}/knowledge-status.schema.json、${shared}/task-status.schema.json、${shared}/image-reference-status.schema.json、${shared}/templates/。`
    : `Shared references (read on demand): ${shared}/rules.md, ${shared}/lifecycle.md, ${shared}/artifact-contracts.md, ${shared}/knowledge-status.schema.json, ${shared}/task-status.schema.json, ${shared}/image-reference-status.schema.json, ${shared}/templates/.`

  const directorPrompt = appendWriterPrompt([
    readAgent("aw-director.md"),
    "",
    sharedLine,
    "",
    isChinese
      ? "当前项目的小说数据位于 files/（source、reference、knowledge、work）。缺少目录时执行 /aw-init。使用 Get-FileHash 或 sha256sum 记录文件大小和 SHA-256。默认使用简体中文回复，除非用户要求英文。"
      : "The active project stores novel data under files/ (source, reference, knowledge, work). Scaffold it with /aw-init when it is missing. Register source fingerprints (bytes and SHA-256) using Get-FileHash or sha256sum. Default to English unless the user requests Chinese.",
  ].join("\n"))

  const analystPrompt = appendWriterPrompt([
    readAgent("aw-analyst.md"),
    "",
    isChinese ? `完整规则：${shared}/rules.md。默认用简体中文返回分析结果。` : `Full rule details: ${shared}/rules.md.`,
  ].join("\n"))

  const reviewerPrompt = appendWriterPrompt([
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
  "writer_prompt": "",
  "caption_prompt": ""
}`

  const commands = isChinese
    ? {
        configDescription: "查看或切换 AnyWriter 的语言、写作提示词和 caption 提示词配置。",
        config: `管理 AnyWriter 项目配置。

读取当前项目的 .aw/config.json。如果没有参数，报告当前语言、配置文件路径，以及 writer_prompt 和 caption_prompt 是否已配置；不要主动打印完整提示词。

支持：

- /aw-config lang zh：切换为简体中文
- /aw-config lang en：切换为英文
- /aw-config wp <内容>：设置写作系统提示词 writer_prompt（用于蒸馏、规划、写作、审校和图片参考）
- /aw-config clrwp：清空 writer_prompt
- /aw-config cp <内容>：设置 caption 系统提示词 caption_prompt（用于 aw-caption）
- /aw-config clrcp：清空 caption_prompt

修改语言时，只创建或更新 .aw/config.json，内容为：

{ "version": 1, "language": "zh" 或 "en" }

writer_prompt 追加到写作流程的三个 aw Agent；caption_prompt 由 aw-caption Skill 在运行时读取。参数以 wp 或 cp 开头时，保留其后的全部内容，包括空格；参数为 clrwp 或 clrcp 时清空对应字段；没有提供提示词内容时先询问用户。不要修改小说数据。写入后提醒用户重启 OpenCode，语言资源和 writer_prompt 会在下次启动时加载；caption_prompt 在下次执行 /aw-caption 时生效。`,
        init: `初始化当前项目的 AnyWriter 工作区。不要覆盖已有文件，报告已存在的内容。

创建：

- .aw/config.json，默认内容：

${initProjectConfigJson}

- files/source/（空目录；用户将 UTF-8 TXT 或 Markdown 原文放在这里）
- files/reference/（图片参考；插件把用户上传的图片、参考表和参考状态保存到这里）
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
        byimageDescription: "以用户上传的图片为参考，提取可追溯的视觉参考并生成内容。",
        byimage: `加载并执行 aw-byimage Skill 的图片参考提取或按图生成内容分支。

图片路径、生成要求和输出落点：$ARGUMENTS

没有参数时先确认生成要求。先用 aw_save_images 工具把用户上传的图片保存到 files/reference/<slug>/；图片只作为创作参考，参考表必须经用户批准后才能生成内容，独立草稿标记为非正典。`,
        captionDescription: "对指定文件夹内的图片批量反推 caption，并写入同名 .txt。",
        caption: `加载并执行 aw-caption Skill 的批量图片 caption 生成。

图片文件夹路径和补充要求：$ARGUMENTS

读取 .aw/config.json 的 caption_prompt 作为追加系统提示词。图片只读；参数含 -r 时覆盖已存在的 .txt，否则跳过已存在文件。`,
        review: `加载并执行 aw-review Skill 的独立审校、受控修订或定稿分支。

草稿、任务或操作要求：$ARGUMENTS

不要把独立审校和未经批准的修订合并在同一步。`,
        status: `读取 files/knowledge/status.json、所有存在的 files/work/*/status.json 和 files/reference/*/status.json。

报告：

1. 知识状态、候选版本和批准版本。
2. 活动任务和过期任务。
3. 待处理审批门。
4. 活动草稿、审校和定稿版本。
5. 图片参考、其批准状态和参考草稿。
6. 当前有效的 aw 命令。

如果状态文件不存在，建议执行 /aw-init。不要修改文件。`,
      }
    : {
        configDescription: "Show or switch AnyWriter language, writer prompt, and caption prompt configuration.",
        config: `Manage the AnyWriter project configuration.

Read .aw/config.json in the current project. With no argument, report the current language, config path, and whether writer_prompt and caption_prompt are configured; do not print the full prompts unless explicitly asked.

Supported forms:

- /aw-config lang zh: switch to Simplified Chinese
- /aw-config lang en: switch to English
- /aw-config wp <text>: set writer_prompt, the writing-flow system prompt (distillation, planning, drafting, review, image references)
- /aw-config clrwp: clear writer_prompt
- /aw-config cp <text>: set caption_prompt, the caption system prompt for aw-caption
- /aw-config clrcp: clear caption_prompt

When changing language, create or update only .aw/config.json with:

{ "version": 1, "language": "zh" or "en" }

writer_prompt appends to the three writing-flow aw agents; caption_prompt is read by the aw-caption skill at runtime. When the argument starts with wp or cp, preserve all text after it, including spaces; clrwp and clrcp clear the matching field; ask if no text is provided. Do not modify novel data. After writing, tell the user to restart OpenCode because locale resources and writer_prompt load at startup; caption_prompt applies on the next /aw-caption run.`,
        init: `Scaffold the AnyWriter workspace in the current project. Do not overwrite existing files; report anything that already exists.

Create:

- .aw/config.json with the default configuration:

${initProjectConfigJson}

- files/source/ (empty; the user places UTF-8 TXT or Markdown source files here)
- files/reference/ (image references; the plugin saves uploaded images, reference sheets, and reference status here)
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
        byimageDescription: "Extract traceable visual references from uploaded images and generate content from them.",
        byimage: `Load and execute the Image Reference Extraction Branch or the Image-Referenced Generation Branch of the aw-byimage skill.

Image paths, generation requirement, and output target: $ARGUMENTS

With no argument, confirm the requirement first. Save the uploaded images into files/reference/<slug>/ with the aw_save_images tool before analysis. Images are creative references only; generation starts only after the user approves the reference sheet, and standalone drafts stay non-canon.`,
        captionDescription: "Generate captions for every image in a folder and write them to same-name .txt files.",
        caption: `Load and execute the aw-caption skill for batch image captioning.

Image folder path and additional requirement: $ARGUMENTS

Read caption_prompt from .aw/config.json as the appended system prompt. Treat images as read-only; with -r overwrite existing .txt files, otherwise skip existing files.`,
        review: `Load and execute the appropriate aw-review branch: independent review, controlled revision, or finalization.

Draft, task, or instruction: $ARGUMENTS

Never combine independent review and unapproved revision in one step.`,
        status: `Read files/knowledge/status.json, every files/work/*/status.json, and every files/reference/*/status.json that exists.

Report:

1. Knowledge state, candidate and approved versions.
2. Active and stale tasks.
3. Pending approval gates.
4. Active draft, review, and final versions.
5. Image references, their approval state, and reference drafts.
6. The exact aw commands that are currently valid.

If status files are missing, suggest /aw-init. Do not modify any file.`,
      }
    

  const saveImagesTool = {
    description: isChinese
      ? "把当前会话中用户上传的图片保存到 AnyWriter 项目目录 files/reference/<slug>/，返回相对路径、字节数和 SHA-256。也可传入本地图片路径进行复制。"
      : "Save user-uploaded images from the current session into the AnyWriter project at files/reference/<slug>/ and return relative paths, bytes, and SHA-256. Local image paths may be passed instead.",
    args: {
      slug: {
        type: "string",
        description: isChinese
          ? "files/reference/ 下的目标目录名，使用小写字母、数字和连字符。"
          : "Target directory name under files/reference/, using lowercase letters, digits, and hyphens.",
      },
      message_id: {
        type: "string",
        description: isChinese
          ? "可选：包含图片的用户消息 ID；省略时查找最近一条带上传图片的用户消息。"
          : "Optional: user message ID that contains the images; defaults to the most recent user message with uploaded images.",
      },
      paths: {
        type: "array",
        items: { type: "string" },
        description: isChinese
          ? "可选：本地图片路径列表；提供时直接复制这些文件，不读取会话上传。"
          : "Optional: local image paths; when provided, these files are copied instead of reading session uploads.",
      },
    },
    async execute(
      args: { slug?: string; message_id?: string; paths?: string[] },
      context: { directory?: string; sessionID?: string; messageID?: string },
    ) {
      const slug = safeSlug(args?.slug)
      if (!slug) {
        return isChinese ? "错误：slug 必须匹配 ^[a-z0-9][a-z0-9-]*$。" : "Error: slug must match ^[a-z0-9][a-z0-9-]*$."
      }
      const projectRoot = context?.directory ?? directory ?? process.cwd()
      const targetDir = path.join(projectRoot, "files", "reference", slug)
      const saved: Array<{ path: string; bytes: number; sha256: string }> = []

      const explicitPaths = Array.isArray(args?.paths)
        ? args.paths.filter((item) => typeof item === "string" && item.trim() !== "")
        : []
      if (explicitPaths.length > 0) {
        for (const input of explicitPaths) {
          const source = path.resolve(projectRoot, input)
          try {
            if (!fs.statSync(source).isFile()) continue
            const bytes = fs.readFileSync(source)
            const target = writeImageFile(targetDir, path.basename(source), bytes)
            saved.push(fingerprint(projectRoot, target, bytes))
          } catch {
            // Unreadable paths are reported below when nothing was saved.
          }
        }
        if (saved.length === 0) {
          return isChinese ? `未找到可读取的图片文件：${explicitPaths.join(", ")}` : `No readable image file found: ${explicitPaths.join(", ")}`
        }
        return JSON.stringify({ slug, saved }, null, 2)
      }

      const sessionID = context?.sessionID
      if (!client?.session || !sessionID) {
        return isChinese
          ? "aw_save_images 不可用：插件未连接到会话。请让用户把图片保存到 files/reference/<slug>/ 后重试。"
          : "aw_save_images is unavailable: the plugin is not connected to a session. Ask the user to save the image under files/reference/<slug>/ and retry."
      }

      const fetchMessage = async (messageID: string) => {
        const response = await client.session.message({ path: { id: sessionID, messageID } })
        return response?.data ?? response
      }
      const imagesOf = (message: any): any[] =>
        message?.info?.role === "user" ? (message.parts ?? []).filter(isImagePart) : []

      const findUploads = async (): Promise<{ message: any; images: any[] } | undefined> => {
        const explicit = typeof args?.message_id === "string" ? args.message_id.trim() : ""
        const start = explicit || (typeof context?.messageID === "string" ? context.messageID : "")
        if (start) {
          try {
            const current = await fetchMessage(start)
            const parentID =
              current?.info?.role === "assistant"
                ? current.info.parentID
                : current?.info?.role === "user"
                  ? current.info.id
                  : undefined
            if (parentID) {
              const parent = await fetchMessage(parentID)
              const images = imagesOf(parent)
              if (images.length > 0) return { message: parent, images }
            }
          } catch {
            // Fall through to the session scan.
          }
        }
        const response = await client.session.messages({ path: { id: sessionID } })
        const payload = response?.data ?? response
        const candidates: any[] = Array.isArray(payload) ? [...payload] : payload?.parts ? [payload] : []
        for (const message of candidates.reverse()) {
          const images = imagesOf(message)
          if (images.length > 0) return { message, images }
        }
        return undefined
      }

      let found: { message: any; images: any[] } | undefined
      try {
        found = await findUploads()
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return isChinese ? `读取会话消息失败：${message}` : `Failed to read session messages: ${message}`
      }
      if (!found) {
        return isChinese
          ? "当前会话中未找到用户上传的图片。请用户重新上传图片，或提供图片的本地路径。"
          : "No user-uploaded image found in this session. Ask the user to upload the image again or provide a local file path."
      }

      const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(".", "")
      for (const [index, part] of found.images.entries()) {
        const base64 = part.url.slice(part.url.indexOf(";base64,") + ";base64,".length)
        const bytes = Buffer.from(base64, "base64")
        if (bytes.length === 0) continue
        const name = `${stamp}-${String(index + 1).padStart(2, "0")}.${extensionFor(part.mime, part.filename)}`
        const target = writeImageFile(targetDir, name, bytes)
        saved.push(fingerprint(projectRoot, target, bytes))
      }
      if (saved.length === 0) {
        return isChinese ? "上传图片为空或无法解码。" : "The uploaded images are empty or could not be decoded."
      }
      return JSON.stringify({ slug, message_id: found.message.info?.id ?? null, saved }, null, 2)
    },
  }

  return {
    tool: {
      aw_save_images: saveImagesTool,
    },
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
          skill: { "*": "deny", "aw-distill": "allow", "aw-task": "allow", "aw-write": "allow", "aw-review": "allow", "aw-byimage": "allow", "aw-caption": "allow" },
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
      cfg.command["aw-byimage"] = { description: commands.byimageDescription, agent: "aw-director", template: commands.byimage }
      cfg.command["aw-caption"] = { description: commands.captionDescription, agent: "aw-director", template: commands.caption }
      cfg.command["aw-review"] = { description: isChinese ? "独立审校、应用修订意见或定稿。" : "Review, revise, or finalize an approved draft.", agent: "aw-director", template: commands.review }
      cfg.command["aw-status"] = { description: isChinese ? "查看知识、任务、审批门和下一步操作。" : "Show knowledge state, tasks, approval gates, and next actions.", agent: "aw-director", template: commands.status }
    },
  }
}
