// pages/agentAdmin/agentAdmin.js —— 小程序智能体连接权限开关（仅管理员可操作）
const AGENTS = [
  { key: '条码师培训 Bot', desc: 'T/CABC 18.1 · 课件/题库/考证/UDI·DPP' },
  { key: '营商数擎 DataBE', desc: '数据要素赋能营商环境 · 参赛/评审双模' },
  { key: '满意标尺 SatBE', desc: '企业满意看营商 · 参赛/评审双模' },
  { key: '创业问答 Bot', desc: '创业政策 / 标准化 / 条码 通用答疑' }
];

Page({
  data: { loading: true, isAdmin: false, claimed: false, agents: [] },

  onLoad() { this.refresh(); },

  async refresh() {
    this.setData({ loading: true });
    const res = await wx.cloud.callFunction({ name: 'agentConfig', data: { action: 'getMe' } }).catch(() => ({ result: { ok: false } }));
    const me = res.result || {};
    if (me.ok) {
      if (me.isAdmin) {
        await this.loadSwitches();
      } else {
        this.setData({ loading: false, isAdmin: false, claimed: me.adminOpenid === 'SET' });
      }
    } else {
      this.setData({ loading: false, isAdmin: false, claimed: false });
    }
  },

  async loadSwitches() {
    const res = await wx.cloud.callFunction({ name: 'agentConfig', data: { action: 'getSwitches' } }).catch(() => ({ result: { ok: false } }));
    const sw = (res.result && res.result.switches) || {};
    const agents = AGENTS.map(a => ({ key: a.key, desc: a.desc, enabled: sw[a.key] === false ? false : true }));
    this.setData({ loading: false, isAdmin: true, agents });
  },

  claim() {
    wx.showLoading({ title: '认领中' });
    wx.cloud.callFunction({ name: 'agentConfig', data: { action: 'claimAdmin' } }).then(r => {
      wx.hideLoading();
      const res = r.result || {};
      if (res.ok) { wx.showToast({ title: '已认领管理员', icon: 'success' }); this.refresh(); }
      else wx.showToast({ title: res.error || res.msg || '认领失败', icon: 'none' });
    }).catch(() => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); });
  },

  toggle(e) {
    if (!this.data.isAdmin) return;
    const key = e.currentTarget.dataset.key;
    const enabled = e.detail.value;
    wx.showLoading({ title: '保存中' });
    wx.cloud.callFunction({ name: 'agentConfig', data: { action: 'setSwitch', agent: key, enabled } }).then(r => {
      wx.hideLoading();
      const res = r.result || {};
      if (res.ok) {
        const agents = this.data.agents.map(a => a.key === key ? Object.assign({}, a, { enabled }) : a);
        this.setData({ agents });
        wx.showToast({ title: (enabled ? '已启用 ' : '已停用 ') + key, icon: 'none' });
      } else if (res.needAdmin) {
        this.setData({ isAdmin: false });
        wx.showToast({ title: '权限失效，请重新认领', icon: 'none' });
      } else {
        wx.showToast({ title: res.error || res.msg || '保存失败', icon: 'none' });
      }
    }).catch(() => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); });
  }
});
