// pages/index/index.js
Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    dragonList: [],
    loading: false
  },

  onLoad() {
    this.getUserInfo();
    this.loadDragonList();
  },

  onShow() {
    this.loadDragonList();
  },

  // 获取用户信息
  getUserInfo() {
    // 检查是否已有用户信息
    const app = getApp();
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      });
    } else {
      // 引导用户到我的页面进行登录
      wx.showModal({
        title: '需要登录',
        content: '请先到"我的"页面进行登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/profile/profile'
            });
          }
        }
      });
    }
  },

  // 获取用户OpenID
  getOpenId() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: { type: 'getOpenId' },
        success: res => {
          getApp().globalData.openid = res.result.openid;
          resolve(res.result.openid);
        },
        fail: reject
      });
    });
  },

  // 加载接龙列表
  async loadDragonList() {
    this.setData({ loading: true });
    
    try {
      try {
        const db = wx.cloud.database();
        const { data } = await db.collection('dragons')
          .orderBy('createTime', 'desc')
          .limit(20)
          .get();
        
        this.setData({ 
          dragonList: data,
          loading: false 
        });
      } catch (dbError) {
        // 如果是集合不存在的错误，显示空列表
        if (dbError.errCode === -502005) {
          console.log('数据库集合不存在，将在首次创建接龙时自动创建');
          this.setData({ 
            dragonList: [],
            loading: false 
          });
        } else {
          throw dbError;
        }
      }
    } catch (error) {
      console.error('加载接龙列表失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 查看接龙详情
  viewDragon(e) {
    const dragonId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${dragonId}`
    });
  },

  // 创建接龙
  createDragon() {
    if (!this.data.hasUserInfo) {
      this.getUserInfo();
      return;
    }
    wx.navigateTo({
      url: '/pages/create/create'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadDragonList().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});