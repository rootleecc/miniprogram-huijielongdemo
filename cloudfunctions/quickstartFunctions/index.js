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
    console.log('=== getUserInfo云函数开始 ===');
    const wxContext = cloud.getWXContext();
    console.log('OpenID:', wxContext.OPENID);
    console.log('传入的用户信息:', event.userInfo);
    
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
        updateTime: new Date().toISOString(),
        lastLoginTime: new Date().toISOString(),
        loginCount: 1
      };
      
      console.log('准备保存的用户信息:', userInfo);
      
      // 保存或更新用户信息到数据库
      try {
        // 先检查用户是否已存在
        let existingUser = null;
        let isNewUser = false;
        
        try {
          console.log('检查用户是否已存在...');
          existingUser = await db.collection('users').doc(wxContext.OPENID).get();
          console.log('现有用户信息:', existingUser.data);
        } catch (getUserError) {
          // 用户不存在或集合不存在
          console.log('用户不存在或集合不存在:', getUserError.errCode);
          isNewUser = true;
        }
        
        if (existingUser && existingUser.data) {
          // 用户已存在，更新信息并增加登录次数
          console.log('更新现有用户信息...');
          await db.collection('users').doc(wxContext.OPENID).update({
            data: {
              ...userInfo,
              loginCount: db.command.inc(1),
              lastLoginTime: new Date().toISOString(),
              updateTime: new Date().toISOString()
            }
          });
          console.log('用户信息更新成功');
        } else {
          isNewUser = true;
          // 新用户，创建记录
          console.log('创建新用户记录...');
          await db.collection('users').doc(wxContext.OPENID).set({
            data: {
              ...userInfo,
              createTime: new Date().toISOString(),
              firstLoginTime: new Date().toISOString()
            }
          });
          console.log('新用户创建成功');
        }
      } catch (dbError) {
        // 如果集合不存在，先创建
        console.log('数据库操作错误:', dbError.errCode, dbError.message);
        if (dbError.errCode === -502005) {
          isNewUser = true;
          console.log('集合不存在，创建users集合...');
          await db.createCollection('users');
          console.log('users集合创建成功，重新保存用户信息...');
          await db.collection('users').doc(wxContext.OPENID).set({
            data: {
              ...userInfo,
              createTime: new Date().toISOString(),
              firstLoginTime: new Date().toISOString()
            }
          });
          console.log('用户信息保存成功');
        } else {
          console.error('数据库操作失败:', dbError);
          throw dbError;
        }
      }
      
      console.log('=== 用户信息保存完成 ===');
      return {
        success: true,
        userInfo: userInfo,
        openid: wxContext.OPENID,
        isNewUser: isNewUser
      };
    } else {
      // 从数据库获取用户信息
      console.log('从数据库获取用户信息...');
      try {
        const result = await db.collection('users').doc(wxContext.OPENID).get();
        
        // 更新最后访问时间
        if (result.data) {
          console.log('更新最后访问时间...');
          try {
            await db.collection('users').doc(wxContext.OPENID).update({
              data: {
                lastAccessTime: new Date().toISOString()
              }
            });
          } catch (updateError) {
            console.log('更新访问时间失败:', updateError);
            // 不影响主流程，继续执行
          }
        }
        
        console.log('用户信息获取成功:', result.data);
        return {
          success: true,
          userInfo: result.data,
          openid: wxContext.OPENID
        };
      } catch (error) {
        // 如果是集合不存在的错误
        console.log('获取用户信息失败:', error.errCode, error.message);
        if (error.errCode === -502005) {
          return {
            success: false,
            message: '用户集合不存在',
            openid: wxContext.OPENID
          };
        }
        return {
          success: false,
          message: '用户信息不存在',
          openid: wxContext.OPENID
        };
      }
    }
  } catch (error) {
    console.error('getUserInfo云函数错误:', error);
    return {
      success: false,
      error: error.message,
      openid: wxContext.OPENID
    };
  }
};

