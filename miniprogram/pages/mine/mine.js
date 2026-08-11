// pages/mine/mine.js
// 「中原帮办」三通道真实链接（可替换为你的正式表单地址）
const FEISHU = 'https://scnke9dkyl7e.feishu.cn/base/Wtgeb0qBpaFByJsNomZcd4Sqn2g?table=tblNg5ZdrvlDDwxS&view=vewfjmeAoR';
const TENCENT = 'https://docs.qq.com/form/page/DSUhTUk9ob1NneGNo';

Page({
  goWeb(url) {
    wx.navigateTo({ url: '/pages/web/web?url=' + encodeURIComponent(url) });
  },
  openFeishu() { this.goWeb(FEISHU); },
  openTencent() { this.goWeb(TENCENT); },
  openOnline() { wx.navigateTo({ url: '/pages/consult/consult?agent=通用咨询' }); },

  // 我的预约：进入在线填写（咨询/预约）页
  openConsult() { wx.navigateTo({ url: '/pages/consult/consult?agent=通用咨询' }); },

  // 助手管理：进入权限开关页
  openAgentAdmin() { wx.navigateTo({ url: '/pages/agentAdmin/agentAdmin' }); },

  // 关于本程序：进入分享/说明页
  openAbout() { wx.navigateTo({ url: '/pages/share/share' }); },

  // 暂未实现的入口（收藏等）：给出明确提示
  noop(e) {
    wx.showToast({ title: '即将上线：' + (e.currentTarget.dataset.name || ''), icon: 'none' });
  }
});
