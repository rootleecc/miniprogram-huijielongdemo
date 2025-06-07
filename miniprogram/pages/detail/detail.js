// pages/detail/detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    dragon: null,
    isParticipated: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const db = wx.cloud.database()
    db.collection('dragons').doc(options.id).get({
      success: res => {
        this.setData({
          dragon: res.data,
          isParticipated: res.data.participants.some(
            p => p.openid === getApp().globalData.openid
          )
        });
      }
    });
  },

  participate() {
    wx.navigateTo({
      url: `/pages/participate?id=${this.data.dragon._id}`
    });
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