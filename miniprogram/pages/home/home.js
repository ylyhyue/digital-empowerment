// pages/home/home.js
Page({
  goExpert() { wx.switchTab({ url: '/pages/expert/expert' }); },
  goEmpower() { wx.switchTab({ url: '/pages/empower/empower' }); },
  goAi() { wx.switchTab({ url: '/pages/ai/ai' }); },
  goMine() { wx.switchTab({ url: '/pages/mine/mine' }); },

  goLink(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: '链接暂未配置', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/web/web?url=' + encodeURIComponent(url)
    });
  }
});
