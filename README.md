# 数字化赋能小程序

> 标准化 + 条码（GS1）双轮驱动，帮助中小企业迈出数字化转型第一步。

## 项目简介

本项目是"平顶山市客货邮融合"体系的产品化落地之一，面向中小企业、创业者和政府合作方，提供：

- **专家名片**：标准化评审专家、创业导师、条码赋能专家介绍。
- **数字赋能**：标准化数字化赋能、条码数字化赋能、数字交通、数字营商等资源聚合。
- **博士团队**：4 个智能体（条码师培训、营商数擎、满意标尺、创业问答）即时咨询。
- **咨询沉淀**：在线填写、飞书表单、腾讯文档三通道，结构化沉淀到飞书多维表格。
- **开放接口**：预留 `openApi` 云函数标准化共享接口，便于官网、政务系统等外部平台对接。

## 技术栈

- 原生微信小程序
- 微信云开发（CloudBase）
- 4 个云函数：`agentChat`、`agentApi`、`submitConsult`、`agentConfig`

## 快速开始

1. 克隆仓库：
   ```bash
   git clone https://github.com/ylyhyue/digital-empowerment.git
   cd digital-empowerment
   ```
2. 使用微信开发者工具导入项目，选择 `digital-empowerment` 目录。
3. 在开发者工具中填入你的 AppID 并启用云开发。
4. 部署云函数（右键 `cloudfunctions/` 下的目录 → 创建并部署：云端安装依赖）。

## 环境变量配置（密钥管理）

> 仓库内**不包含任何真实密钥**。所有敏感凭证通过环境变量注入，详见 `.env.example`。

| 云函数 | 变量名 | 说明 |
|---|---|---|
| `submitConsult` | `FEISHU_APP_ID` / `FEISHU_APP_SECRET` / `FEISHU_APP_TOKEN` / `FEISHU_TABLE_ID` | 飞书应用与多维表格凭证 |
| `agentApi` / `agentChat` | `LLM_API_KEY` / `LLM_MODEL` / `LLM_API_URL` | LLM（DeepSeek 等）调用凭证与端点 |

**生产环境（云端）**：在微信云开发控制台 → 对应云函数 →「配置 → 环境变量」中逐个添加，重新部署生效。

**本地调试**：将各云函数目录下的 `secrets.local.example.js` 复制为 `secrets.local.js` 并填入真实值（该文件已被 `.gitignore` 忽略，不会提交）。

> 若密钥缺失，云函数会返回明确的 `MISSING_*` 错误而非静默失败，便于排查。

## 安全提示

- 之前版本曾将飞书 Secret 与 DeepSeek Key 硬编码在代码中，**已被 GitHub Secret Scanning 拦截并清除历史**。建议立即到飞书开放平台与 DeepSeek 控制台**轮换这两个密钥**，旧值视为已泄露。
- 上线前确认：仓库内无任何真实密钥；`.env.example` 与 `secrets.local.example.js` 仅为占位。

## 目录结构

```
digital-empowerment/
├── miniprogram/          # 小程序前端
│   ├── pages/            # 页面
│   ├── app.js/app.json/app.wxss
│   └── sitemap.json
├── cloudfunctions/       # 云函数
│   ├── agentChat/        # 智能体对话 LLM
│   ├── agentApi/         # 多智能体网关
│   ├── submitConsult/    # 咨询提交到飞书
│   └── agentConfig/      # 智能体开关与管理员
├── docs/                 # 设计文档
└── project.config.json   # 微信开发者工具配置
```

## 注意事项

- 所有敏感凭证均已改为环境变量注入（见上文"环境变量配置"），仓库内不含真实密钥。
- 外部链接在微信内打开受"业务域名"限制，未配置域名时会自动降级为"复制链接到浏览器打开"。

## 开源协议

MIT

## 关联项目

- [客货邮融合知识库](https://github.com/ylyhyue/kehuoyou-knowledge)
