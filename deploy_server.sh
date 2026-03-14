#!/bin/bash

# ============================================
# 视频生成小程序后端服务 - 一键部署脚本
# ============================================

set -e

echo "=========================================="
echo "开始部署视频生成小程序后端服务"
echo "=========================================="

# 进入项目目录
cd /root/video-app/server

# ============================================
# 步骤 1：创建数据库表
# ============================================
echo ""
echo "步骤 1/8：创建数据库表..."

sqlite3 /tmp/coze-mini-program.db << 'EOF'
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openid TEXT UNIQUE NOT NULL,
  session_key TEXT,
  is_member INTEGER DEFAULT 0,
  member_expire_time INTEGER,
  free_count INTEGER DEFAULT 3,
  used_count INTEGER DEFAULT 0,
  daily_used_count INTEGER DEFAULT 0,
  last_reset_date TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 视频生成记录表
CREATE TABLE IF NOT EXISTS video_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openid TEXT NOT NULL,
  image_urls TEXT NOT NULL,
  video_url TEXT,
  status TEXT DEFAULT 'pending',
  error_msg TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
EOF

echo "✅ 数据库表创建完成"

# ============================================
# 步骤 2：创建用户服务
# ============================================
echo ""
echo "步骤 2/8：创建用户服务..."

cat > src/user/user.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as path from 'path';

@Injectable()
export class UserService {
  private db: Database.Database;

  constructor() {
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/coze-mini-program.db');
    this.db = new Database(dbPath);
  }

