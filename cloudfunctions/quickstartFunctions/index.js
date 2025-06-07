const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 获取openid
const getOpenId = async () => {
  // 获取基础信息
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};

// 获取用户信息（通过云函数）
const getUserInfo = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    
    // 如果传入了用户信息，保存到数据库
    if (event.userInfo) {
      const userInfo = {
        openid: wxContext.OPENID,
        nickName: event.userInfo.nickName,
        avatarUrl: event.userInfo.avatarUrl,
        gender: event.userInfo.gender || 0,
        city: event.userInfo.city || '',
        province: event.userInfo.province || '',
        country: event.userInfo.country || '',
        language: event.userInfo.language || 'zh_CN',
        updateTime: new Date().toISOString()
      };
      
      // 保存或更新用户信息到数据库
      try {
        await db.collection('users').doc(wxContext.OPENID).set({
          data: userInfo
        });
      } catch (dbError) {
        // 如果集合不存在，先创建
        if (dbError.errCode === -502005) {
          await db.createCollection('users');
          await db.collection('users').doc(wxContext.OPENID).set({
            data: userInfo
          });
        }
      }
      
      return {
        success: true,
        userInfo: userInfo,
        openid: wxContext.OPENID
      };
    } else {
      // 从数据库获取用户信息
      try {
        const result = await db.collection('users').doc(wxContext.OPENID).get();
        return {
          success: true,
          userInfo: result.data,
          openid: wxContext.OPENID
        };
      } catch (error) {
        return {
          success: false,
          message: '用户信息不存在',
          openid: wxContext.OPENID
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      openid: wxContext.OPENID
    };
  }
};

// 获取小程序二维码
const getMiniProgramCode = async () => {
  // 获取小程序二维码的buffer
  const resp = await cloud.openapi.wxacode.get({
    path: "pages/index/index",
  });
  const { buffer } = resp;
  // 将图片上传云存储空间
  const upload = await cloud.uploadFile({
    cloudPath: "code.png",
    fileContent: buffer,
  });
  return upload.fileID;
};

// 创建集合
const createCollection = async () => {
  try {
    // 创建 dragons 集合并添加示例数据（仅用于演示）
    await db.createCollection("dragons");
    
    // 添加示例接龙数据
    await db.collection("dragons").add({
      data: {
        title: "新鲜水果团购",
        description: "优质进口水果，产地直供，新鲜美味！",
        deadline: "2025-01-15",
        contactInfo: "微信：fruit123",
        goods: [
          {
            name: "进口苹果",
            price: "15.8",
            unit: "斤",
            description: "新西兰进口，脆甜多汁",
            images: []
          },
          {
            name: "泰国榴莲",
            price: "68.0",
            unit: "个",
            description: "金枕头榴莲，肉厚香甜",
            images: []
          }
        ],
        creatorOpenId: "demo_openid_001",
        creatorName: "水果小店",
        creatorAvatar: "",
        status: "active",
        participantCount: 3,
        participants: [
          {
            openid: "demo_participant_001",
            name: "张三",
            avatar: "",
            contactInfo: "微信：zhangsan123",
            remark: "要甜一点的苹果",
            items: [
              {
                goodsIndex: 0,
                goodsName: "进口苹果",
                price: 15.8,
                unit: "斤",
                quantity: 2,
                subtotal: "31.60"
              }
            ],
            totalAmount: 31.60,
            participateTime: "2025-01-08 10:30:00"
          },
          {
            openid: "demo_participant_002",
            name: "李四",
            avatar: "",
            contactInfo: "手机：13800138000",
            remark: "",
            items: [
              {
                goodsIndex: 1,
                goodsName: "泰国榴莲",
                price: 68.0,
                unit: "个",
                quantity: 1,
                subtotal: "68.00"
              }
            ],
            totalAmount: 68.00,
            participateTime: "2025-01-08 14:20:00"
          },
          {
            openid: "demo_participant_003",
            name: "王五",
            avatar: "",
            contactInfo: "微信：wangwu456",
            remark: "苹果和榴莲都要",
            items: [
              {
                goodsIndex: 0,
                goodsName: "进口苹果",
                price: 15.8,
                unit: "斤",
                quantity: 1,
                subtotal: "15.80"
              },
              {
                goodsIndex: 1,
                goodsName: "泰国榴莲",
                price: 68.0,
                unit: "个",
                quantity: 1,
                subtotal: "68.00"
              }
            ],
            totalAmount: 83.80,
            participateTime: "2025-01-08 16:45:00"
          }
        ],
        createTime: "2025-01-08 09:00:00",
        updateTime: "2025-01-08 16:45:00"
      },
    });
    
    // 添加第二个示例接龙
    await db.collection("dragons").add({
      data: {
        title: "办公用品团购",
        description: "办公室必备用品，批量采购更优惠！",
        deadline: "2025-01-20",
        contactInfo: "QQ：888888",
        goods: [
          {
            name: "A4复印纸",
            price: "25.0",
            unit: "包",
            description: "70g白色复印纸，500张/包",
            images: []
          },
          {
            name: "中性笔",
            price: "2.5",
            unit: "支",
            description: "0.5mm黑色中性笔",
            images: []
          }
        ],
        creatorOpenId: "demo_openid_002",
        creatorName: "办公小助手",
        creatorAvatar: "",
        status: "active",
        participantCount: 1,
        participants: [
          {
            openid: "demo_participant_004",
            name: "赵六",
            avatar: "",
            contactInfo: "微信：zhaoliu789",
            remark: "需要蓝色中性笔",
            items: [
              {
                goodsIndex: 0,
                goodsName: "A4复印纸",
                price: 25.0,
                unit: "包",
                quantity: 2,
                subtotal: "50.00"
              },
              {
                goodsIndex: 1,
                goodsName: "中性笔",
                price: 2.5,
                unit: "支",
                quantity: 10,
                subtotal: "25.00"
              }
            ],
            totalAmount: 75.00,
            participateTime: "2025-01-08 11:15:00"
          }
        ],
        createTime: "2025-01-08 10:00:00",
        updateTime: "2025-01-08 11:15:00"
      },
    });
    
    return {
      success: true,
      message: "dragons集合创建成功，已添加示例数据"
    };
  } catch (e) {
    // 如果集合已经存在，返回成功
    return {
      success: true,
      message: "dragons集合已存在或创建成功"
    };
  }
};

