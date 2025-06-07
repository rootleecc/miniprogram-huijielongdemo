// pages/create/create.js
Page({
  data: {
    title: '',
    description: '',
    endTime: '',
    deadline: '',
    contactInfo: '',
    goods: [
      {
        name: '',
        price: '',
        unit: '件',
        description: '',
        images: []
      }
    ],
    submitting: false
  },

  onLoad() {
    // 设置默认截止时间为明天
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDeadline = this.formatDate(tomorrow);
    this.setData({ deadline: defaultDeadline });
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 输入事件处理
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  onContactInput(e) {
    this.setData({ contactInfo: e.detail.value });
  },

  onDeadlineChange(e) {
    this.setData({ deadline: e.detail.value });
  },

  // 商品相关操作
  onGoodsNameInput(e) {
    const index = e.currentTarget.dataset.index;
    const goods = this.data.goods;
    goods[index].name = e.detail.value;
    this.setData({ goods });
  },

  onGoodsPriceInput(e) {
    const index = e.currentTarget.dataset.index;
    const goods = this.data.goods;
    goods[index].price = e.detail.value;
    this.setData({ goods });
  },

  onGoodsUnitInput(e) {
    const index = e.currentTarget.dataset.index;
    const goods = this.data.goods;
    goods[index].unit = e.detail.value;
    this.setData({ goods });
  },

  onGoodsDescInput(e) {
    const index = e.currentTarget.dataset.index;
    const goods = this.data.goods;
    goods[index].description = e.detail.value;
    this.setData({ goods });
  },

  // 添加商品
  addGoods() {
    const goods = this.data.goods;
    goods.push({
      name: '',
      price: '',
      unit: '件',
      description: '',
      images: []
    });
    this.setData({ goods });
  },

  // 删除商品
  removeGoods(e) {
    const index = e.currentTarget.dataset.index;
    if (this.data.goods.length <= 1) {
      wx.showToast({
        title: '至少保留一个商品',
        icon: 'none'
      });
      return;
    }
    const goods = this.data.goods;
    goods.splice(index, 1);
    this.setData({ goods });
  },

  // 上传图片
  uploadImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.chooseMedia({
      count: 3,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        wx.showLoading({ title: '上传中...' });
        
        const uploadPromises = res.tempFiles.map(file => {
          return wx.cloud.uploadFile({
            cloudPath: `goods/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
            filePath: file.tempFilePath
          });
        });

        Promise.all(uploadPromises).then(results => {
          const goods = this.data.goods;
          const imageUrls = results.map(result => result.fileID);
          goods[index].images = goods[index].images.concat(imageUrls);
          this.setData({ goods });
          wx.hideLoading();
          wx.showToast({ title: '上传成功' });
        }).catch(error => {
          wx.hideLoading();
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        });
      }
    });
  },

  // 删除图片
  removeImage(e) {
    const { goodsIndex, imageIndex } = e.currentTarget.dataset;
    const goods = this.data.goods;
    goods[goodsIndex].images.splice(imageIndex, 1);
    this.setData({ goods });
  },

  // 表单验证
  validateForm() {
    const { title, description, contactInfo, goods } = this.data;
    
    if (!title.trim()) {
      wx.showToast({ title: '请输入接龙标题', icon: 'none' });
      return false;
    }
    
    if (!description.trim()) {
      wx.showToast({ title: '请输入接龙描述', icon: 'none' });
      return false;
    }
    
    if (!contactInfo.trim()) {
      wx.showToast({ title: '请输入联系方式', icon: 'none' });
      return false;
    }
    
    for (let i = 0; i < goods.length; i++) {
      const item = goods[i];
      if (!item.name.trim()) {
        wx.showToast({ title: `请输入第${i+1}个商品名称`, icon: 'none' });
        return false;
      }
      if (!item.price.trim()) {
        wx.showToast({ title: `请输入第${i+1}个商品价格`, icon: 'none' });
        return false;
      }
    }
    
    return true;
  },

  // 提交表单
  async submitForm() {
    if (!this.validateForm()) return;
    if (this.data.submitting) return;

    this.setData({ submitting: true });
    wx.showLoading({ title: '发布中...' });

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

      // 创建接龙记录
      const db = wx.cloud.database();
      const dragonData = {
        title: this.data.title.trim(),
        description: this.data.description.trim(),
        deadline: this.data.deadline,
        contactInfo: this.data.contactInfo.trim(),
        goods: this.data.goods.filter(item => item.name.trim()),
        creatorOpenId: app.globalData.openid,
        creatorName: app.globalData.userInfo?.nickName || '匿名用户',
        creatorAvatar: app.globalData.userInfo?.avatarUrl || '',
        status: 'active',
        participantCount: 0,
        participants: [],
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString()
      };

      await db.collection('dragons').add({ data: dragonData });

      wx.hideLoading();
      wx.showToast({ title: '发布成功' });
      
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);

    } catch (error) {
      console.error('发布失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '发布失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  }
});