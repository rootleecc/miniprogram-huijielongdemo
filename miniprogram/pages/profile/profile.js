// pages/profile/profile.js
Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    myDragons: [],
    myParticipations: [],
    loading: false
  },

  onLoad() {
    // 检查是否已有用户信息
    const app = getApp();
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      });
    }
  },

  onShow() {
    if (this.data.hasUserInfo) {
      this.loadUserData();
    }
  },

  // 微信一键登录
  getUserProfile() {
    // 使用头像昵称填写能力
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        console.log('getUserProfile success:', res);
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        
        // 保存到全局
        const app = getApp();
        app.globalData.userInfo = res.userInfo;
        
        // 获取OpenID
        this.getOpenId().then(() => {
          this.loadUserData();
        });
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.log('getUserProfile fail:', err);
        // 如果getUserProfile失败，使用头像昵称填写组件
        this.useAvatarNickname();
      }
    });
  },

  // 使用头像昵称填写组件
  useAvatarNickname() {
    // 先获取OpenID
    this.getOpenId().then(() => {
      // 设置默认用户信息，等待用户手动选择头像和昵称
      this.setData({
        userInfo: {
          avatarUrl: '../../images/icons/avatar.png',
          nickName: '微信用户'
        },
        hasUserInfo: true,
        needUpdateProfile: true
      });
      
      const app = getApp();
      app.globalData.userInfo = this.data.userInfo;
      
      this.loadUserData();
      
      wx.showToast({
        title: '请完善个人信息',
        icon: 'none'
      });
    });
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const userInfo = { ...this.data.userInfo };
    userInfo.avatarUrl = avatarUrl;
    
    this.setData({
      userInfo: userInfo
    });
    
    // 更新全局数据
    const app = getApp();
    app.globalData.userInfo = userInfo;
    
    wx.showToast({
      title: '头像更新成功',
      icon: 'success'
    });
  },

  // 昵称输入完成
  onNicknameConfirm(e) {
    const { value } = e.detail;
    if (!value.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    
    const userInfo = { ...this.data.userInfo };
    userInfo.nickName = value.trim();
    
    this.setData({
      userInfo: userInfo,
      needUpdateProfile: false
    });
    
    // 更新全局数据
    const app = getApp();
    app.globalData.userInfo = userInfo;
    
    wx.showToast({
      title: '昵称更新成功',
      icon: 'success'
    });
  },

  // 获取OpenID
  async getOpenId() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: { type: 'getOpenId' }
      });
      const app = getApp();
      app.globalData.openid = res.result.openid;
      return res.result.openid;
    } catch (error) {
      console.error('获取OpenID失败:', error);
    }
  },

  // 加载用户数据
  async loadUserData() {
    this.setData({ loading: true });
    
    try {
      const app = getApp();
      if (!app.globalData.openid) {
        await this.getOpenId();
      }

      const db = wx.cloud.database();
      
      // 获取我发起的接龙
      const myDragonsRes = await db.collection('dragons')
        .where({
          creatorOpenId: app.globalData.openid
        })
        .orderBy('createTime', 'desc')
        .limit(10)
        .get();

      // 获取我参与的接龙
      const myParticipationsRes = await db.collection('dragons')
        .where({
          'participants.openid': app.globalData.openid
        })
        .orderBy('updateTime', 'desc')
        .limit(10)
        .get();

      this.setData({
        myDragons: myDragonsRes.data,
        myParticipations: myParticipationsRes.data,
        loading: false
      });
    } catch (error) {
      console.error('加载用户数据失败:', error);
      this.setData({ loading: false });
    }
  },

  // 查看接龙详情
  viewDragon(e) {
    const dragonId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${dragonId}`
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            userInfo: null,
            hasUserInfo: false,
            myDragons: [],
            myParticipations: []
          });
          
          // 清除全局数据
          const app = getApp();
          app.globalData.userInfo = null;
          app.globalData.openid = null;
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '如有问题，请联系客服微信：service123',
      confirmText: '复制微信号',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'service123',
            success: () => {
              wx.showToast({ title: '已复制到剪贴板' });
            }
          });
        }
      }
    });
  },

  // 关于我们
  aboutUs() {
    wx.showModal({
      title: '关于我们',
      content: '接龙购物小程序\n版本：1.0.0\n让社群团购更简单',
      showCancel: false
    });
  }
});