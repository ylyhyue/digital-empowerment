// pages/share/share.js —— 分享中转页
Page({
  onShareAppMessage() {
    return {
      title: '企业数字化赋能标准&条码',
      path: '/pages/home/home'
    };
  },
  onShareTimeline() {
    return {
      title: '企业数字化赋能标准&条码'
    };
  },
  goHome() { wx.switchTab({ url: '/pages/home/home' }); },
  goEmpower() { wx.switchTab({ url: '/pages/empower/empower' }); },
  goAi() { wx.switchTab({ url: '/pages/ai/ai' }); }
});
