// agentChat —— 智能体对话云函数（接 LLM，返回即时回答）
// 适配 Node 16/18：不用 console.log（避免旧 runtime toString bug），用原生 https
function pick(v, d) { return (v == null || v === '') ? d : v; }

// 凭证加载：优先云端环境变量（生产），回退本地 gitignored 文件（本地调试）
// 仓库内不包含任何真实密钥；配置方式见 .env.example 与 README
function loadLocalSecrets() {
  try { return require('./secrets.local'); } catch (e) { return {}; }
}
const _local = loadLocalSecrets();

// ============ 各智能体系统提示词（精简版，受 3s timeout 约束；用户可追问展开） ============
const SYSTEM_PROMPTS = {
  '条码师培训 Bot': '你是条码师培训 Bot，基于团体标准 T/CABC 18.1-2025《条码师岗位能力要求》辅导条码师（初/中/高级）岗位能力、考证路径与条码应用（UDI/DPP/GS1）。回答简洁专业，分点列出；不确定时如实说明并建议联系线下专家。',
  '营商数擎 DataBE': '你是营商数擎 DataBE，专注数据要素赋能营商环境。辅导营商环境类赛事（数据要素赛道）申报材料撰写、案例包装；解读评价指标体系、政务数据、数据资产化路径。回答分点列出，可落地。',
  '满意标尺 SatBE': '你是满意标尺 SatBE，专注企业满意度测评与营商环境满意度赛道。设计问卷与指标权重、讲解数据分析方法、辅导参赛材料、提供以评促改建议。回答分点列出，可操作。',
  '创业问答 Bot': '你是创业问答 Bot，面向创业者答疑。解答创业政策、公司注册、补贴申报等通用问题；介绍标准化与条码赋能如何助小微企业降本增效；必要时引导转线下专家。亲切务实。',
  '通用咨询': '你是数字化赋能智能助手，专注创业、标准化、条码赋能相关通用咨询。回答专业、务实、简明。'
};

exports.main = async (event) => {
  const agent = pick(event && event.agent, '通用咨询');
  const messages = Array.isArray(event && event.messages) ? event.messages : [];
  const sysPrompt = SYSTEM_PROMPTS[agent] || SYSTEM_PROMPTS['通用咨询'];

  // ============ LLM 配置（环境变量优先，回退本地 gitignored 文件） ============
  const apiKey = process.env.LLM_API_KEY || _local.LLM_API_KEY || '';
  const model = pick(process.env.LLM_MODEL, _local.LLM_MODEL || 'deepseek-chat');
  const apiUrl = pick(process.env.LLM_API_URL, _local.LLM_API_URL || 'https://api.deepseek.com/chat/completions');

  if (!apiKey) { return { ok: false, msg: 'MISSING_LLM_API_KEY' }; }

  // 多轮 context 截断：只保留最近 4 条（user/assistant 各 2 轮），避免 prompt 增长超时
  const recent = messages.filter(m => m && (m.role === 'user' || m.role === 'assistant')).slice(-4).map(m => ({ role: m.role, content: String(m.content) }));

  const payload = {
    model: model,
    messages: [{ role: 'system', content: sysPrompt }].concat(recent),
    temperature: 0.3,
    max_tokens: 100,
    stream: false
  };

  // ============ 调用 LLM ============
  const result = await new Promise(function (resolve) {
    const https = require('https');
    let u;
    try { u = new URL(apiUrl); } catch (e) { resolve({ status: 0, body: 'BAD_URL:' + apiUrl }); return; }
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: (u.pathname || '/') + (u.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': 'Bearer ' + apiKey
      }
    }, function (res) {
      let chunks = '';
      res.on('data', function (d) { chunks += d; });
      res.on('end', function () { resolve({ status: res.statusCode, body: chunks }); });
    });
    req.on('error', function (e) { resolve({ status: 0, body: 'NET_ERR:' + e.message }); });
    req.setTimeout(25000, function () { req.destroy(new Error('TIMEOUT')); });
    req.write(body);
    req.end();
  });

  if (result.status !== 200) {
    return { ok: false, msg: 'LLM_HTTP_' + result.status, detail: result.body ? result.body.slice(0, 300) : '' };
  }
  let json;
  try { json = JSON.parse(result.body); } catch (e) { return { ok: false, msg: 'PARSE_ERR', detail: (result.body || '').slice(0, 300) }; }
  if (!json.choices || !json.choices[0] || !json.choices[0].message || !json.choices[0].message.content) {
    return { ok: false, msg: 'EMPTY', detail: JSON.stringify(json).slice(0, 300) };
  }
  const answer = json.choices[0].message.content;
  return { ok: true, answer: answer };
};
