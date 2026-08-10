// pages/home/home.js
Page({
  goExpert() { wx.switchTab({ url: '/pages/expert/expert' }); },
  goEmpower() { wx.switchTab({ url: '/pages/empower/empower' }); },
  goAi() { wx.switchTab({ url: '/pages/ai/ai' }); },
  goMine() { wx.switchTab({ url: '/pages/mine/mine' }); }
});
