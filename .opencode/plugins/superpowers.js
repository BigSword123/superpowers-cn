/**
 * Superpowers 中文版插件 for OpenCode.ai
 *
 * 通过系统提示转换注入 superpowers 引导上下文。
 * 通过 config 钩子自动注册技能目录（无需 symlink）。
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 简单的 frontmatter 提取（避免引导时依赖 skills-core）
const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = {};

  for (const line of frontmatterStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: body };
};

// 规范化路径：去除空白、展开 ~、解析为绝对路径
const normalizePath = (p, homeDir) => {
  if (!p || typeof p !== 'string') return null;
  let normalized = p.trim();
  if (!normalized) return null;
  if (normalized.startsWith('~/')) {
    normalized = path.join(homeDir, normalized.slice(2));
  } else if (normalized === '~') {
    normalized = homeDir;
  }
  return path.resolve(normalized);
};

// 模块级缓存用于引导内容。
// SKILL.md 在会话期间不会改变，因此只需读取和解析一次，
// 避免每个智能体步骤都重复执行 fs.existsSync + fs.readFileSync + 正则匹配工作。
// 详见 #1202 的完整分析。
let _bootstrapCache = undefined; // undefined = 尚未加载, null = 文件缺失

export const SuperpowersPlugin = async ({ client, directory }) => {
  const homeDir = os.homedir();
  const superpowersSkillsDir = path.resolve(__dirname, '../../skills');
  const envConfigDir = normalizePath(process.env.OPENCODE_CONFIG_DIR, homeDir);
  const configDir = envConfigDir || path.join(homeDir, '.config/opencode');

  // 生成引导内容的辅助函数（首次调用后缓存）
  const getBootstrapContent = () => {
    // 后续调用返回缓存结果
    if (_bootstrapCache !== undefined) return _bootstrapCache;

    // 尝试加载 using-superpowers 技能
    const skillPath = path.join(superpowersSkillsDir, 'using-superpowers', 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      _bootstrapCache = null;
      return null;
    }

    const fullContent = fs.readFileSync(skillPath, 'utf8');
    const { content } = extractAndStripFrontmatter(fullContent);

    const toolMapping = `**OpenCode 工具映射:**
当技能引用你没有的工具时，使用 OpenCode 等效替代：
- \`TodoWrite\` → \`todowrite\`
- \`Task\` 工具配合子代理 → 使用 OpenCode 的子代理系统 (@mention)
- \`Skill\` 工具 → OpenCode 原生 \`skill\` 工具
- \`Read\`、\`Write\`、\`Edit\`、\`Bash\` → 你的原生工具

使用 OpenCode 原生 \`skill\` 工具列出和加载技能。`;

    _bootstrapCache = `<EXTREMELY_IMPORTANT>
你拥有超能力（superpowers）。

**重要提醒：using-superpowers 技能内容已包含在下方。它已经加载完毕——你正在遵循它。请勿再次使用 skill 工具加载 "using-superpowers"——那将是多余的。**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`;

    return _bootstrapCache;
  };

  return {
    // 将技能路径注入运行时配置，使 OpenCode 能够发现 superpowers 技能，
    // 无需手动创建 symlink 或编辑配置文件。
    // 这之所以有效，是因为 Config.get() 返回的是缓存的单例——此处
    // 的修改在后续惰性发现技能时是可见的。
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(superpowersSkillsDir)) {
        config.skills.paths.push(superpowersSkillsDir);
      }
    },

    // 将引导内容注入每个会话的首条用户消息。
    // 使用用户消息而非系统消息可以避免：
    //   1. 每轮重复系统消息导致的令牌膨胀 (#750)
    //   2. 多条系统消息导致 Qwen 和其他模型出错 (#894)
    //
    // 钩子在每个智能体步骤（而非每轮）都会触发，因为
    // opencode 的 prompt.ts 每次步骤都从数据库重新加载消息。
    // 新的消息数组可能需要再次注入，因此 getBootstrapContent() 不能
    // 进行重复的磁盘操作。
    'experimental.chat.messages.transform': async (_input, output) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap || !output.messages.length) return;
      const firstUser = output.messages.find(m => m.info.role === 'user');
      if (!firstUser || !firstUser.parts.length) return;

      // 守卫：如果首条用户消息已包含引导内容，则跳过。
      // 防止 OpenCode 将已转换的内存消息数组再次通过钩子传递时重复注入。
      if (firstUser.parts.some(p => p.type === 'text' && p.text.includes('EXTREMELY_IMPORTANT'))) return;

      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    }
  };
};
