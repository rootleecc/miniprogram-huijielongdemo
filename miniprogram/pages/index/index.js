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
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        getApp().globalData.userInfo = res.userInfo;
      },
      fail: () => {
        console.log('用户拒绝授权');
      }
    });
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
      const db = wx.cloud.database();
      const { data } = await db.collection('dragons')
        .orderBy('createTime', 'desc')
        .limit(20)
        .get();
      
      this.setData({ 
        dragonList: data,
        loading: false 
      });
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