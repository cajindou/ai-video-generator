import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

interface ServicePackage {
  id: number
  name: string
  price: number
  quota: number | 'unlimited'
  description: string
  label?: string
  highlight?: boolean
}

export default function ServicePage() {
  const [selectedPlan, setSelectedPlan] = useState<number>(1)

  const plans: ServicePackage[] = [
    {
      id: 1,
      name: '入门套餐',
      price: 299,
      quota: 10,
      description: '每天10次，当天有效，第二天重置',
      label: '适合初次体验'
    },
    {
      id: 2,
      name: '标准套餐',
      price: 399,
      quota: 20,
      description: '每天20次，当天有效，第二天重置',
      label: '适合高频使用',
      highlight: true
    },
    {
      id: 3,
      name: '不限次套餐',
      price: 599,
      quota: 'unlimited',
      description: '30天不限次视频生成',
      label: '适合专业用户'
    }
  ]

  const contactCustomerService = () => {
    Taro.setClipboardData({
      data: '18009006222',
      success: () => {
        Taro.showToast({
          title: '客服微信号已复制',
          icon: 'success'
        })
      }
    })
  }

  const copyPaymentInfo = (plan: ServicePackage) => {
    const text = `感谢您的支持！\n${plan.name}：${plan.price}元\n服务：${plan.description}\n\n请添加客服微信付款：18009006222`
    Taro.setClipboardData({
      data: text,
      success: () => {
        Taro.showToast({
          title: '付款信息已复制',
          icon: 'success'
        })
      }
    })
  }

  return (
    <View className="vip-page">
      {/* 页面标题 */}
      <View className="header">
        <Text className="title">视频制作套餐</Text>
        <Text className="subtitle">AI智能视频生成技术服务</Text>
      </View>

      {/* 说明 */}
      <View className="notice">
        <Text className="notice-text">
          💡 温馨提示：基础功能完全免费，每天可生成3个视频。付费套餐是您自愿购买的技术服务，用于获得更多服务次数。
        </Text>
      </View>

      {/* 套餐列表 */}
      <View className="plans-container">
        {plans.map((plan) => (
          <View
            key={plan.id}
            className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.highlight ? 'highlight' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <View className="plan-header">
              <Text className="plan-name">{plan.name}</Text>
              {plan.highlight && <View className="badge">推荐</View>}
              {plan.label && <View className="label">{plan.label}</View>}
            </View>

            <View className="plan-price">
              <Text className="price">¥{plan.price}</Text>
              <Text className="unit">/30天</Text>
            </View>

            <View className="plan-quota">
              <Text className="quota-text">{plan.quota === 'unlimited' ? '不限次' : `${plan.quota}次服务`}</Text>
            </View>

            <Text className="plan-description">{plan.description}</Text>

            {selectedPlan === plan.id && (
              <View className="selected-indicator">✓ 已选择</View>
            )}
          </View>
        ))}
      </View>

      {/* 服务内容 */}
      <View className="benefits">
        <Text className="benefits-title">服务内容</Text>
        <View className="benefit-item">
          <Text className="benefit-icon">✓</Text>
          <Text className="benefit-text">AI智能视频生成技术</Text>
        </View>
        <View className="benefit-item">
          <Text className="benefit-icon">✓</Text>
          <Text className="benefit-text">文案智能优化服务</Text>
        </View>
        <View className="benefit-item">
          <Text className="benefit-icon">✓</Text>
          <Text className="benefit-text">专业技术支持</Text>
        </View>
        <View className="benefit-item">
          <Text className="benefit-icon">✓</Text>
          <Text className="benefit-text">订单优先处理</Text>
        </View>
      </View>

      {/* 功能轮换体验 */}
      <View className="feature-rotation">
        <Text className="feature-rotation-title">🎁 免费用户专享：功能轮换体验</Text>
        <Text className="feature-rotation-desc">每天体验一种VIP功能，7天循环，助力您的视频创作！</Text>
        
        <View className="feature-list">
          <View className="feature-item">
            <Text className="feature-day">周一</Text>
            <Text className="feature-icon">🎬</Text>
            <View className="feature-info">
              <Text className="feature-name">高清视频</Text>
              <Text className="feature-desc">1080P超清画质</Text>
            </View>
          </View>
          
          <View className="feature-item">
            <Text className="feature-day">周二</Text>
            <Text className="feature-icon">💧</Text>
            <View className="feature-info">
              <Text className="feature-name">无水印</Text>
              <Text className="feature-desc">去除所有水印</Text>
            </View>
          </View>
          
          <View className="feature-item">
            <Text className="feature-day">周三</Text>
            <Text className="feature-icon">🎙️</Text>
            <View className="feature-info">
              <Text className="feature-name">AI配音</Text>
              <Text className="feature-desc">专业音色配音</Text>
            </View>
          </View>
          
          <View className="feature-item">
            <Text className="feature-day">周四</Text>
            <Text className="feature-icon">🎨</Text>
            <View className="feature-info">
              <Text className="feature-name">高级模板</Text>
              <Text className="feature-desc">100+专业模板</Text>
            </View>
          </View>
          
          <View className="feature-item">
            <Text className="feature-day">周五</Text>
            <Text className="feature-icon">📦</Text>
            <View className="feature-info">
              <Text className="feature-name">批量生成</Text>
              <Text className="feature-desc">一次生成多个</Text>
            </View>
          </View>
          
          <View className="feature-item">
            <Text className="feature-day">周六</Text>
            <Text className="feature-icon">📺</Text>
            <View className="feature-info">
              <Text className="feature-name">4K超清</Text>
              <Text className="feature-desc">4K超高清画质</Text>
            </View>
          </View>
          
          <View className="feature-item highlight">
            <Text className="feature-day">周日</Text>
            <Text className="feature-icon">👑</Text>
            <View className="feature-info">
              <Text className="feature-name">完整VIP</Text>
              <Text className="feature-desc">所有功能全开放</Text>
            </View>
          </View>
        </View>
        
        <Text className="feature-tip">💡 购买套餐即可随时使用所有VIP功能！</Text>
      </View>

      {/* 服务说明 */}
      <View className="service-notice">
        <Text className="notice-title">服务说明</Text>
        <Text className="notice-item">• 本服务为AI视频制作技术服务</Text>
        <Text className="notice-item">• 入门套餐/标准套餐：每天配额当天有效，第二天自动重置</Text>
        <Text className="notice-item">• 不限次套餐：30天内不限次数使用</Text>
        <Text className="notice-item">• 支付后客服会在30分钟内为您开通服务</Text>
        <Text className="notice-item">• 服务内容：智能视频生成、文案优化、技术支持</Text>
      </View>

      {/* 服务协议 */}
      <View className="service-agreement">
        <Text className="agreement-title">服务协议</Text>
        <Text className="agreement-text">
          1. 本服务为AI视频制作技术服务，用户购买后获得相应次数的视频生成服务。
        </Text>
        <Text className="agreement-text">
          2. 入门套餐/标准套餐：每天配额当天有效，第二天自动重置，配额不累计。
        </Text>
        <Text className="agreement-text">
          3. 不限次套餐：30天内不限次数使用，过期自动终止服务。
        </Text>
        <Text className="agreement-text">
          4. 用户应遵守相关法律法规，不得用于违法违规内容。
        </Text>
        <Text className="agreement-text">
          5. 如遇技术故障，客服会协助解决。
        </Text>
      </View>

      {/* 收款码区域 */}
      <View className="payment-section">
        <Text className="payment-title">支付方式</Text>
        <View className="qr-container">
          <Image
            src="https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2Ff7908757b618ee9abeba073b5e0229ae.png&nonce=0cc272f1-40cc-4439-a292-73cf3d0e4f3c&project_id=7612318003925139494&sign=532a742c9e02209e878d548b2d2d34144aa0ffbdfb360b4689fb46b3831e1dfa"
            className="qr-code"
            mode="widthFix"
          />
          <Text className="qr-tip">微信扫码支付</Text>
          <Text className="qr-price">¥{plans.find(p => p.id === selectedPlan)!.price}</Text>
        </View>
      </View>

      {/* 客服联系方式 */}
      <View className="contact-section">
        <Text className="contact-title">支付后联系客服开通</Text>
        <View className="contact-info">
          <Text className="contact-label">客服微信：</Text>
          <Text className="contact-phone">18009006222</Text>
        </View>
        <Button className="copy-button" onClick={contactCustomerService}>
          复制微信号
        </Button>
        <Button
          className="copy-info-button"
          onClick={() => copyPaymentInfo(plans.find(p => p.id === selectedPlan)!)}
        >
          复制付款信息
        </Button>
      </View>

      {/* 注意事项 */}
      <View className="notice">
        <Text className="notice-title">注意事项</Text>
        <Text className="notice-item">• 支付后请保留付款截图</Text>
        <Text className="notice-item">• 添加客服微信并发送付款截图</Text>
        <Text className="notice-item">• 客服会在30分钟内为您开通服务</Text>
        <Text className="notice-item">• 服务次数从开通之日起计算</Text>
      </View>
    </View>
  )
}
