// pages/profile/profile.js
Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    myDragons: [],
    myParticipations: [],
    loading: false,
    showMyDragons: false,
    showMyParticipations: false
  },

  onLoad() {
    // 检查是否已有用户信息
    const app = getApp();
    console.log('=== Profile页面加载 ===');
    console.log('全局用户信息:', app.globalData.userInfo);
    console.log('全局OpenID:', app.globalData.openid);
    
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      });
      // 如果已有用户信息，加载用户数据
      this.loadUserData();
    } else {
      // 尝试从云端恢复用户信息
      this.getOpenId().then(() => {
        this.getUserInfoFromCloud();
      });
    }
  },

  onShow() {
    console.log('=== Profile页面显示 ===');
    const app = getApp();
    console.log('当前用户信息:', this.data.userInfo);
    console.log('当前登录状态:', this.data.hasUserInfo);
    console.log('全局用户信息:', app.globalData.userInfo);
    console.log('全局OpenID:', app.globalData.openid);
    
    if (this.data.hasUserInfo) {
      this.loadUserData();
    }
  },

  // 切换我发起的接龙显示状态
  toggleMyDragons() {
    const showMyDragons = !this.data.showMyDragons;
    this.setData({ showMyDragons });
    
    if (showMyDragons && this.data.myDragons.length === 0) {
      this.loadMyDragons();
    }
  },

  // 切换我参与的接龙显示状态
  toggleMyParticipations() {
    const showMyParticipations = !this.data.showMyParticipations;
    this.setData({ showMyParticipations });
    
    if (showMyParticipations && this.data.myParticipations.length === 0) {
      this.loadMyParticipations();
    }
  },

  // 开始登录流程 - 自动显示设置界面
  startLogin() {
    console.log('=== 开始登录流程 ===');
    
    // 初始化用户信息对象
    this.setData({
      userInfo: {
        nickName: '',
        avatarUrl: '../../images/icons/avatar.png',
        gender: 0,
        city: '',
        province: '',
        country: '',
        language: 'zh_CN'
      },
      showManualSetup: true
    });
    
    wx.showToast({
      title: '请选择头像和昵称',
      icon: 'none'
    });
  },

  // 选择头像回调
  onChooseAvatar(e) {
    console.log('=== 选择头像 ===');
    console.log('头像URL:', e.detail.avatarUrl);
    
    const { avatarUrl } = e.detail;
    this.setData({
      userInfo: {
        ...this.data.userInfo,
        avatarUrl: avatarUrl
      }
    });
  },

  // 昵称实时输入回调
  onNicknameInput(e) {
    const nickName = e.detail.value;
    this.setData({
      userInfo: {
        ...this.data.userInfo,
        nickName: nickName
      }
    });
  },

  // 昵称输入回调
  onNicknameBlur(e) {
    console.log('=== 昵称输入 ===');
    console.log('昵称:', e.detail.value);
    
    const nickName = e.detail.value.trim();
    this.setData({
      userInfo: {
        ...this.data.userInfo,
        nickName: nickName
      }
    });
  },

  // 完成用户信息设置
  completeProfile() {
    const { userInfo } = this.data;
    
    // 验证必填信息
    if (!userInfo.nickName || userInfo.nickName.trim() === '') {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    console.log('=== 完成用户信息设置 ===');
    console.log('用户信息:', userInfo);

    // 构建完整用户信息
    const completeUserInfo = {
      nickName: userInfo.nickName.trim(),
      avatarUrl: userInfo.avatarUrl || '../../images/icons/avatar.png',
      gender: userInfo.gender || 0,
      city: userInfo.city || '',
      province: userInfo.province || '',
      country: userInfo.country || '',
      language: userInfo.language || 'zh_CN'
    };

    console.log('完整用户信息:', completeUserInfo);

    // 保存用户信息
    this.setData({
      userInfo: completeUserInfo,
      hasUserInfo: true
    });

    // 保存到全局
    const app = getApp();
    app.globalData.userInfo = completeUserInfo;
    console.log('全局用户信息已保存:', app.globalData.userInfo);

    // 获取OpenID，保存到云端，并加载用户数据
    this.getOpenId().then(async () => {
      // 保存用户信息到云端
      const saveResult = await this.saveUserInfoToCloud(completeUserInfo);
      
      // 记录登录行为
      try {
        await this.logUserAction('login', {
          isNewUser: saveResult && saveResult.isNewUser,
          loginMethod: 'manual_setup',
          hasAvatar: !!completeUserInfo.avatarUrl,
          hasNickname: !!completeUserInfo.nickName
        });
      } catch (logError) {
        console.error('记录登录行为失败:', logError);
      }
      
      this.loadUserData();
    });

    wx.showToast({
      title: '登录成功',
      icon: 'success'
    });
  },

  // 获取OpenID
  async getOpenId() {
    try {
      console.log('=== 开始获取OpenID ===');
      const res = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: { type: 'getOpenId' }
      });
      console.log('云函数返回结果:', res);
      console.log('OpenID:', res.result.openid);
      console.log('AppID:', res.result.appid);
      console.log('UnionID:', res.result.unionid);
      
      const app = getApp();
      app.globalData.openid = res.result.openid;
      console.log('全局OpenID已保存:', app.globalData.openid);
      return res.result.openid;
    } catch (error) {
      console.error('获取OpenID失败:', error);
      console.log('错误详情:', JSON.stringify(error));
    }
  },

  // 保存用户信息到云端
  async saveUserInfoToCloud(userInfo) {
    try {
      console.log('=== 保存用户信息到云端 ===');
      console.log('要保存的用户信息:', userInfo);
      
      const res = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: { 
          type: 'getUserInfo',
          userInfo: userInfo
        }
      });
      
      console.log('云端保存结果:', res);
      console.log('云函数返回的result:', res.result);
      
      // 确保返回值不为null
      if (res && res.result) {
        console.log('保存成功，返回结果:', res.result);
        return res.result;
      } else {
        console.error('云函数返回结果为空或null');
        return { success: false, isNewUser: false, error: '云函数返回结果为空' };
      }
    } catch (error) {
      console.error('保存用户信息失败:', error);
      return { success: false, error: error.message, isNewUser: false };
    }
  },

  // 从云端获取用户信息
  async getUserInfoFromCloud() {
    try {
      console.log('=== 从云端获取用户信息 ===');
      
      const res = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: { type: 'getUserInfo' }
      });
      
      console.log('云端用户信息:', res);
      
      // 检查返回结果是否有效
      if (res && res.result && res.result.success && res.result.userInfo) {
        const userInfo = res.result.userInfo;
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        });
        
        // 保存到全局
        const app = getApp();
        app.globalData.userInfo = userInfo;
        console.log('从云端恢复用户信息成功:', userInfo);
        
        // 记录用户访问行为
        await this.logUserAction('app_visit', {
          source: 'profile_page',
          userRestored: true
        });
        
        return userInfo;
      } else {
        console.log('云端没有用户信息或获取失败:', res ? res.result : 'res为null');
        return null;
      }
    } catch (error) {
      console.error('从云端获取用户信息失败:', error);
      return null;
    }
  },

  // 记录用户行为
  async logUserAction(action, details = {}) {
    try {
      // 使用新的API获取系统信息
      let platform = 'unknown';
      try {
        const systemInfo = wx.getDeviceInfo();
        platform = systemInfo.platform || 'unknown';
      } catch (error) {
        console.log('获取设备信息失败，使用默认值');
      }
      
      await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'logUserAction',
          action: action,
          details: details,
          page: 'profile',
          userAgent: platform
        }
      });
    } catch (error) {
      console.error('记录用户行为失败:', error);
    }
  },
  // 加载用户数据
  async loadUserData() {
    try {
      const app = getApp();
      if (!app.globalData.openid) {
        await this.getOpenId();
      }
      // 只获取统计数据，不加载具体列表
      await this.loadStatistics();
    } catch (error) {
      console.error('加载用户数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 加载统计数据
  async loadStatistics() {
    try {
      const app = getApp();
      const db = wx.cloud.database();
      
      try {
        // 只获取数量统计
        const myDragonsCount = await db.collection('dragons')
          .where({
            creatorOpenId: app.globalData.openid
          })
          .count();

        const myParticipationsCount = await db.collection('dragons')
          .where({
            'participants.openid': app.globalData.openid
          })
          .count();

        this.setData({
          myDragonsCount: myDragonsCount.total,
          myParticipationsCount: myParticipationsCount.total
        });
      } catch (dbError) {
        // 如果是集合不存在的错误，设置为0
        if (dbError.errCode === -502005) {
          this.setData({
            myDragonsCount: 0,
            myParticipationsCount: 0
          });
        } else {
          throw dbError;
        }
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  // 加载我发起的接龙
  async loadMyDragons() {
    this.setData({ loading: true });
    
    try {
      const app = getApp();
      const db = wx.cloud.database();
      
      try {
        const myDragonsRes = await db.collection('dragons')
          .where({
            creatorOpenId: app.globalData.openid
          })
          .orderBy('createTime', 'desc')
          .limit(10)
          .get();

        this.setData({
          myDragons: myDragonsRes.data,
          loading: false
        });
      } catch (dbError) {
        if (dbError.errCode === -502005) {
          this.setData({
            myDragons: [],
            loading: false
          });
        } else {
          throw dbError;
        }
      }
    } catch (error) {
      console.error('加载我发起的接龙失败:', error);
      this.setData({ loading: false });
    }
  },

  // 删除接龙
  async deleteDragon(e) {
    const dragonId = e.currentTarget.dataset.id;
    const dragonTitle = e.currentTarget.dataset.title;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除接龙"${dragonTitle}"吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          try {
            const db = wx.cloud.database();
            await db.collection('dragons').doc(dragonId).remove();
            
            // 记录删除行为
            await this.logUserAction('delete_dragon', {
              dragonId: dragonId,
              dragonTitle: dragonTitle
            });
            
            wx.hideLoading();
            wx.showToast({ title: '删除成功' });
            
            // 重新加载列表
            this.loadMyDragons();
            this.loadStatistics();
            
          } catch (error) {
            console.error('删除接龙失败:', error);
            wx.hideLoading();
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 加载我参与的接龙
  async loadMyParticipations() {
    this.setData({ loading: true });
    
    try {
      const app = getApp();
      const db = wx.cloud.database();
      
      try {
        const myParticipationsRes = await db.collection('dragons')
          .where({
            'participants.openid': app.globalData.openid
          })
          .orderBy('updateTime', 'desc')
          .limit(10)
          .get();

        this.setData({
          myParticipations: myParticipationsRes.data,
          loading: false
        });
      } catch (dbError) {
        if (dbError.errCode === -502005) {
          this.setData({
            myParticipations: [],
            loading: false
          });
        } else {
          throw dbError;
        }
      }
    } catch (error) {
      console.error('加载我参与的接龙失败:', error);
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

  // 联系客服
  contactService() {
    // 记录联系客服行为
    this.logUserAction('contact_service', {
      source: 'profile_menu'
    });
    
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
    // 记录查看关于我们行为
    this.logUserAction('view_about', {
      source: 'profile_menu'
    });
    
    wx.showModal({
      title: '关于我们',
      content: '接龙购物小程序\n版本：1.0.0\n让社群团购更简单',
      showCancel: false
    });
  },

  // 查看数据库数据（调试用）
  async checkDatabaseData() {
    wx.showLoading({ title: '查询中...' });
    
    try {
      const app = getApp();
      const db = wx.cloud.database();
      
      // 查询用户信息
      let userInfo = null;
      try {
        const userResult = await db.collection('users').doc(app.globalData.openid).get();
        userInfo = userResult.data;
      } catch (error) {
        console.log('用户信息查询失败:', error);
      }
      
      // 查询用户行为日志
      let userLogs = [];
      try {
        const logsResult = await db.collection('user_logs')
          .where({ openid: app.globalData.openid })
          .orderBy('timestamp', 'desc')
          .limit(5)
          .get();
        userLogs = logsResult.data;
      } catch (error) {
        console.log('用户日志查询失败:', error);
      }
      
      wx.hideLoading();
      
      // 显示查询结果
      let message = '=== 数据库数据查询结果 ===\n\n';
      
      if (userInfo) {
        message += `用户信息表 (users):\n`;
        message += `- 昵称: ${userInfo.nickName}\n`;
        message += `- 登录次数: ${userInfo.loginCount || 1}\n`;
        message += `- 创建时间: ${userInfo.createTime}\n`;
        message += `- 最后登录: ${userInfo.lastLoginTime}\n\n`;
      } else {
        message += `用户信息表 (users): 暂无数据\n\n`;
      }
      
      if (userLogs.length > 0) {
        message += `用户行为日志表 (user_logs):\n`;
        userLogs.forEach((log, index) => {
          message += `${index + 1}. ${log.action} - ${log.timestamp}\n`;
        });
      } else {
        message += `用户行为日志表 (user_logs): 暂无数据\n`;
      }
      
      message += `\n当前OpenID: ${app.globalData.openid}`;
      
      wx.showModal({
        title: '数据库数据',
        content: message,
        showCancel: false
      });
      
    } catch (error) {
      wx.hideLoading();
      console.error('查询数据库失败:', error);
      wx.showToast({
        title: '查询失败',
        icon: 'none'
      });
    }
  },

  // 初始化数据库（调试用）
  async initializeDatabase() {
    wx.showLoading({ title: '初始化数据库...' });
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: { type: 'initializeDatabase' }
      });
      
      console.log('云函数返回结果:', result);
      
      wx.hideLoading();
      
      if (result && result.result && result.result.success) {
        wx.showModal({
          title: '数据库初始化成功',
          content: `${result.result.message}\n\n详情：\n${result.result.details ? result.result.details.map(d => d.message).join('\n') : '无详情'}`,
          showCancel: false
        });
      } else {
        wx.showModal({
          title: '数据库初始化失败',
          content: (result && result.result && result.result.message) || '云函数调用失败或返回结果为空',
          showCancel: false
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('初始化数据库失败:', error);
      wx.showModal({
        title: '初始化数据库失败',
        content: `错误信息：${error.message || '网络错误'}`,
        showCancel: false
      });
    }
  },

  // 导出数据
  async exportData() {
    // 记录导出行为
    await this.logUserAction('export_data', {
      dragonCount: this.data.myDragons.length
    });
    
    if (this.data.myDragons.length === 0) {
      wx.showToast({
        title: '暂无数据可导出',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '正在导出数据...' });

    try {
      const app = getApp();
      const db = wx.cloud.database();
      
      // 获取所有我发起的接龙的详细信息
      const dragonIds = this.data.myDragons.map(dragon => dragon._id);
      const detailedDragons = await Promise.all(
        dragonIds.map(id => db.collection('dragons').doc(id).get())
      );

      // 整理导出数据
      let exportData = [];
      let exportText = '接龙参与者数据导出\n\n';
      
      detailedDragons.forEach((dragonRes, index) => {
        const dragon = dragonRes.data;
        if (dragon.participants && dragon.participants.length > 0) {
          exportText += `接龙名称：${dragon.title}\n`;
          exportText += `创建时间：${dragon.createTime}\n`;
          exportText += `参与人数：${dragon.participants.length}人\n`;
          exportText += '参与者信息：\n';
          exportText += '序号\t姓名\t联系方式\t备注\t参与时间\n';
          
          dragon.participants.forEach((participant, pIndex) => {
            const participantData = {
              dragonTitle: dragon.title,
              dragonId: dragon._id,
              序号: pIndex + 1,
              姓名: participant.name || '未提供',
              联系方式: participant.contactInfo || '未提供',
              备注: participant.remark || '无',
              参与时间: participant.participateTime || '未知',
              商品信息: participant.items ? participant.items.map(item => 
                `${item.goodsName} x${item.quantity}`
              ).join(', ') : '无',
              总金额: participant.totalAmount ? `¥${participant.totalAmount}` : '¥0'
            };
            
            exportData.push(participantData);
            
            exportText += `${pIndex + 1}\t${participantData.姓名}\t${participantData.联系方式}\t${participantData.备注}\t${participantData.参与时间}\n`;
          });
          
          exportText += '\n';
        }
      });

      if (exportData.length === 0) {
        wx.hideLoading();
        wx.showToast({
          title: '暂无参与者数据',
          icon: 'none'
        });
        return;
      }

      // 显示导出选项
      wx.hideLoading();
      wx.showActionSheet({
        itemList: ['复制到剪贴板', '查看详细数据'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 复制到剪贴板
            wx.setClipboardData({
              data: exportText,
              success: () => {
                wx.showToast({
                  title: '数据已复制到剪贴板',
                  icon: 'success'
                });
              }
            });
          } else if (res.tapIndex === 1) {
            // 显示详细数据
            this.showExportDetail(exportData);
          }
        }
      });

    } catch (error) {
      console.error('导出数据失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '导出失败，请重试',
        icon: 'none'
      });
    }
  },

  // 显示导出详情
  showExportDetail(exportData) {
    const totalParticipants = exportData.length;
    const totalAmount = exportData.reduce((sum, item) => {
      const amount = parseFloat(item.总金额.replace('¥', '')) || 0;
      return sum + amount;
    }, 0);

    let detailText = `导出数据统计：\n`;
    detailText += `总参与人数：${totalParticipants}人\n`;
    detailText += `总交易金额：¥${totalAmount.toFixed(2)}\n\n`;
    detailText += `详细信息：\n`;
    
    exportData.forEach((item, index) => {
      detailText += `${index + 1}. ${item.姓名}\n`;
      detailText += `   联系方式：${item.联系方式}\n`;
      detailText += `   商品：${item.商品信息}\n`;
      detailText += `   金额：${item.总金额}\n`;
      if (item.备注 !== '无') {
        detailText += `   备注：${item.备注}\n`;
      }
      detailText += `   时间：${item.参与时间}\n\n`;
    });

    wx.showModal({
      title: '导出数据详情',
      content: detailText,
      confirmText: '复制全部',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: detailText,
            success: () => {
              wx.showToast({
                title: '详细数据已复制',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  }
});