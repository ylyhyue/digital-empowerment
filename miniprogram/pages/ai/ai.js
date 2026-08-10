// pages/ai/ai.js —— 博士团队入口页（智能体列表 + 咨询沉淀）
const AGENTS = [
  { key: '条码师培训 Bot', desc: 'T/CABC 18.1 · 课件/题库/考证/UDI·DPP', icon: '📦', cls: 'a3' },
  { key: '营商数擎 DataBE', desc: '数据要素赋能营商环境 · 参赛/评审双模', icon: '📊', cls: 'a1' },
  { key: '满意标尺 SatBE', desc: '企业满意看营商 · 参赛/评审双模', icon: '📏', cls: 'a2' },
  { key: '创业问答 Bot', desc: '创业政策 / 标准化 / 条码 通用答疑', icon: '💬', cls: 'a4' }
];

Page({
  data: {
    agents: []
  },

  onShow() {
    this.loadAgents();
  },

  // 加载云端开关、渲染智能体列表
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
        desc: a.desc,
        icon: a.icon,
        cls: a.cls,
        show: enabled ? enabled[a.key] !== false : true
      }))
      .filter(a => a.show);

    this.setData({ agents: list });
  },

  // 打开对应智能体对话页
  openChat(e) {
    const name = e.currentTarget.dataset.name;
    wx.navigateTo({
      url: '/pages/chat/chat?agent=' + encodeURIComponent(name)
    });
  },

  // 跳转我的咨询页面
  openConsult() {
    wx.switchTab({ url: '/pages/mine/mine' });
  },

  // 点击跳转中转分享页面
  goShare() {
    wx.navigateTo({ url: '/pages/share/share' });
  },

  // 转发好友配置
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
