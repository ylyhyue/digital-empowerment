// pages/web/web.js —— 通用外链浏览器（兼容真机：业务域名未配置时走复制模式）
const { miniProgram } = wx.getAccountInfoSync();
const envVersion = miniProgram.envVersion; // develop / trial / release
const sysInfo = wx.getSystemInfoSync(); // platform: devtools / ios / android
const drawQrcode = require('../../utils/qrcode');

Page({
  data: {
    src: '',
    originalUrl: '',
    error: false,
    errorMsg: '',
    useWebview: false, // 仅开发版（开发者工具）且勾选"不校验合法域名"时才用 web-view 预览
    qrImage: '' // 二维码导出的临时图片，用于长按识别
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

    // 真机（含真机调试/体验版/正式版）无法为第三方站点配置业务域名，web-view 必然失败；
    // 因此仅在"开发者工具模拟器"里用 web-view 预览，任何手机环境都走"复制链接"落地页。
    const useWebview = envVersion === 'develop' && sysInfo.platform === 'devtools' && isValid;

    this.setData({
      src: useWebview ? url : '',
      originalUrl: url,
      error: !isValid,
      errorMsg: isValid ? '该网页未加入小程序业务域名，请复制后在浏览器打开' : '链接格式不正确或为空',
      useWebview
    });
    if (url && isValid) {
      wx.setNavigationBarTitle({ title: '浏览网页' });
    }
  },

  onReady() {
    // 非 web-view 模式时，把链接生成二维码，导出为图片后用 <image> 长按识别
    if (this.data.useWebview || !this.data.originalUrl) return;
    const url = this.data.originalUrl;
    try {
      drawQrcode({
        canvasId: 'qrcode',
        text: url,
        width: 280,
        height: 280,
        callback: () => {
          wx.canvasToTempFilePath({
            canvasId: 'qrcode',
            success: (res) => {
              this.setData({ qrImage: res.tempFilePath });
            },
            fail: (err) => {
              console.error('[web] canvasToTempFilePath fail', err);
            }
          });
        }
      });
    } catch (err) {
      console.error('[web] drawQrcode fail', err);
    }
  },

  copyLink() {
    const url = this.data.originalUrl;
    if (!url) {
      wx.showToast({ title: '没有可复制的链接', icon: 'none' });
      return;
    }
    console.log('[web] copyLink', url);
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: '链接已复制，请到浏览器打开', icon: 'none', duration: 2000 });
      },
      fail: (err) => {
        console.error('[web] setClipboardData fail', err);
        wx.showToast({ title: '复制失败，可长按二维码识别打开', icon: 'none', duration: 2500 });
      }
    });
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});
