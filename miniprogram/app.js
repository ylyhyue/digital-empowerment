// app.js —— 初始化微信云开发
// 环境：cloud1（2026-07-31 创建）
const CLOUD_ENV = 'cloud1-d9gny7u9ne6369e7c';

App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('当前基础库版本过低，请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: CLOUD_ENV,
        traceUser: true
      });
      console.log('[云开发] 已初始化，环境：', CLOUD_ENV);
    }
  }
});
