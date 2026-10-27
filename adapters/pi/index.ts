import path from "node:path"
import { Type } from "@earendil-works/pi-ai"
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import {
  commandsFor,
  directorPrompt,
  loadProjectConfig,
  packageRoot,
  safeSlug,
  saveImagePaths,
  skillsRoot,
} from "../shared/runtime"

const replaceArguments = (template: string, args: string) => template.replaceAll("$ARGUMENTS", args)

export default function anywriter(pi: ExtensionAPI) {
  pi.on("resources_discover", (event) => ({
    skillPaths: [skillsRoot(loadProjectConfig(event.cwd).language)],
  }))

  pi.on("before_agent_start", (event) => {
    const config = loadProjectConfig(event.cwd)
    const language = config.language
    return {
      systemPrompt: [
        event.systemPrompt,
        directorPrompt(language, config),
        `Shared AnyWriter references: ${path.join(packageRoot, "shared").replace(/\\/g, "/")}`,
      ].join("\n\n"),
    }
  })

  for (const command of commandsFor(loadProjectConfig(process.cwd()).language)) {
    pi.registerCommand(command.name, {
      description: command.description,
      handler: async (args, ctx) => {
        const current = commandsFor(loadProjectConfig(ctx.cwd).language).find((item) => item.name === command.name) ?? command
        pi.sendUserMessage(replaceArguments(current.template, args), { expandPromptTemplates: true })
      },
    })
  }

  pi.registerTool({
    name: "aw_save_images",
    label: "Save AnyWriter images",
    description: "Copy local images into files/reference/<slug>/ and return relative paths, byte counts, and SHA-256.",
    parameters: Type.Object({
      slug: Type.String({ description: "Lowercase slug under files/reference/." }),
      paths: Type.Array(Type.String(), { description: "Project-relative or absolute image paths." }),
    }),
    async execute(_toolCallId: string, input: any, _signal: AbortSignal, _onUpdate: unknown, ctx: { cwd: string }) {
      const slug = safeSlug(input?.slug)
      if (!slug) {
        return { content: [{ type: "text", text: "Error: slug must match ^[a-z0-9][a-z0-9-]*$." }], details: {} }
      }
      const result = saveImagePaths(ctx.cwd, slug, input?.paths)
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], details: result }
    },
  })

  pi.registerCommand("aw-reload", {
    description: "Reload AnyWriter resources after changing .aw/config.json",
    handler: async (_args, ctx) => {
      await ctx.reload()
      ctx.ui.notify("AnyWriter resources reloaded.", "info")
    },
  })
}
