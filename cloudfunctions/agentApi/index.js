// agentApi —— 多智能体网关（同时支持小程序 callFunction 与 H5 HTTP 触发）
// 适配 Node 16/18：原生 https，无 console.log，带 CORS 头
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

// 统一响应构造：isHttp 时返回 APIGW 风格（含 CORS），否则返回 callFunction 风格
function buildResp(statusCode, bodyObj, isHttp) {
  if (!isHttp) return bodyObj;
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(bodyObj)
  };
}

function callLLM(agent, messages) {
  const sysPrompt = SYSTEM_PROMPTS[agent] || SYSTEM_PROMPTS['通用咨询'];
  const apiKey = process.env.LLM_API_KEY || _local.LLM_API_KEY || '';
  const model = pick(process.env.LLM_MODEL, _local.LLM_MODEL || 'deepseek-chat');
  const apiUrl = pick(process.env.LLM_API_URL, _local.LLM_API_URL || 'https://api.deepseek.com/chat/completions');

  if (!apiKey) { return { status: 401, body: 'MISSING_LLM_API_KEY' }; }

  const recent = messages.filter(m => m && (m.role === 'user' || m.role === 'assistant')).slice(-4)
    .map(m => ({ role: m.role, content: String(m.content) }));
  const payload = {
    model: model,
    messages: [{ role: 'system', content: sysPrompt }].concat(recent),
    temperature: 0.3,
    max_tokens: 100,
    stream: false
  };

  return new Promise(function (resolve) {
    const https = require('https');
    let u;
    try { u = new URL(apiUrl); } catch (e) { resolve({ status: 0, body: 'BAD_URL:' + apiUrl }); return; }
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: u.hostname, port: 443,
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
    req.setTimeout(2800, function () { req.destroy(new Error('TIMEOUT')); });
    req.write(body);
    req.end();
  });
}

exports.main = async (event) => {
  // 判断调用方式：HTTP 触发 vs callFunction
  const isHttp = !!(event && (event.httpMethod || event.requestContext || (event.headers && event.headers.host)));

  if (isHttp) {
    // CORS 预检
    if (event.httpMethod === 'OPTIONS') return buildResp(204, {}, true);
    // 解析参数：GET ?agent=&q= 或 POST {agent, messages/q}
    const qp = (event.queryStringParameters || event.queryString || {});
    let agent = pick(qp.agent, '通用咨询');
    let messages = [];
    let rawBody = event.body;
    if (event.isBase64Encoded && rawBody) rawBody = Buffer.from(rawBody, 'base64').toString('utf8');
    if (rawBody) {
      try {
        const b = JSON.parse(rawBody);
        if (b.agent) agent = b.agent;
        if (Array.isArray(b.messages)) messages = b.messages;
        else if (b.q) messages = [{ role: 'user', content: String(b.q) }];
      } catch (e) { /* ignore */ }
    } else if (qp.q) {
      messages = [{ role: 'user', content: String(qp.q) }];
    }
    return handle(agent, messages, true);
  }

  // callFunction 调用
  const agent = pick(event && event.agent, '通用咨询');
  const messages = Array.isArray(event && event.messages) ? event.messages : [];
  return handle(agent, messages, false);
};

async function handle(agent, messages, isHttp) {
  const r = await callLLM(agent, messages);
  if (r.status !== 200) {
    return buildResp(200, { ok: false, msg: 'LLM_HTTP_' + r.status, detail: (r.body || '').slice(0, 300) }, isHttp);
  }
  let json;
  try { json = JSON.parse(r.body); } catch (e) { return buildResp(200, { ok: false, msg: 'PARSE_ERR', detail: (r.body || '').slice(0, 300) }, isHttp); }
  if (!json.choices || !json.choices[0] || !json.choices[0].message || !json.choices[0].message.content) {
    return buildResp(200, { ok: false, msg: 'EMPTY', detail: JSON.stringify(json).slice(0, 300) }, isHttp);
  }
  return buildResp(200, { ok: true, answer: json.choices[0].message.content }, isHttp);
}
