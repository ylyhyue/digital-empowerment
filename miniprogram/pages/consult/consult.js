// pages/consult/consult.js
// NAME_MAP：内部 key -> 页面展示名（不含 Bot/AI 字眼）
const NAME_MAP = {
  '条码师培训 Bot': '条码师培训助手',
  '营商数擎 DataBE': '营商数擎助手',
  '满意标尺 SatBE': '满意标尺助手',
  '创业问答 Bot': '创业问答助手',
  '通用咨询': '数字化赋能助手'
};
const GREETING = {
  '条码师培训 Bot': '你好，我是条码师培训助手。可帮你解答 T/CABC 18.1 条码师（初/中/高级）考证、课件、题库与 UDI·DPP 专题。请描述你的问题，提交后专家团队会跟进。',
  '营商数擎 DataBE': '你好，我是营商数擎助手，专注数据要素赛道参赛辅导与评审。请描述你的申报材料或疑问。',
  '满意标尺 SatBE': '你好，我是满意标尺助手，专注企业满意赛道参赛辅导与评审。请描述你的需求。',
  '创业问答 Bot': '你好，我是创业问答助手，解答创业政策、标准化与条码通用问题。请描述你的问题。',
  '通用咨询': '你好，请描述你的问题或需求，提交后专家团队 24 小时内跟进。'
};
const KEYS = ['条码师培训 Bot', '营商数擎 DataBE', '满意标尺 SatBE', '创业问答 Bot', '通用咨询'];

Page({
  data: {
    agents: KEYS.map(k => NAME_MAP[k]),
    agentsKey: KEYS,
    agentIndex: 4,
    agentShow: NAME_MAP['通用咨询'],
    greeting: GREETING['通用咨询'],
    name: '',
    contact: '',
    question: ''
  },
  onLoad(q) {
    const key = (q.agent && NAME_MAP[q.agent]) ? q.agent : '通用咨询';
    const idx = KEYS.indexOf(key);
    this.setData({
      agentIndex: idx,
      agentShow: NAME_MAP[key],
      greeting: GREETING[key]
    });
  },
  onAgent(e) {
    const i = Number(e.detail.value);
    const key = this.data.agentsKey[i];
    this.setData({ agentIndex: i, agentShow: NAME_MAP[key], greeting: GREETING[key] });
  },
  onName(e) { this.setData({ name: e.detail.value }); },
  onContact(e) { this.setData({ contact: e.detail.value }); },
  onQuestion(e) { this.setData({ question: e.detail.value }); },
  submit() {
    const d = this.data;
    if (!d.question.trim()) {
      wx.showToast({ title: '请填写问题描述', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '提交中' });
    wx.cloud.callFunction({
      name: 'submitConsult',
      data: {
        agent: d.agentsKey[d.agentIndex],
        name: d.name,
        contact: d.contact,
        question: d.question
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.ok) {
        wx.showModal({
          title: '提交成功',
          content: '问题已沉淀到飞书多维表格，专家团队将在 24 小时内跟进。',
          showCancel: false
        });
        this.setData({ name: '', contact: '', question: '' });
      } else {
        wx.showToast({ title: (res.result && res.result.msg) || '提交失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      console.error(err);
    });
  }
});