// 创建 dragons 集合（不包含示例数据）
const createDragonsCollection = async () => {
  try {
    // 仅创建集合，不添加示例数据
    await db.createCollection("dragons");
    return {
      success: true,
      message: "dragons集合创建成功"
    };
  } catch (e) {
    // 如果集合已经存在，返回成功
    return {
      success: true,
      message: "dragons集合已存在或创建成功"
    };
  }
};

// 创建销售数据集合（保留原有功能）
const createSalesCollection = async () => {
  try {
    // 创建集合
    await db.createCollection("sales");
    await db.collection("sales").add({
      data: {
        region: "华东",
        city: "上海",
        sales: 11,
      },
    });
    await db.collection("sales").add({
      data: {
        region: "华南",
        city: "广州",
        sales: 22,
      },
    });
    return {
      success: true,
    };
  } catch (e) {
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: true,
      data: "create collection success",
    };
  }
};

// 查询数据
const selectRecord = async () => {
  // 返回数据库查询结果
  return await db.collection("sales").get();
};

// 更新数据
const updateRecord = async (event) => {
  try {
    // 遍历修改数据库信息
    for (let i = 0; i < event.data.length; i++) {
      await db
        .collection("sales")
        .where({
          _id: event.data[i]._id,
        })
        .update({
          data: {
            sales: event.data[i].sales,
          },
        });
    }
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 新增数据
const insertRecord = async (event) => {
  try {
    const insertRecord = event.data;
    // 插入数据
    await db.collection("sales").add({
      data: {
        region: insertRecord.region,
        city: insertRecord.city,
        sales: Number(insertRecord.sales),
      },
    });
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 删除数据
const deleteRecord = async (event) => {
  try {
    await db
      .collection("sales")
      .where({
        _id: event.data._id,
      })
      .remove();
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// const getOpenId = require('./getOpenId/index');
// const getMiniProgramCode = require('./getMiniProgramCode/index');
// const createCollection = require('./createCollection/index');
// const selectRecord = require('./selectRecord/index');
// const updateRecord = require('./updateRecord/index');
// const sumRecord = require('./sumRecord/index');
// const fetchGoodsList = require('./fetchGoodsList/index');
// const genMpQrcode = require('./genMpQrcode/index');
// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case "getOpenId":
      return await getOpenId();
    case "getUserInfo":
      return await getUserInfo(event);
    case "getMiniProgramCode":
      return await getMiniProgramCode();
    case "createCollection":
      return await createCollection();
    case "createDragonsCollection":
      return await createDragonsCollection();
    case "createSalesCollection":
      return await createSalesCollection();
    case "selectRecord":
      return await selectRecord();
    case "updateRecord":
      return await updateRecord(event);
    case "insertRecord":
      return await insertRecord(event);
    case "deleteRecord":
      return await deleteRecord(event);
  }
};
