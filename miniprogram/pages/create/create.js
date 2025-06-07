// pages/create.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: '',
    desc: '',
    endTime: '',
    items: ['']
  },
  addItem() {
    this.setData({
      items: [...this.data.items, '']
    });
  },
  
  removeItem(e) {
    const index = e.currentTarget.dataset.index;
    const items = this.data.items.filter((_, i) => i !== index);
    this.setData({ items });
  },
  
  submitForm() {
    wx.cloud.callFunction({
      name: 'createDragon',
      data: {
        title: this.data.title,
        desc: this.data.desc,
        endTime: this.data.endTime,
        items: this.data.items.filter(item => item.trim()),
        creator: getApp().globalData.openid
      },
      success: res => {
        wx.navigateBack();
      }
    });
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})