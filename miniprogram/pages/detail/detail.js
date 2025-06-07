// pages/detail/detail.js
Page({
  data: {
    dragonId: '',
    dragon: null,
    isParticipated: false,
    loading: true,
    userParticipation: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ dragonId: options.id });
      this.loadDragonDetail();
    }
  },

  onShow() {
    if (this.data.dragonId) {
      this.loadDragonDetail();
    }
  },

  // 加载接龙详情
  async loadDragonDetail() {
    this.setData({ loading: true });
    
    try {
      const db = wx.cloud.database();
      const { data } = await db.collection('dragons').doc(this.data.dragonId).get();
      
      if (data) {
        // 获取用户OpenID
        const app = getApp();
        if (!app.globalData.openid) {
          const openidRes = await wx.cloud.callFunction({
            name: 'quickstartFunctions',
            data: { type: 'getOpenId' }
          });
          app.globalData.openid = openidRes.result.openid;
        }

        // 检查用户是否已参与
        const userParticipation = data.participants?.find(p => p.openid === app.globalData.openid);
        
        this.setData({
          dragon: data,
          isParticipated: !!userParticipation,
          userParticipation: userParticipation,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载接龙详情失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 参与接龙
  participate() {
    if (this.data.dragon.status !== 'active') {
      wx.showToast({
        title: '接龙已结束',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/participate/participate?id=${this.data.dragonId}`
    });
  },

  // 查看我的参与信息
  viewMyParticipation() {
    if (!this.data.userParticipation) return;
    
    wx.showModal({
      title: '我的参与信息',
      content: `商品：${this.data.userParticipation.items.map(item => `${item.goodsName} x${item.quantity}`).join('\n')}\n总金额：¥${this.data.userParticipation.totalAmount}\n联系方式：${this.data.userParticipation.contactInfo}`,
      showCancel: false
    });
  },

  // 分享接龙
  onShareAppMessage() {
    return {
      title: this.data.dragon?.title || '接龙购物',
      path: `/pages/detail/detail?id=${this.data.dragonId}`,
      imageUrl: this.data.dragon?.goods?.[0]?.images?.[0] || ''
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: this.data.dragon?.title || '接龙购物',
      query: `id=${this.data.dragonId}`,
      imageUrl: this.data.dragon?.goods?.[0]?.images?.[0] || ''
    };
  },

  // 联系发起人
  contactCreator() {
    wx.showModal({
      title: '联系发起人',
      content: `联系方式：${this.data.dragon.contactInfo}`,
      confirmText: '复制',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: this.data.dragon.contactInfo,
            success: () => {
              wx.showToast({ title: '已复制到剪贴板' });
            }
          });
        }
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const { current, urls } = e.currentTarget.dataset;
    wx.previewImage({
      current: current,
      urls: urls
    });
  }
});