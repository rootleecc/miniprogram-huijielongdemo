# 接龙购物小程序 - 数据库字段类型定义

## 📋 **数据库集合结构**

### **1. `users` 集合（用户信息表）**

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `_id` | String | 是 | - | 文档ID，使用用户的openid |
| `openid` | String | 是 | - | 微信用户唯一标识 |
| `nickName` | String | 是 | - | 用户昵称 |
| `avatarUrl` | String | 否 | '' | 用户头像URL |
| `gender` | Number | 否 | 0 | 性别：0-未知，1-男，2-女 |
| `city` | String | 否 | '' | 城市 |
| `province` | String | 否 | '' | 省份 |
| `country` | String | 否 | '' | 国家 |
| `language` | String | 否 | 'zh_CN' | 语言 |
| `createTime` | String | 是 | - | 创建时间（ISO字符串） |
| `updateTime` | String | 是 | - | 更新时间（ISO字符串） |
| `firstLoginTime` | String | 否 | - | 首次登录时间（ISO字符串） |
| `lastLoginTime` | String | 否 | - | 最后登录时间（ISO字符串） |
| `lastAccessTime` | String | 否 | - | 最后访问时间（ISO字符串） |
| `loginCount` | Number | 否 | 1 | 登录次数 |

**示例数据：**
```json
{
  "_id": "oABC123456789",
  "openid": "oABC123456789",
  "nickName": "张三",
  "avatarUrl": "https://wx.qlogo.cn/mmopen/...",
  "gender": 1,
  "city": "深圳",
  "province": "广东",
  "country": "中国",
  "language": "zh_CN",
  "createTime": "2025-01-09T10:00:00.000Z",
  "updateTime": "2025-01-09T10:00:00.000Z",
  "firstLoginTime": "2025-01-09T10:00:00.000Z",
  "lastLoginTime": "2025-01-09T10:00:00.000Z",
  "lastAccessTime": "2025-01-09T10:00:00.000Z",
  "loginCount": 5
}
```

---

### **2. `user_logs` 集合（用户行为日志表）**

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `_id` | String | 是 | - | 文档ID（自动生成） |
| `openid` | String | 是 | - | 用户openid |
| `action` | String | 是 | - | 行为类型 |
| `details` | Object | 否 | {} | 行为详情 |
| `timestamp` | String | 是 | - | 时间戳（ISO字符串） |
| `userAgent` | String | 否 | '' | 设备信息 |
| `page` | String | 否 | '' | 页面名称 |

**行为类型 (`action`) 枚举：**
- `login` - 用户登录
- `app_visit` - 访问应用
- `create_dragon` - 创建接龙
- `participate_dragon` - 参与接龙
- `update_participation` - 更新参与信息
- `view_dragon_detail` - 查看接龙详情
- `click_participate` - 点击参与按钮
- `contact_creator` - 联系发起人
- `contact_service` - 联系客服
- `view_about` - 查看关于我们
- `export_data` - 导出数据
- `preview_image` - 预览图片

**示例数据：**
```json
{
  "_id": "log_123456789",
  "openid": "oABC123456789",
  "action": "create_dragon",
  "details": {
    "dragonId": "dragon_001",
    "title": "水果团购",
    "goodsCount": 2,
    "hasImages": true,
    "isFirstDragon": false
  },
  "timestamp": "2025-01-09T10:30:00.000Z",
  "userAgent": "ios",
  "page": "create"
}
```

---

### **3. `dragons` 集合（接龙数据表）**

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `_id` | String | 是 | - | 文档ID（自动生成） |
| `title` | String | 是 | - | 接龙标题 |
| `description` | String | 是 | - | 接龙描述 |
| `deadline` | String | 否 | - | 截止日期（YYYY-MM-DD格式） |
| `contactInfo` | String | 是 | - | 联系方式 |
| `goods` | Array | 是 | [] | 商品列表 |
| `creatorOpenId` | String | 是 | - | 创建者openid |
| `creatorName` | String | 是 | - | 创建者昵称 |
| `creatorAvatar` | String | 否 | '' | 创建者头像 |
| `status` | String | 否 | 'active' | 状态：active-进行中，ended-已结束 |
| `participantCount` | Number | 否 | 0 | 参与人数 |
| `participants` | Array | 否 | [] | 参与者列表 |
| `createTime` | String | 是 | - | 创建时间 |
| `updateTime` | String | 是 | - | 更新时间 |