  // 根据openid查找用户
  findByOpenid(openid: string) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE openid = ?');
    return stmt.get(openid);
  }

  // 创建用户
  create(data: { openid: string; session_key?: string }) {
    const stmt = this.db.prepare(`
      INSERT INTO users (openid, session_key, free_count, used_count, is_member)
      VALUES (?, ?, 3, 0, 0)
    `);
    const result = stmt.run(data.openid, data.session_key || null);

    return this.findByOpenid(data.openid);
  }

  // 更新用户信息
  update(openid: string, data: any) {
    const fields = [];
    const values = [];

    if (data.session_key !== undefined) {
      fields.push('session_key = ?');
      values.push(data.session_key);
    }
    if (data.is_member !== undefined) {
      fields.push('is_member = ?');
      values.push(data.is_member);
    }
    if (data.member_expire_time !== undefined) {
      fields.push('member_expire_time = ?');
      values.push(data.member_expire_time);
    }
    if (data.free_count !== undefined) {
      fields.push('free_count = ?');
      values.push(data.free_count);
    }
    if (data.used_count !== undefined) {
      fields.push('used_count = ?');
      values.push(data.used_count);
    }
    if (data.daily_used_count !== undefined) {
      fields.push('daily_used_count = ?');
      values.push(data.daily_used_count);
    }
    if (data.last_reset_date !== undefined) {
      fields.push('last_reset_date = ?');
      values.push(data.last_reset_date);
    }

    fields.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));

    values.push(openid);

    const stmt = this.db.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE openid = ?
    `);
    stmt.run(...values);

    return this.findByOpenid(openid);
  }

  // 检查用户是否有生成次数
  checkQuota(openid: string) {
    const user = this.findByOpenid(openid);

    if (!user) {
      return { canGenerate: false, reason: '用户不存在' };
    }

    // 检查会员是否过期
    const now = Math.floor(Date.now() / 1000);
    if (user.is_member && user.member_expire_time && user.member_expire_time < now) {
      // 会员过期，重置会员状态
      this.update(openid, { is_member: 0, member_expire_time: null, daily_used_count: 0 });
      user.is_member = 0;
    }

    // 检查每日次数是否需要重置
    const today = new Date().toISOString().split('T')[0];
    if (user.is_member && user.last_reset_date !== today) {
      // 重置每日次数
      this.update(openid, { daily_used_count: 0, last_reset_date: today });
      user.daily_used_count = 0;
    }

    if (user.is_member) {
      // 会员用户：每天10次
      const remainingCount = 10 - user.daily_used_count;
      return {
        canGenerate: remainingCount > 0,
        remainingCount,
        totalDailyCount: 10,
        usedCount: user.daily_used_count,
        isMember: true
      };
    } else {
      // 免费用户：总共3次
      const remainingCount = user.free_count - user.used_count;
      return {
        canGenerate: remainingCount > 0,
        remainingCount,
        totalFreeCount: user.free_count,
        usedCount: user.used_count,
        isMember: false
      };
    }
  }

  // 增加使用次数
  incrementUsedCount(openid: string) {
    const user = this.findByOpenid(openid);

    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.is_member) {
      // 会员用户：增加每日次数
      return this.update(openid, {
        daily_used_count: user.daily_used_count + 1
      });
    } else {
      // 免费用户：增加总次数
      return this.update(openid, {
        used_count: user.used_count + 1
      });
    }
  }

  // 开通会员
  upgradeMember(openid: string, days: number = 365) {
    const user = this.findByOpenid(openid);

    if (!user) {
      throw new Error('用户不存在');
    }

    const now = Math.floor(Date.now() / 1000);
    const memberExpireTime = now + (days * 24 * 60 * 60);

    return this.update(openid, {
      is_member: 1,
      member_expire_time: memberExpireTime,
      daily_used_count: 0,
      last_reset_date: new Date().toISOString().split('T')[0]
    });
  }
}
EOF

echo "✅ 用户服务创建完成"

# ============================================
# 步骤 3：创建用户控制器
# ============================================
echo ""
echo "步骤 3/8：创建用户控制器..."

cat > src/user/user.controller.ts << 'EOF'
import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { WechatService } from '../wechat/wechat.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly wechatService: WechatService,
  ) {}

  // 微信登录
  @Post('login')
  async login(@Body() body: { code: string }) {
    try {
      // 1. 使用 code 换取 openid 和 session_key
      const { openid, session_key } = await this.wechatService.code2session(body.code);

      // 2. 查询或创建用户
      let user = this.userService.findByOpenid(openid);

      if (!user) {
        user = this.userService.create({
          openid,
          session_key,
        });
      } else {
        // 更新 session_key
        this.userService.update(openid, { session_key });
      }

      // 3. 返回用户信息
      return {
        code: 200,
        msg: 'success',
        data: {
          openid: user.openid,
          isMember: user.is_member === 1,
          memberExpireTime: user.member_expire_time,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        code: 500,
        msg: error.message,
        data: null,
      };
    }
  }

  // 查询用户次数
  @Get('quota')
  async getQuota(@Query('openid') openid: string) {
    try {
      const result = this.userService.checkQuota(openid);

      return {
        code: 200,
        msg: 'success',
        data: result,
      };
    } catch (error) {
      console.error('Get quota error:', error);
      return {
        code: 500,
        msg: error.message,
        data: null,
      };
    }
  }

  // 开通会员
  @Post('upgrade-member')
  async upgradeMember(@Body() body: { openid: string; days?: number }) {
    try {
      const user = this.userService.upgradeMember(body.openid, body.days || 365);

      return {
        code: 200,
        msg: 'success',
        data: {
          isMember: true,
          memberExpireTime: user.member_expire_time,
        },
      };
    } catch (error) {
      console.error('Upgrade member error:', error);
      return {
        code: 500,
        msg: error.message,
        data: null,
      };
    }
  }
}
EOF

echo "✅ 用户控制器创建完成"

# ============================================
# 步骤 4：创建微信服务
# ============================================
echo ""
echo "步骤 4/8：创建微信服务..."

cat > src/wechat/wechat.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WechatService {
  private appId = process.env.WECHAT_APPID || 'wx4b20891170ea8803';
  private appSecret = process.env.WECHAT_APPSECRET || '';

  // 使用 code 换取 openid 和 session_key
  async code2session(code: string) {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${this.appId}&secret=${this.appSecret}&js_code=${code}&grant_type=authorization_code`;

    const response = await axios.get(url);

    if (response.data.errcode) {
      throw new Error(`微信登录失败: ${response.data.errmsg}`);
    }

    return {
      openid: response.data.openid,
      session_key: response.data.session_key,
    };
  }
}
EOF

echo "✅ 微信服务创建完成"

# ============================================
# 步骤 5：创建虎皮椒支付服务
# ============================================
echo ""
echo "步骤 5/8：创建虎皮椒支付服务..."