// 记录用户行为日志
const logUserAction = async (event) => {
  try {
    console.log('=== 记录用户行为 ===');
    const wxContext = cloud.getWXContext();
    console.log('行为类型:', event.action);
    console.log('OpenID:', wxContext.OPENID);
    
    const logData = {
      openid: wxContext.OPENID,
      action: event.action, // 'login', 'create_dragon', 'participate', 'view_detail' 等
      details: event.details || {},
      timestamp: new Date().toISOString(),
      userAgent: event.userAgent || '',
      page: event.page || ''
    };
    
    console.log('日志数据:', logData);
    
    try {
      await db.collection('user_logs').add({
        data: logData
      });
      console.log('用户行为记录成功');
    } catch (dbError) {
      // 如果集合不存在，先创建
      console.log('user_logs集合不存在，创建集合...');
      if (dbError.errCode === -502005) {
        await db.createCollection('user_logs');
        console.log('user_logs集合创建成功，重新记录日志...');
        await db.collection('user_logs').add({
          data: logData
        });
        console.log('用户行为记录成功');
      } else {
        console.error('记录用户行为失败:', dbError);
        throw dbError;
      }
    }
    
    return {
      success: true,
      message: '行为日志记录成功'
    };
  } catch (error) {
    console.error('记录用户行为失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 获取用户统计信息
const getUserStats = async () => {
  try {
    const wxContext = cloud.getWXContext();
    
    // 获取用户基本信息
    let userInfo = null;
    try {
      userInfo = await db.collection('users').doc(wxContext.OPENID).get();
    } catch (error) {
      console.log('获取用户信息失败:', error);
    }
    
    // 获取用户发起的接龙数量
    let myDragonsCount = { total: 0 };
    try {
      myDragonsCount = await db.collection('dragons')
        .where({
          creatorOpenId: wxContext.OPENID
        })
        .count();
    } catch (error) {
      console.log('获取接龙数量失败:', error);
    }
    
    // 获取用户参与的接龙数量
    let myParticipationsCount = { total: 0 };
    try {
      myParticipationsCount = await db.collection('dragons')
        .where({
          'participants.openid': wxContext.OPENID
        })
        .count();
    } catch (error) {
      console.log('获取参与数量失败:', error);
    }
    
    // 获取最近的行为日志
    let recentLogs = { data: [] };
    try {
      recentLogs = await db.collection('user_logs')
        .where({
          openid: wxContext.OPENID
        })
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
    } catch (error) {
      console.log('获取行为日志失败:', error);
    }
    
    return {
      success: true,
      data: {
        userInfo: userInfo ? userInfo.data : null,
        myDragonsCount: myDragonsCount.total,
        myParticipationsCount: myParticipationsCount.total,
        recentActions: recentLogs.data,
        openid: wxContext.OPENID
      }
    };
  } catch (error) {
    console.error('获取用户统计信息失败:', error);
    return {
      success: false,
      error: error.message,
      openid: cloud.getWXContext().OPENID
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
      }
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
      }
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

// 创建用户信息表
const createUsersCollection = async () => {
  try {
    // 创建 users 集合
    await db.createCollection("users");
    return {
      success: true,
      message: "users集合创建成功"
    };
  } catch (e) {
    // 如果集合已经存在，返回成功
    return {
      success: true,
      message: "users集合已存在或创建成功"
    };
  }
};

// 创建用户行为日志表
const createUserLogsCollection = async () => {
  try {
    // 创建 user_logs 集合
    await db.createCollection("user_logs");
    return {
      success: true,
      message: "user_logs集合创建成功"
    };
  } catch (e) {
    // 如果集合已经存在，返回成功
    return {
      success: true,
      message: "user_logs集合已存在或创建成功"
    };
  }
};

// 初始化所有数据库表
const initializeDatabase = async () => {
  try {
    const results = [];
    
    // 创建所有必要的集合
    const dragonsResult = await createDragonsCollection();
    results.push(dragonsResult);
    
    const usersResult = await createUsersCollection();
    results.push(usersResult);
    
    const userLogsResult = await createUserLogsCollection();
    results.push(userLogsResult);
    
    return {
      success: true,
      message: "数据库初始化完成",
      details: results
    };
  } catch (error) {
    console.error('数据库初始化错误:', error);
    return {
      success: false,
      message: "数据库初始化失败",
      error: error.message || '未知错误'
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
      }
    });
    await db.collection("sales").add({
      data: {
        region: "华南",
        city: "广州",
        sales: 22,
      }
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

// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case "getOpenId":
      return await getOpenId();
    case "getUserInfo":
      return await getUserInfo(event);
    case "logUserAction":
      return await logUserAction(event);
    case "getUserStats":
      return await getUserStats();
    case "getMiniProgramCode":
      return await getMiniProgramCode();
    case "createCollection":
      return await createCollection();
    case "createDragonsCollection":
      return await createDragonsCollection();
    case "createUsersCollection":
      return await createUsersCollection();
    case "createUserLogsCollection":
      return await createUserLogsCollection();
    case "initializeDatabase":
      return await initializeDatabase();
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