#### **3.1 `goods` 数组元素结构：**

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `name` | String | 是 | - | 商品名称 |
| `price` | String | 是 | - | 商品价格（字符串格式） |
| `unit` | String | 否 | '件' | 商品单位 |
| `description` | String | 否 | '' | 商品描述 |
| `images` | Array | 否 | [] | 商品图片URL数组 |

#### **3.2 `participants` 数组元素结构：**

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `openid` | String | 是 | - | 参与者openid |
| `name` | String | 是 | - | 参与者昵称 |
| `avatar` | String | 否 | '' | 参与者头像 |
| `contactInfo` | String | 是 | - | 联系方式 |
| `remark` | String | 否 | '' | 备注信息 |
| `items` | Array | 是 | [] | 购买商品列表 |
| `totalAmount` | Number | 是 | 0 | 总金额 |
| `participateTime` | String | 是 | - | 参与时间 |

#### **3.3 `participants.items` 数组元素结构：**

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `goodsIndex` | Number | 是 | - | 商品在goods数组中的索引 |
| `goodsName` | String | 是 | - | 商品名称 |
| `price` | Number | 是 | - | 商品单价 |
| `unit` | String | 是 | - | 商品单位 |
| `quantity` | Number | 是 | - | 购买数量 |
| `subtotal` | String | 是 | - | 小计金额（字符串格式） |

**示例数据：**
```json
{
  "_id": "dragon_001",
  "title": "新鲜水果团购",
  "description": "优质进口水果，产地直供，新鲜美味！",
  "deadline": "2025-01-15",
  "contactInfo": "微信：fruit123",
  "goods": [
    {
      "name": "进口苹果",
      "price": "15.8",
      "unit": "斤",
      "description": "新西兰进口，脆甜多汁",
      "images": [
        "cloud://xxx/apple1.jpg",
        "cloud://xxx/apple2.jpg"
      ]
    }
  ],
  "creatorOpenId": "oABC123456789",
  "creatorName": "水果小店",
  "creatorAvatar": "https://wx.qlogo.cn/mmopen/...",
  "status": "active",
  "participantCount": 1,
  "participants": [
    {
      "openid": "oDEF987654321",
      "name": "张三",
      "avatar": "https://wx.qlogo.cn/mmopen/...",
      "contactInfo": "微信：zhangsan123",
      "remark": "要甜一点的苹果",
      "items": [
        {
          "goodsIndex": 0,
          "goodsName": "进口苹果",
          "price": 15.8,
          "unit": "斤",
          "quantity": 2,
          "subtotal": "31.60"
        }
      ],
      "totalAmount": 31.60,
      "participateTime": "2025-01-09T10:30:00"
    }
  ],
  "createTime": "2025-01-09T09:00:00",
  "updateTime": "2025-01-09T10:30:00"
}
```

---

## 🔧 **数据库索引建议**

为了提高查询性能，建议创建以下索引：

### **users 集合索引：**
- `openid`（唯一索引）
- `createTime`（降序）
- `lastLoginTime`（降序）

### **user_logs 集合索引：**
- `openid`（普通索引）
- `timestamp`（降序）
- `action`（普通索引）
- 复合索引：`openid + timestamp`（降序）

### **dragons 集合索引：**
- `creatorOpenId`（普通索引）
- `status`（普通索引）
- `createTime`（降序）
- `updateTime`（降序）
- `participants.openid`（普通索引）
- 复合索引：`status + createTime`（降序）

---

## 📝 **数据类型说明**

1. **String**: 字符串类型，用于文本数据
2. **Number**: 数字类型，包括整数和浮点数
3. **Array**: 数组类型，包含多个元素
4. **Object**: 对象类型，包含键值对
5. **Boolean**: 布尔类型，true或false

---

## ⚠️ **注意事项**

1. **时间格式**: 统一使用ISO 8601格式的字符串
2. **价格存储**: 商品价格在goods中存储为字符串，在计算时转换为数字
3. **openid**: 作为用户唯一标识，在users表中作为文档ID
4. **数组索引**: participants.items中的goodsIndex对应goods数组的索引
5. **状态枚举**: dragon的status字段只能是'active'或'ended'
6. **必填验证**: 在前端和云函数中都要进行必填字段验证