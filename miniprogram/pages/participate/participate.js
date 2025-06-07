// pages/participate/participate.js
Page({
  data: {
    dragonId: '',
    dragon: null,
    selectedItems: [],
    contactInfo: '',
    remark: '',
    totalAmount: 0,
    submitting: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ dragonId: options.id });
      this.loadDragonDetail();
    }
  },

  // 加载接龙详情
  async loadDragonDetail() {
    try {
      try {
        const db = wx.cloud.database();
        const { data } = await db.collection('dragons').doc(this.data.dragonId).get();
        
        if (data) {
          // 初始化选中商品列表
          const selectedItems = data.goods.map(goods => ({
            goodsIndex: data.goods.indexOf(goods),
            goodsName: goods.name,
            price: parseFloat(goods.price),
            unit: goods.unit,
            quantity: 0,
            subtotal: '0.00'
          }));

          this.setData({
            dragon: data,
            selectedItems: selectedItems
          });
        }
      } catch (dbError) {
        if (dbError.errCode === -502005) {
          wx.showToast({
            title: '接龙不存在',
            icon: 'none'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          throw dbError;
        }
      }
    } catch (error) {
      console.error('加载接龙详情失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 修改商品数量
  changeQuantity(e) {
    const { index, type } = e.currentTarget.dataset;
    const selectedItems = this.data.selectedItems;
    const item = selectedItems[index];
    
    if (type === 'increase') {
      item.quantity += 1;
    } else if (type === 'decrease' && item.quantity > 0) {
      item.quantity -= 1;
    }
    
    // 计算小计
    item.subtotal = (item.price * item.quantity).toFixed(2);
    
    this.setData({ selectedItems });
    this.calculateTotal();
  },

  // 直接输入数量
  onQuantityInput(e) {
    const index = e.currentTarget.dataset.index;
    const value = parseInt(e.detail.value) || 0;
    const selectedItems = this.data.selectedItems;
    
    selectedItems[index].quantity = Math.max(0, value);
    // 计算小计
    selectedItems[index].subtotal = (selectedItems[index].price * selectedItems[index].quantity).toFixed(2);
    
    this.setData({ selectedItems });
    this.calculateTotal();
  },

  // 计算总金额
  calculateTotal() {
    const total = this.data.selectedItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    this.setData({ totalAmount: total.toFixed(2) });
  },

  // 联系方式输入
  onContactInput(e) {
    this.setData({ contactInfo: e.detail.value });
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  // 表单验证
  validateForm() {
    const { selectedItems, contactInfo } = this.data;
    
    // 检查是否选择了商品
    const hasSelectedItems = selectedItems.some(item => item.quantity > 0);
    if (!hasSelectedItems) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      });
      return false;
    }
    
    // 检查联系方式
    if (!contactInfo.trim()) {
      wx.showToast({
        title: '请填写联系方式',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  // 提交参与
  async submitParticipation() {
    if (!this.validateForm()) return;
    if (this.data.submitting) return;

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });

    try {
      // 获取用户信息
      const app = getApp();
      if (!app.globalData.openid) {
        const openidRes = await wx.cloud.callFunction({
          name: 'quickstartFunctions',
          data: { type: 'getOpenId' }
        });
        app.globalData.openid = openidRes.result.openid;
      }

      // 准备参与数据
      const participationData = {
        openid: app.globalData.openid,
        name: app.globalData.userInfo?.nickName || '匿名用户',
        avatar: app.globalData.userInfo?.avatarUrl || '',
        contactInfo: this.data.contactInfo.trim(),
        remark: this.data.remark.trim(),
        items: this.data.selectedItems.filter(item => item.quantity > 0),
        totalAmount: parseFloat(this.data.totalAmount),
        participateTime: new Date().toLocaleString()
      };

      // 更新接龙记录
      const db = wx.cloud.database();
      const _ = db.command;
      
      // 先检查用户是否已经参与过
      const dragonDoc = await db.collection('dragons').doc(this.data.dragonId).get();
      const existingParticipant = dragonDoc.data.participants?.find(p => p.openid === app.globalData.openid);
      
      let actionType = 'participate_dragon';
      
      if (existingParticipant) {
        // 更新现有参与记录
        await db.collection('dragons').doc(this.data.dragonId).update({
          data: {
            participants: dragonDoc.data.participants.map(p => 
              p.openid === app.globalData.openid ? participationData : p
            ),
            updateTime: new Date().toLocaleString()
          }
        });
        actionType = 'update_participation';
      } else {
        // 添加新的参与记录
        await db.collection('dragons').doc(this.data.dragonId).update({
          data: {
            participants: _.push(participationData),
            participantCount: _.inc(1),
            updateTime: new Date().toLocaleString()
          }
        });
      }

      // 记录参与行为
      await wx.cloud.callFunction({
        name: 'quickstartFunctions',
        data: {
          type: 'logUserAction',
          action: actionType,
          details: {
            dragonId: this.data.dragonId,
            dragonTitle: this.data.dragon.title,
            itemCount: participationData.items.length,
            totalAmount: participationData.totalAmount,
            hasRemark: !!participationData.remark,
            isUpdate: !!existingParticipant
          },
          page: 'participate'
        }
      });
      wx.hideLoading();
      wx.showToast({ title: '参与成功' });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error) {
      console.error('参与失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '参与失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  }
});