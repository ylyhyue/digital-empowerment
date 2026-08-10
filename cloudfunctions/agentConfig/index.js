// agentConfig —— 智能体权限开关网关（管理员 openid 白名单 + 云数据库持久化）
// 防御式：任何异常都返回 { ok:false, error }，避免小程序端被兜底成"网络错误"而看不到真因
let cloud = null, db = null, _ = null, MODULE_ERR = '';
try {
  cloud = require('wx-server-sdk');
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
  db = cloud.database();
  _ = db.command;
} catch (e) {
  MODULE_ERR = String(e && e.message || e);
}

const ADMIN_COLL = 'agent_admin';
const SWITCH_COLL = 'agent_switch';
const SINGLETON = 'singleton';

const DEFAULT_AGENTS = ['条码师培训 Bot', '营商数擎 DataBE', '满意标尺 SatBE', '创业问答 Bot'];

async function getAdminOpenid() {
  try {
    const res = await db.collection(ADMIN_COLL).doc(SINGLETON).get();
    return (res.data && res.data.adminOpenid) || '';
  } catch (e) {
    return ''; // 集合不存在/读取失败→视为未设置
  }
}

async function getSwitches() {
  try {
    const res = await db.collection(SWITCH_COLL).doc(SINGLETON).get();
    const stored = (res.data && res.data.switches) || {};
    const out = {};
    DEFAULT_AGENTS.forEach(a => { out[a] = stored[a] === false ? false : true; });
    return out;
  } catch (e) {
    const out = {};
    DEFAULT_AGENTS.forEach(a => { out[a] = true; });
    return out;
  }
}

function friendlyErr(e) {
  const m = String(e && e.message || e);
  if (/not exist|不存在/i.test(m)) {
    return '集合不存在：请在云开发控制台「数据库」手动新建集合 ' + ADMIN_COLL + ' 与 ' + SWITCH_COLL + '（云函数用管理员身份可写，集合权限随意）';
  }
  return m;
}

exports.main = async (event) => {
  if (MODULE_ERR) return { ok: false, error: 'MODULE_LOAD: ' + MODULE_ERR };
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID || '';
    const action = event && event.action;
    const adminOpenid = await getAdminOpenid();
    const isAdmin = !!openid && !!adminOpenid && openid === adminOpenid;

    if (action === 'getMe') {
      return { ok: true, openid, isAdmin, adminOpenid: adminOpenid ? 'SET' : 'EMPTY' };
    }

    if (action === 'claimAdmin') {
      if (adminOpenid) {
        return { ok: false, msg: '管理员已设置，无法重复认领' };
      }
      try {
        await db.collection(ADMIN_COLL).doc(SINGLETON).set({ data: { adminOpenid: openid, claimedAt: Date.now() } });
        return { ok: true, openid, isAdmin: true };
      } catch (e) {
        return { ok: false, error: friendlyErr(e) };
      }
    }

    if (action === 'getSwitches') {
      return { ok: true, switches: await getSwitches() };
    }

    if (action === 'setSwitch') {
      if (!isAdmin) return { ok: false, msg: 'NO_ADMIN', needAdmin: true };
      const agent = event.agent;
      const enabled = !!event.enabled;
      if (DEFAULT_AGENTS.indexOf(agent) < 0) return { ok: false, msg: 'UNKNOWN_AGENT' };
      try {
        const cur = await getSwitches();
        cur[agent] = enabled;
        await db.collection(SWITCH_COLL).doc(SINGLETON).set({ data: { switches: cur } });
        return { ok: true, switches: cur };
      } catch (e) {
        return { ok: false, error: friendlyErr(e) };
      }
    }

    return { ok: false, msg: 'UNKNOWN_ACTION' };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e), stack: e && e.stack };
  }
};
