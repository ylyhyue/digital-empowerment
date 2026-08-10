// pages/chat/chat.js —— 智能体对话页（调用 agentChat 云函数，接 LLM 即时回答）
const GREETING = {
  '条码师培训 Bot': '你好，我是条码师培训 Bot。基于 T/CABC 18.1-2025《条码师岗位能力要求》，可解答条码师初/中/高级考证、课件、题库、UDI·DPP 等。现在就问我吧～',
  '营商数擎 DataBE': '你好，我是营商数擎 DataBE，专注数据要素赋能营商环境，提供参赛辅导与 AI 评审。请描述你的需求。',
  '满意标尺 SatBE': '你好，我是满意标尺 SatBE，专注企业满意度测评与营商环境满意度赛道。请描述你的需求。',
  '创业问答 Bot': '你好，我是创业问答 Bot，解答创业政策、标准化与条码通用问题。请描述你的问题。',
  '通用咨询': '你好，我是数字化赋能智能助手，请描述你的问题或需求。'
};

const AGENTS = {
  '条码师培训 Bot': { emoji: '📦', grad: 'linear-gradient(135deg,#ff8a1f,#f5670a)', desc: 'T/CABC 18.1 · 课件/题库/考证/UDI·DPP' },
  '营商数擎 DataBE': { emoji: '📊', grad: 'linear-gradient(135deg,#07C160,#0a9b54)', desc: '数据要素赋能营商环境 · 参赛/评审双模' },
  '满意标尺 SatBE': { emoji: '📏', grad: 'linear-gradient(135deg,#2b7fff,#1a5fd0)', desc: '企业满意赛道 · 参赛/评审双模' },
  '创业问答 Bot': { emoji: '💬', grad: 'linear-gradient(135deg,#8a8f99,#6b7280)', desc: '创业政策 / 标准化 / 条码 通用答疑' },
  '通用咨询': { emoji: '🤖', grad: 'linear-gradient(135deg,#07C160,#0a9b54)', desc: '通用咨询' }
};

Page({
  data: {
    agent: '通用咨询',
    agentEmoji: '🤖',
    agentGrad: 'linear-gradient(135deg,#07C160,#0a9b54)',
    agentDesc: '通用咨询',
    greeting: '',
    messages: [],          // { role:'user'|'assistant', content }
    input: '',
    sending: false,
    contact: '',
    showExpert: false,
    toView: ''
  },
  onLoad(q) {
    const name = q.agent || '通用咨询';
    const info = AGENTS[name] || AGENTS['通用咨询'];
    wx.setNavigationBarTitle({ title: name });
    this.setData({
      agent: name,
      agentEmoji: info.emoji,
      agentGrad: info.grad,
      agentDesc: info.desc,
      greeting: GREETING[name] || GREETING['通用咨询']
    });
  },
  onInput(e) { this.setData({ input: e.detail.value }); },
  onContact(e) { this.setData({ contact: e.detail.value }); },
  send() {
    const text = (this.data.input || '').trim();
    if (!text) { wx.showToast({ title: '请输入内容', icon: 'none' }); return; }
    if (this.data.sending) return;
    const messages = this.data.messages.concat([{ role: 'user', content: text }]);
    this.setData({ messages, input: '', sending: true });
    this.scrollToBottom();
    wx.cloud.callFunction({
      name: 'agentChat',
      data: { agent: this.data.agent, messages }
    }).then(res => {
      const r = res.result || {};
      if (r.ok) {
        this.setData({
          messages: messages.concat([{ role: 'assistant', content: r.answer }]),
          sending: false
        });
      } else {
        this.setData({ sending: false });
        const errMsg = (r.msg || '暂时无法回复') + (r.detail ? '\n' + r.detail : '');
        this.setData({ messages: messages.concat([{ role: 'assistant', content: '⚠️ ' + errMsg }]) });
      }
      this.scrollToBottom();
    }).catch(err => {
      this.setData({ sending: false });
      this.setData({ messages: messages.concat([{ role: 'assistant', content: '⚠️ 网络错误，请稍后重试' }]) });
      console.error(err);
      this.scrollToBottom();
    });
  },
  toggleExpert() { this.setData({ showExpert: !this.data.showExpert }); },
  submitExpert() {
    const msgs = this.data.messages;
    const lastQ = [...msgs].reverse().find(m => m.role === 'user');
    if (!lastQ) { wx.showToast({ title: '请先与智能体对话', icon: 'none' }); return; }
    if (!this.data.contact.trim()) { wx.showToast({ title: '请填写联系方式', icon: 'none' }); return; }
    wx.showLoading({ title: '提交中' });
    wx.cloud.callFunction({
      name: 'submitConsult',
      data: {
        agent: this.data.agent,
        name: this.data.agent + '·对话',
        contact: this.data.contact,
        question: lastQ.content
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.ok) {
        wx.showModal({ title: '提交成功', content: '已把问题转交专家团队，将结合本次对话 24 小时内跟进。', showCancel: false });
        this.setData({ showExpert: false, contact: '' });
      } else {
        wx.showToast({ title: (res.result && res.result.msg) || '提交失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    });
  },
  scrollToBottom() {
    const len = this.data.messages.length;
    if (len > 0) this.setData({ toView: 'msg-' + (len - 1) });
  }
});
