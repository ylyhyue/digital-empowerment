// pages/web/web.js —— 通用外链浏览器，带未配置业务域名时的复制降级
Page({
  data: {
    src: '',
    originalUrl: '',
    error: false,
    errorMsg: '该链接暂不支持在微信内直接打开'
  },

  onLoad(options) {
    let url = '';
    if (options.url) {
      try {
        url = decodeURIComponent(options.url);
      } catch (e) {
        url = options.url;
      }
    }
    // 基础安全校验：只允许 http/https
    const isValid = /^https?:\/\//i.test(url);
    this.setData({
      src: isValid ? url : '',
      originalUrl: url,
      error: !isValid,
      errorMsg: isValid ? '' : '链接格式不正确或为空'
    });
    if (url && isValid) {
      wx.setNavigationBarTitle({ title: '浏览网页' });
    }
  },

  onError(e) {
    console.error('web-view error', e.detail);
    this.setData({ error: true, errorMsg: '该网页未加入小程序业务域名，无法直接打开' });
  },

  copyLink() {
    const url = this.data.originalUrl;
    if (!url) {
      wx.showToast({ title: '没有可复制的链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: '链接已复制，请到浏览器打开', icon: 'none' });
      }
    });
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});
