// pages/ai/ai.js —— 博士团队入口页（助手列表 + 咨询沉淀）
// key 为云端标识（保持不变，便于对话路由），display 为页面展示名（不含 Bot/AI 字眼）
const AGENTS = [
  { key: '条码师培训 Bot', display: '条码师培训助手', desc: 'T/CABC 18.1 · 课件/题库/考证/UDI·DPP', icon: '📦', cls: 'a3' },
  { key: '营商数擎 DataBE', display: '营商数擎助手', desc: '数据要素赋能营商环境 · 参赛/评审双模', icon: '📊', cls: 'a1' },
  { key: '满意标尺 SatBE', display: '满意标尺助手', desc: '企业满意看营商 · 参赛/评审双模', icon: '📏', cls: 'a2' },
  { key: '创业问答 Bot', display: '创业问答助手', desc: '创业政策 / 标准化 / 条码 通用答疑', icon: '💬', cls: 'a4' }
];

Page({
  data: {
    agents: []
  },

  onShow() {
    this.loadAgents();
  },

  // 加载云端开关、渲染助手列表
  async loadAgents() {
    let enabled = null;
    const res = await wx.cloud.callFunction({
      name: 'agentConfig',
      data: { action: 'getSwitches' }
    }).catch(() => ({ result: { ok: false } }));

    if (res.result && res.result.ok) {
      enabled = res.result.switches;
    }

    const list = AGENTS
      .map(a => ({
        key: a.key,
        display: a.display,
        desc: a.desc,
        icon: a.icon,
        cls: a.cls,
        show: enabled ? enabled[a.key] !== false : true
      }))
      .filter(a => a.show);

    this.setData({ agents: list });
  },

  // 打开对应助手对话页
  openChat(e) {
    const name = e.currentTarget.dataset.name;
    const desc = e.currentTarget.dataset.desc;
    wx.navigateTo({
      url: '/pages/chat/chat?agent=' + encodeURIComponent(name) + '&desc=' + encodeURIComponent(desc || '')
    });
  },

  // 跳转我的咨询页面
  openConsult() {
    wx.switchTab({ url: '/pages/mine/mine' });
  },

  // 转发好友配置（点击右上角 ··· 触发）
  onShareAppMessage() {
    return {
      title: '企业数字化赋能标准&条码',
      path: '/pages/ai/ai'
    };
  },

  // 朋友圈分享
  onShareTimeline() {
    return {
      title: '企业数字化赋能标准&条码'
    };
  }
});
