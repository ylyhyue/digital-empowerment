// pages/mine/mine.js
// 「中原帮办」三通道真实链接（可替换为你的正式表单地址）
const FEISHU = 'https://scnke9dkyl7e.feishu.cn/base/Wtgeb0qBpaFByJsNomZcd4Sqn2g?table=tblNg5ZdrvlDDwxS&view=vewfjmeAoR';
const TENCENT = 'https://docs.qq.com/form/page/DSUhTUk9ob1NneGNo';

Page({
  copyLink(url, name) {
    wx.setClipboardData({
      data: url,
      success: () => wx.showToast({ title: name + '链接已复制', icon: 'none' })
    });
  },
  openFeishu() { this.copyLink(FEISHU, '飞书表单'); },
  openTencent() { this.copyLink(TENCENT, '腾讯文档'); },
  openOnline() { wx.navigateTo({ url: '/pages/consult/consult?agent=通用咨询' }); },
  openAgentAdmin() { wx.navigateTo({ url: '/pages/agentAdmin/agentAdmin' }); },
  contact() {
    wx.showToast({ title: '请通过「在线填写」留言', icon: 'none' });
  },
  noop(e) {
    wx.showToast({ title: '即将上线：' + e.currentTarget.dataset.name, icon: 'none' });
  }
});
