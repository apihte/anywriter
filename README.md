# AnyWriter Plugin

AnyWriter 是一个面向小说蒸馏、改编、续写、审校和定稿的 OpenCode 插件。插件提供中英文双语资源、项目级系统提示词和 `aw-*` 命令。

平台适配器统一放在 `adapters/`，共享资源位于根目录 `locales/` 和 `shared/`。

## 功能

- `aw-distill`：从原文提取人物、世界观、情节、时间线、伏笔和风格。
- `aw-task`：规划剧情修改、扩展、续写和重写任务。
- `aw-write`：按场景、章节或自定义范围生成正文。
- `aw-review`：独立审校、受控修订和定稿。
- `aw-config`：切换语言、设置或清理项目级系统提示词。
- `aw-status`：查看当前知识库和创作任务状态。

## 安装方式

### npm

发布后，在 OpenCode 全局配置中加入：

```json
{
  "plugin": ["anywriter"]
}
```

### GitHub 源码

```bash
git clone <repository-url> ~/.config/opencode/plugins/anywriter
```

然后配置本地入口：

```json
{
  "plugin": [
    "file:///绝对路径/anywriter/adapters/opencode/opencode.plugin.ts"
  ]
}
```

安装或更新插件后重启 OpenCode。

## 项目使用

在任意项目目录中启动 OpenCode：

```text
/aw-init
```

插件会创建：

```text
.aw/
└─ config.json
files/
├─ source/
├─ knowledge/
└─ work/
```

将 TXT 或 Markdown 原文放入 `files/source/`，然后按流程执行：

```text
/aw-distill 全文
/aw-task <创作要求>
/aw-write <场景|章节|自定义范围>
/aw-review <草稿>
/aw-status
```

## 项目配置

`.aw/config.json` 示例：

```json
{
  "version": 1,
  "language": "zh",
  "system_prompt": "本项目使用克制、冷峻的叙事风格。"
}
```

命令：

```text
/aw-config lang zh
/aw-config lang en
/aw-config sp <项目级系统提示词>
/aw-config clrsp
```

没有项目配置时默认使用简体中文。修改配置后重启 OpenCode。

## 开发与发布

检查 npm 包内容：

```bash
npm pack --dry-run
```

发布新版本：

```bash
npm version patch
npm publish
```

不要将小说原文、`files/` 测试数据、`.aw/` 项目配置或任何密钥提交到仓库。