cat > src/hupipay/hupipay.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class HupiPayService {
  private appId = process.env.HUPI_APPID || 'your_appid';
  private appSecret = process.env.HUPI_APPSECRET || 'your_appsecret';
  private apiUrl = process.env.HUPI_API_URL || 'https://api.xunhupay.com';

  // 生成签名
  generateSign(params: any): string {
    const sortedKeys = Object.keys(params).sort();
    const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + `&key=${this.appSecret}`;
    return crypto.createHash('md5').update(signStr).digest('hex');
  }

  // 创建订单
  async createOrder(params: {
    openid: string;
    total_fee: number;
    title: string;
    notify_url: string;
    return_url?: string;
  }) {
    const orderId = `video_${Date.now()}_${params.openid}`;

    const data = {
      appid: this.appId,
      out_trade_order: orderId,
      total_fee: params.total_fee,
      title: params.title,
      time: Math.floor(Date.now() / 1000),
      notify_url: params.notify_url,
      return_url: params.return_url || '',
      nonce_str: this.generateNonceStr(),
      attach: params.openid,
      hash: '',
    };

    // 生成签名
    data.hash = this.generateSign(data);

    // 发起请求
    try {
      const response = await fetch(`${this.apiUrl}/payment/do.html`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(data),
      });

      const result = await response.json();

      if (result.errcode !== 0) {
        throw new Error(`创建订单失败: ${result.errmsg}`);
      }

      return {
        orderId: data.out_trade_order,
        payUrl: result.url_order,
      };
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  }

  // 验证回调签名
  verifyCallback(params: any): boolean {
    const sign = params.hash;
    const calculatedSign = this.generateSign(params);
    return sign === calculatedSign;
  }

  // 生成随机字符串
  private generateNonceStr(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
EOF

echo "✅ 虎皮椒支付服务创建完成"

# ============================================
# 步骤 6：创建支付控制器
# ============================================
echo ""
echo "步骤 6/8：创建支付控制器..."

cat > src/payment/payment.controller.ts << 'EOF'
import { Controller, Post, Body } from '@nestjs/common';
import { HupiPayService } from '../hupipay/hupipay.service';
import { UserService } from '../user/user.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly hupiPayService: HupiPayService,
    private readonly userService: UserService,
  ) {}

  // 创建会员订单
  @Post('create-member-order')
  async createMemberOrder(@Body() body: { openid: string }) {
    try {
      const payUrl = await this.hupiPayService.createOrder({
        openid: body.openid,
        total_fee: 29900, // 299元，单位：分
        title: '开通会员 - 每天10次视频生成',
        notify_url: `${process.env.PROJECT_DOMAIN || 'http://121.41.176.195'}/api/payment/callback`,
        return_url: 'https://api.yuxuanbaihuo.site/payment/success',
      });

      return {
        code: 200,
        msg: 'success',
        data: {
          payUrl,
        },
      };
    } catch (error) {
      console.error('Create member order error:', error);
      return {
        code: 500,
        msg: error.message,
        data: null,
      };
    }
  }

  // 支付回调
  @Post('callback')
  async paymentCallback(@Body() body: any) {
    try {
      // 1. 验证签名
      const isValid = this.hupiPayService.verifyCallback(body);

      if (!isValid) {
        return { errcode: 1, errmsg: '签名验证失败' };
      }

      // 2. 检查订单状态
      if (body.trade_status !== 'TRADE_SUCCESS') {
        return { errcode: 0, errmsg: 'success' };
      }

      // 3. 获取用户openid
      const openid = body.attach;

      // 4. 开通会员
      this.userService.upgradeMember(openid, 365);

      console.log(`User ${openid} upgraded to member`);

      return { errcode: 0, errmsg: 'success' };
    } catch (error) {
      console.error('Payment callback error:', error);
      return { errcode: 1, errmsg: error.message };
    }
  }
}
EOF

echo "✅ 支付控制器创建完成"

# ============================================
# 步骤 7：创建视频记录服务
# ============================================
echo ""
echo "步骤 7/8：创建视频记录服务..."

cat > src/video-record/video-record.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as path from 'path';

@Injectable()
export class VideoRecordService {
  private db: Database.Database;

  constructor() {
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/coze-mini-program.db');
    this.db = new Database(dbPath);
  }

