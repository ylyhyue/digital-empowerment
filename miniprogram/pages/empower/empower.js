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
  },

  // 跳转到 AI 条码实验室子页（九大作业节点）
  goLab() {
    wx.navigateTo({ url: '/pages/lab/lab' });
  },

  // 资源入口：条码师报考/培训指引 → 进入「我的」预约报名
  goReserve() {
    wx.navigateTo({ url: '/pages/consult/consult?agent=' + encodeURIComponent('通用咨询') });
  }
});
