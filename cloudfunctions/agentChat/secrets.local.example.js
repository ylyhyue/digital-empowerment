// 本地调试用：复制本文件为同目录下的 secrets.local.js（已被 .gitignore 忽略，不会提交）
// 生产环境请在微信云开发控制台「云函数 → 配置 → 环境变量」设置，勿使用此文件
module.exports = {
  LLM_API_KEY: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  LLM_MODEL: 'deepseek-chat',
  LLM_API_URL: 'https://api.deepseek.com/chat/completions'
};