  // 创建视频记录
  create(data: {
    openid: string;
    image_urls: string[];
    video_url?: string;
    status?: string;
    error_msg?: string;
  }) {
    const stmt = this.db.prepare(`
      INSERT INTO video_records (openid, image_urls, video_url, status, error_msg)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.openid,
      JSON.stringify(data.image_urls),
      data.video_url || null,
      data.status || 'pending',
      data.error_msg || null
    );

    return this.findById(result.lastInsertRowid as number);
  }

  // 根据ID查找
  findById(id: number) {
    const stmt = this.db.prepare('SELECT * FROM video_records WHERE id = ?');
    const record = stmt.get(id);

    if (record) {
      record.image_urls = JSON.parse(record.image_urls);
    }

    return record;
  }

  // 根据openid查找用户的所有记录
  findByOpenid(openid: string, limit: number = 10) {
    const stmt = this.db.prepare(`
      SELECT * FROM video_records
      WHERE openid = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    const records = stmt.all(openid, limit);

    return records.map(record => ({
      ...record,
      image_urls: JSON.parse(record.image_urls),
    }));
  }

  // 更新记录
  update(id: number, data: any) {
    const fields = [];
    const values = [];

    if (data.video_url !== undefined) {
      fields.push('video_url = ?');
      values.push(data.video_url);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.error_msg !== undefined) {
      fields.push('error_msg = ?');
      values.push(data.error_msg);
    }

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE video_records SET ${fields.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    return this.findById(id);
  }
}
EOF

echo "✅ 视频记录服务创建完成"

# ============================================
# 步骤 8：更新模块
# ============================================
echo ""
echo "步骤 8/8：更新模块配置..."

# 创建模块文件
cat > src/user/user.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { WechatModule } from '../wechat/wechat.module';

@Module({
  imports: [WechatModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
EOF

cat > src/wechat/wechat.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { WechatService } from './wechat.service';

@Module({
  providers: [WechatService],
  exports: [WechatService],
})
export class WechatModule {}
EOF

cat > src/hupipay/hupipay.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { PaymentController } from '../payment/payment.controller';
import { HupiPayService } from './hupipay.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [PaymentController],
  providers: [HupiPayService],
})
export class HupiPayModule {}
EOF

cat > src/payment/payment.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { HupiPayService } from '../hupipay/hupipay.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [PaymentController],
  providers: [HupiPayService],
})
export class PaymentModule {}
EOF

cat > src/video-record/video-record.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { VideoRecordService } from './video-record.service';

@Module({
  providers: [VideoRecordService],
  exports: [VideoRecordService],
})
export class VideoRecordModule {}
EOF

echo "✅ 模块配置更新完成"

# ============================================
# 更新 app.module.ts
# ============================================
echo ""
echo "更新主模块..."

cat > src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UploadModule } from './upload/upload.module';
import { VideoModule } from './video/video.module';
import { UserModule } from './user/user.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    UploadModule,
    VideoModule,
    UserModule,
    PaymentModule,
  ],
})
export class AppModule {}
EOF

echo "✅ 主模块更新完成"

# ============================================
# 更新 .env 文件
# ============================================
echo ""
echo "更新环境变量..."

cat > .env << 'EOF'
# 豆包 API Key（火山引擎端点）
COZE_WORKLOAD_IDENTITY_API_KEY=67e98ac0-e718-4776-8193-98af51499943

# 豆包 API 基础 URL（火山引擎端点）
COZE_INTEGRATION_BASE_URL=https://ark.cn-beijing.volces.com
COZE_INTEGRATION_MODEL_BASE_URL=https://ark.cn-beijing.volces.com/api/v3

# 数据库文件路径
DATABASE_PATH=/tmp/coze-mini-program.db

# 后端服务域名
PROJECT_DOMAIN=https://api.yuxuanbaihuo.site

# 微信小程序配置
WECHAT_APPID=wx4b20891170ea8803
WECHAT_APPSECRET=your_wechat_appsecret

# 虎皮椒支付配置
HUPI_APPID=your_hupi_appid
HUPI_APPSECRET=your_hupi_appsecret
HUPI_API_URL=https://api.xunhupay.com
EOF

echo "✅ 环境变量更新完成"

# ============================================
# 安装依赖
# ============================================
echo ""
echo "安装新依赖..."

npm install better-sqlite3 @types/better-sqlite3 --save --legacy-peer-deps

echo "✅ 依赖安装完成"

# ============================================
# 重新构建项目
# ============================================
echo ""
echo "重新构建项目..."

npm run build

echo "✅ 项目构建完成"

# ============================================
# 重启服务
# ============================================
echo ""
echo "重启服务..."

pm2 restart video-app

echo "✅ 服务重启完成"

# ============================================
# 完成
# ============================================
echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "后端服务已成功部署！"
echo ""
echo "接下来需要："
echo "1. 注册虎皮椒支付账号：https://www.xunhupay.com/"
echo "2. 获取 AppID 和 AppSecret"
echo "3. 更新 .env 文件中的 HUPI_APPID 和 HUPI_APPSECRET"
echo "4. 重启服务：pm2 restart video-app"
echo ""
echo "=========================================="
