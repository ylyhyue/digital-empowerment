// pages/empower/empower.js —— 数字赋能页：链接统一走 web-view，未配置域名时自动降级复制
Page({
  tapItem(e) {
    const name = e.currentTarget.dataset.name;
    wx.showToast({ title: '即将上线：' + name, icon: 'none' });
  },

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
