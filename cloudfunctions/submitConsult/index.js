// 简化版 v4：适配 Node 18，去掉任何 console.log（避免触发 runtime toString bug）
// 凭证加载：优先云端环境变量（生产），回退本地 gitignored 文件（本地调试）
// 仓库内不包含任何真实密钥；配置方式见 .env.example 与 README
function pick(v, d) { return (v == null || v === '') ? d : v; }

function loadLocalSecrets() {
  try { return require('./secrets.local'); } catch (e) { return {}; }
}
const _local = loadLocalSecrets();

exports.main = async (event) => {
  const APP_ID = process.env.FEISHU_APP_ID || _local.FEISHU_APP_ID || '';
  const APP_SECRET = process.env.FEISHU_APP_SECRET || _local.FEISHU_APP_SECRET || '';
  const APP_TOKEN = process.env.FEISHU_APP_TOKEN || _local.FEISHU_APP_TOKEN || '';
  const TABLE_ID = process.env.FEISHU_TABLE_ID || _local.FEISHU_TABLE_ID || 'tblEGBVyDi8mSbM8';

  if (!APP_ID || !APP_SECRET || !APP_TOKEN) {
    return {
      ok: false, stage: 'config', error: 'MISSING_FEISHU_CREDENTIALS',
      hint: '请在云函数环境变量（生产）或 cloudfunctions/submitConsult/secrets.local.js（本地调试）配置 FEISHU_APP_ID / FEISHU_APP_SECRET / FEISHU_APP_TOKEN'
    };
  }

  const fields = {
    '咨询渠道': '小程序-在线填写',
    '智能体': pick(event && event.agent, '通用咨询'),
    '称呼': pick(event && event.name, ''),
    '联系方式': pick(event && event.contact, ''),
    '问题描述': pick(event && event.question, ''),
    '提交时间': Date.now()
  };

  // ============ 阶段 B：获取 tenant_access_token ============
  const tokenResult = await new Promise(function (resolve) {
    const https = require('https');
    const body = JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET });
    const req = https.request({
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) }
    }, function (res) {
      let chunks = '';
      res.on('data', function (d) { chunks += d; });
      res.on('end', function () { resolve({ status: res.statusCode, body: chunks }); });
    });
    req.on('error', function (e) { resolve({ status: 0, body: 'NET_ERR:' + e.message }); });
    req.setTimeout(10000, function () { req.destroy(new Error('TIMEOUT')); });
    req.write(body);
    req.end();
  });

  if (tokenResult.status !== 200) {
    return { ok: false, stage: 'B-status', status: tokenResult.status };
  }
  const tokenJson = JSON.parse(tokenResult.body);
  if (!tokenJson || tokenJson.code !== 0 || !tokenJson.tenant_access_token) {
    return { ok: false, stage: 'B-code', code: tokenJson && tokenJson.code, msg: tokenJson && tokenJson.msg };
  }
  const tenantToken = tokenJson.tenant_access_token;

  // ============ 阶段 C：写入多维表格 ============
  const writeResult = await new Promise(function (resolve) {
    const https = require('https');
    const body = JSON.stringify({ fields: fields });
    const req = https.request({
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/bitable/v1/apps/' + APP_TOKEN + '/tables/' + TABLE_ID + '/records',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': 'Bearer ' + tenantToken
      }
    }, function (res) {
      let chunks = '';
      res.on('data', function (d) { chunks += d; });
      res.on('end', function () { resolve({ status: res.statusCode, body: chunks }); });
    });
    req.on('error', function (e) { resolve({ status: 0, body: 'NET_ERR:' + e.message }); });
    req.setTimeout(10000, function () { req.destroy(new Error('TIMEOUT')); });
    req.write(body);
    req.end();
  });

  if (writeResult.status !== 200) {
    return { ok: false, stage: 'C-status', status: writeResult.status };
  }
  const writeJson = JSON.parse(writeResult.body);
  if (!writeJson || writeJson.code !== 0) {
    return { ok: false, stage: 'C-code', code: writeJson && writeJson.code, msg: writeJson && writeJson.msg };
  }
  const recordId = writeJson.data && writeJson.data.record && writeJson.data.record.record_id;
  return { ok: true, recordId: recordId, fields: fields };
};