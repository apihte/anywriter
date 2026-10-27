import { Plugin, Skill } from "@opencode/plugin"
import legacyPlugin from "../opencode/opencode.plugin"
import fs from "node:fs"
import path from "node:path"
import {
  analystPrompt,
  commandsFor,
  directorPrompt,
  loadProjectConfig,
  packageRoot,
  reviewerPrompt,
  safeSlug,
  saveImagePaths,
  skillsRoot,
} from "../shared/runtime"

const replaceArguments = (template: string, args: string) => template.replaceAll("$ARGUMENTS", args)

const v2Plugin = Plugin.define({
  id: "anywriter",
  async setup(ctx) {
    const projectRoot = ctx.location.directory
    const projectConfig = loadProjectConfig(projectRoot)
    const language = projectConfig.language
    const shared = path.join(packageRoot, "shared").replace(/\\/g, "/")

    await ctx.skill.transform((editor) => {
      for (const name of ["aw-distill", "aw-task", "aw-write", "aw-review", "aw-byimage", "aw-caption"]) {
        const contentPath = path.join(skillsRoot(language), name, "SKILL.md")
        const content = requireText(contentPath)
        editor.add({
          id: Skill.ID.make(name),
          name: Skill.Name.make(name),
          description: extractDescription(content),
          path: Skill.Info.fields.path.make(contentPath),
          content,
        } as any)
      }
    })

    await ctx.command.transform((editor) => {
      for (const command of commandsFor(language)) {
        editor.add({
          name: command.name,
          description: command.description,
          execute: async ({ sessionID, prompt, delivery }: any) => {
            await ctx.session.prompt({
              ...prompt,
              sessionID,
              text: replaceArguments(command.template, prompt?.text ?? ""),
              delivery,
            })
          },
        })
      }
    })

    await ctx.tool.transform((editor) => {
      editor.add({
        name: "aw_save_images",
        description: language === "zh"
          ? "把本地图片复制到 files/reference/<slug>/，返回相对路径、字节数和 SHA-256。"
          : "Copy local images into files/reference/<slug>/ and return relative paths, byte counts, and SHA-256.",
        input: {
          type: "object",
          properties: {
            slug: { type: "string", description: "Lowercase slug under files/reference/." },
            paths: { type: "array", items: { type: "string" }, description: "Project-relative or absolute image paths." },
          },
          required: ["slug", "paths"],
          additionalProperties: false,
        },
        async execute(input: any) {
          const slug = safeSlug(input?.slug)
          if (!slug) return { content: "Error: slug must match ^[a-z0-9][a-z0-9-]*$." }
          const result = saveImagePaths(projectRoot, slug, input?.paths)
          return { content: JSON.stringify(result, null, 2) }
        },
      } as any)
    })

    await ctx.agent.transform((editor) => {
      const director = editor.get("build")
      if (director) {
        editor.update("build", (agent: any) => {
          agent.description = language === "zh" ? "协调 AnyWriter 小说工作流。" : "Coordinates the AnyWriter writing workflow."
          agent.system = directorPrompt(language, projectConfig)
        })
      }
      const analyst = editor.get("plan")
      if (analyst) editor.update("plan", (agent: any) => { agent.description = "AnyWriter evidence analyst"; agent.system = analystPrompt(language, projectConfig) })
      const reviewer = editor.get("review")
      if (reviewer) editor.update("review", (agent: any) => { agent.description = "AnyWriter independent reviewer"; agent.system = reviewerPrompt(language, projectConfig) })

      // V2 does not allow creating subagents with the same shape as V1 config entries;
      // keep the built-in primary agents intact when a host does not expose them.
      if (!editor.get("aw-director")) editor.add({
        name: "aw-director",
        description: language === "zh" ? "负责 AnyWriter 全流程。" : "Coordinates the AnyWriter lifecycle.",
        system: directorPrompt(language, projectConfig),
      } as any)
      if (!editor.get("aw-analyst")) editor.add({
        name: "aw-analyst",
        description: "AnyWriter evidence analyst",
        system: analystPrompt(language, projectConfig),
      } as any)
      if (!editor.get("aw-reviewer")) editor.add({
        name: "aw-reviewer",
        description: "AnyWriter independent reviewer",
        system: reviewerPrompt(language, projectConfig),
      } as any)
    })

    // Keep the shared path discoverable in diagnostics and make the project prompt available to commands.
    await ctx.storage.set("anywriter", { language, shared })
  },
})

// OpenCode 1.18.29+ accepts an object entrypoint with a `server` implementation.
// Keeping both entrypoints at the package root lets one npm package serve OpenCode 1 and 2.
export default { ...v2Plugin, server: legacyPlugin }

const requireText = (filePath: string) => {
  // Avoid importing a second runtime abstraction into the plugin's public entrypoint.
  return fs.readFileSync(filePath, "utf8").trim()
}

const extractDescription = (content: string) => content.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? "AnyWriter workflow skill"
