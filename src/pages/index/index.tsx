import { View, Text, Button, Image, Input, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { ImagePlus, Play, Download, Sparkles, Wand, Crown, Zap, Users, TrendingUp, Lock, Check, Star, Flame, RefreshCw, Camera, X } from 'lucide-react-taro'
import { AuthService } from '@/services/auth.service'
import { Network } from '@/network'
import './index.css'

/**
 * 首页 - 智能口播探店视频生成（科技感风格）
 */

// 快捷选项
const QUICK_OPTIONS = [
  { id: 'promotion', label: '📢 活动促销', icon: '🎉', description: '限时优惠、折扣活动', placeholder: '输入活动详情（如：全场5折，满200减50）' },
  { id: 'store', label: '🏪 店铺介绍', icon: '📍', description: '品牌故事、店铺特色', placeholder: '输入店铺信息（如：经营5年，专注品质）' },
  { id: 'product', label: '🎯 产品推荐', icon: '💎', description: '新品上市、明星产品', placeholder: '输入产品信息（如：明星产品，超高性价比）' },
  { id: 'festival', label: '🎊 节日庆典', icon: '🎈', description: '节日祝福、主题活动', placeholder: '输入节日活动（如：元旦特惠，进店有礼）' },
  { id: 'creative', label: '💡 创意推广', icon: '✨', description: '品牌宣传、营销创意', placeholder: '输入创意内容（如：发现一家宝藏好店）' },
  { id: 'custom', label: '🎤 自定义内容', icon: '📝', description: '自由输入、个性化定制', placeholder: '自由输入您想宣传的内容...' }
]

// 多片段视频生成步骤（30秒以上）
const GENERATION_STEPS = [
  { id: 1, title: '🤖 智能技术分析', description: '分析图片内容，提取关键信息', duration: 2000 },
  { id: 2, title: '✍️ 生成完整文案', description: '生成30秒以上专业口播文案', duration: 3000 },
  { id: 3, title: '📝 智能分割文案', description: '将文案分为3个片段', duration: 1500 },
  { id: 4, title: '🎬 生成视频片段1', description: '生成开场吸引片段（12秒）', duration: 15000 },
  { id: 5, title: '🎬 生成视频片段2', description: '生成价值传递片段（12秒）', duration: 15000 },
  { id: 6, title: '🎬 生成视频片段3', description: '生成促单行动片段（12秒）', duration: 15000 },
  { id: 7, title: '🔗 拼接视频片段', description: '使用专业转场效果拼接', duration: 8000 },
  { id: 8, title: '✅ 生成完成', description: '36秒高质量视频已就绪', duration: 1000 }
]

// 套餐功能列表
const PLAN_FEATURES = [
  { id: 1, icon: '🎬', title: '高清视频', description: '1080P 超清画质', free: false },
  { id: 2, icon: '💧', title: '无水印', description: '去除所有水印', free: false },
  { id: 3, icon: '📦', title: '批量生成', description: '一次生成多个视频', free: false },
  { id: 4, icon: '⚡', title: '极速生成', description: '会员优先处理', free: false },
  { id: 5, icon: '🎙️', title: '多音色', description: '10+ 专业配音', free: false },
  { id: 6, icon: '🎨', title: '高级模板', description: '100+ 专业模板', free: false }
]

// 成功案例
const SUCCESS_CASES = [
  { name: '李小姐', shop: '奶茶店', views: '12.5万', increase: '300%' },
  { name: '王老板', shop: '服装店', views: '8.3万', increase: '250%' },
  { name: '张经理', shop: '美妆店', views: '15.2万', increase: '450%' }
]

const IndexPage = () => {
  // 图片上传相关状态
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [dragIndex, setDragIndex] = useState<number>(-1)
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1)

  // 聊天式输入相关状态
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [customInput, setCustomInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [generatedScript, setGeneratedScript] = useState('')

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [showResult, setShowResult] = useState(false)

  // 用户状态
  const [freeTrialCount, setFreeTrialCount] = useState(3)
  const [isVIP] = useState(false)  // TODO: 从后端获取真实的 VIP 状态

  // 社交证明数据（真实数据）
  const [totalUsers] = useState(5000)
  const [totalVideos] = useState(20000)

  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  // 加载用户信息
  useEffect(() => {
    if (isWeapp) {
      loadUserInfo()
    }
  }, [isWeapp])

  const loadUserInfo = async () => {
    try {
      // 尝试从本地获取用户信息
      let user = AuthService.getUserInfo()

      if (!user) {
        // 如果本地没有，尝试登录
        user = await AuthService.login()
      }

      if (user) {
        // 更新配额显示
        setFreeTrialCount(user.quota.remainingQuota)
      }
    } catch (error) {
      console.error('[IndexPage] 加载用户信息失败:', error)
    }
  }

  // 刷新用户配额
  const refreshUserQuota = async () => {
    try {
      const user = await AuthService.refreshUserInfo()
      if (user) {
        setFreeTrialCount(user.quota.remainingQuota)
      }
    } catch (error) {
      console.error('[IndexPage] 刷新用户配额失败:', error)
    }
  }

  // 图片上传相关函数
  const handleUploadImages = async () => {
    if (!isWeapp) {
      Taro.showToast({ title: '仅小程序支持图片上传', icon: 'none' })
      return
    }

    if (uploadedImages.length >= 5) {
      Taro.showToast({ title: '最多上传5张图片', icon: 'none' })
      return
    }

    Taro.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          await handleTakePhoto()
        } else if (res.tapIndex === 1) {
          await handleChooseFromAlbum()
        }
      }
    })
  }

  const handleTakePhoto = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera']
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        await uploadSingleImage(res.tempFilePaths[0])
      }
    } catch (err) {
      console.error('拍照失败', err)
      Taro.showToast({
        title: '拍照失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
  }

  const handleChooseFromAlbum = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 5 - uploadedImages.length,
        sizeType: ['compressed'],
        sourceType: ['album']
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        for (let i = 0; i < res.tempFilePaths.length; i++) {
          await uploadSingleImage(res.tempFilePaths[i])
        }
      }
    } catch (err) {
      console.error('选择图片失败', err)
      Taro.showToast({
        title: '选择图片失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
  }

  const uploadSingleImage = async (tempFilePath: string) => {
    try {
      Taro.showLoading({ title: '上传中...' })

      // 使用模拟数据，直接使用本地路径
      const fullUrl = tempFilePath

      setUploadedImages(prev => {
        const updated = [...prev, fullUrl]
        if (updated.length > 5) {
          Taro.showToast({ title: '最多上传5张图片', icon: 'none' })
          return updated.slice(0, 5)
        }
        return updated
      })

      Taro.hideLoading()
      Taro.showToast({ title: '上传成功', icon: 'success' })
    } catch (err: any) {
      Taro.hideLoading()
      Taro.showToast({ title: '上传失败', icon: 'none' })
      console.error('上传失败', err)
    }
  }

  const handleRemoveImage = (index: number) => {
    const updated = [...uploadedImages]
    updated.splice(index, 1)
    setUploadedImages(updated)
  }

  const handleTouchStart = (index: number) => {
    setDragIndex(index)
    setDragOverIndex(index)
  }

  const handleTouchMove = (e: any, targetIndex: number) => {
    if (dragIndex === -1 || dragIndex === targetIndex) return

    const touch = e.touches[0]
    const query = Taro.createSelectorQuery()

    uploadedImages.forEach((_, index) => {
      query.select(`#image-item-${index}`).boundingClientRect()
    })

    query.exec((rects) => {
      if (!rects || rects.length === 0) return

      rects.forEach((rect, index) => {
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          if (dragOverIndex !== index) {
            setDragOverIndex(index)
          }
        }
      })
    })
  }

  const handleTouchEnd = () => {
    if (dragIndex !== -1 && dragOverIndex !== -1 && dragIndex !== dragOverIndex) {
      const newImages = [...uploadedImages]
      const [draggedImage] = newImages.splice(dragIndex, 1)
      newImages.splice(dragOverIndex, 0, draggedImage)
      setUploadedImages(newImages)
      Taro.vibrateShort({ type: 'light' })
    }
    setDragIndex(-1)
    setDragOverIndex(-1)
  }

  // 聊天式输入相关函数
  const handleSelectOption = (optionId: string) => {
    setSelectedOption(optionId)
    setCustomInput('')
    if (optionId !== 'custom') {
      // 非自定义选项，自动生成脚本
      handleAnalyze()
    }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setGeneratedScript('')

    await new Promise(resolve => setTimeout(resolve, 2000))

    const scripts: Record<string, string> = {
      promotion: '🔥 限时优惠！全场低至5折！\n\n今天来我们店的小伙伴有福了！新品上市，全场低至5折，还有满减活动哦！\n\n活动时间：本周末两天\n地址：XX路XX号\n期待您的光临！\n\n#优惠活动 #限时折扣',
      store: '📍 欢迎来到我的小店！\n\n这里是[店铺名称]，我们已经经营了X年，专注于为顾客提供最好的产品和服务。\n\n我们的特色是[特色产品/服务]，每一件商品都经过精心挑选。\n\n新客到店还有小礼品相送哦！\n\n#店铺介绍 #品质保证',
      product: '🎯 强烈推荐这款明星产品！\n\n今天给大家推荐的是我们的镇店之宝——[产品名称]！\n\n✅ 品质保证\n✅ 超高性价比\n✅ 售后无忧\n\n现在下单还送精美包装，自用送礼两相宜！\n\n#产品推荐 #好物分享',
      festival: '🎊 节日快乐！限时福利送给你！\n\n今天是[节日名称]，祝大家节日快乐！\n\n为了庆祝这个特殊的日子，我们准备了超值福利：\n\n🎁 进店有礼\n🎁 消费满减\n🎁 抽奖活动\n\n快来参与吧！\n\n#节日祝福 #福利活动',
      creative: '✨ 发现了一个宝藏好店！\n\n今天逛到一家超赞的店，必须要分享给你们！\n\n这里的环境特别棒，服务也很贴心，最重要的是产品性价比超高！\n\n已经买了很多东西了，推荐给大家！\n\n#探店分享 #宝藏好店',
      custom: `🎤 您输入的内容：\n\n${customInput || '请输入您的宣传内容'}\n\n智能技术正在为您生成专业的口播脚本...`
    }

    setGeneratedScript(scripts[selectedOption] || scripts['custom'])
    setIsAnalyzing(false)
  }

  const handleCustomInputConfirm = () => {
    if (!customInput.trim()) {
      Taro.showToast({ title: '请输入内容', icon: 'none' })
      return
    }
    handleAnalyze()
  }

  // 视频生成相关函数
  const handleGenerate = async () => {
    if (uploadedImages.length === 0) {
      Taro.showToast({ title: '请先上传图片', icon: 'none' })
      return
    }

    if (freeTrialCount <= 0 && !isVIP) {
      Taro.showModal({
        title: '试用次数已用完',
        content: '免费试用次数已用完，购买套餐享受无限次生成！',
        confirmText: '购买套餐',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/vip/index' })
          }
        }
      })
      return
    }

    setIsGenerating(true)
    setGenerationStep(0)
    setGenerationProgress(0)

    try {
      const openid = AuthService.getOpenid()

      // 调用后端视频生成接口
      const result = await Network.request({
        url: '/api/video/generate',
        method: 'POST',
        data: {
          images: uploadedImages,
          openid: openid || undefined,
        },
      })

      const response = result as any
      if (response && response.code === 200) {
        // 生成成功
        setShowResult(true)
        setGeneratedScript(response.data.copywriting || '')

        // 刷新用户配额
        await refreshUserQuota()

        Taro.showToast({ title: '视频生成成功', icon: 'success' })
      } else {
        throw new Error(response?.msg || '视频生成失败')
      }
    } catch (error: any) {
      console.error('[IndexPage] 视频生成失败:', error)
      Taro.showToast({
        title: error.message || '视频生成失败',
        icon: 'none',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    setShowResult(false)
    setSelectedOption('')
    setGeneratedScript('')
    setGenerationProgress(0)
  }

  const handleDownload = () => {
    if (isVIP) {
      Taro.showToast({ title: '开始下载高清视频...', icon: 'success' })
    } else {
      Taro.showModal({
        title: '下载高清视频',
        content: '购买套餐可下载 1080P 无水印高清视频',
        confirmText: '购买套餐',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/vip/index' })
          }
        }
      })
    }
  }

  const handleOptimizeScript = () => {
    if (!generatedScript) {
      Taro.showToast({
        title: '请先生成脚本',
        icon: 'none'
      })
      return
    }

    Taro.showLoading({ title: '正在优化...' })
    setTimeout(() => {
      const optimized = generatedScript + '\n\n✨ 智能优化：增加了更多情感表达和互动性，让视频更有吸引力！'
      setGeneratedScript(optimized)
      Taro.hideLoading()
      Taro.showToast({
        title: '优化成功！',
        icon: 'success',
        duration: 2000
      })
    }, 2000)
  }

  return (
    <ScrollView className="index-page" scrollY>
      {/* 顶部渐变背景 */}
      <View className="gradient-header">
        <View className="header-content">
          <View className="title-section">
            <View className="title-row">
              <Sparkles className="title-icon" size={32} color="#fff" />
              <Text className="block main-title">智能口播探店</Text>
            </View>
            <Text className="block subtitle">上传图片 · 智能生成视频</Text>
          </View>

          {/* 免费试用提示 */}
          <View className="trial-badge">
            {isVIP ? (
              <View className="vip-badge">
                <Crown className="vip-icon" size={16} color="#FFD700" />
                <Text className="block vip-text">套餐会员</Text>
              </View>
            ) : (
              <View className="free-trial-badge">
                <Text className="block trial-count">{freeTrialCount}</Text>
                <Text className="block trial-label">次免费</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 社交证明 */}
      <View className="social-proof">
        <View className="proof-item">
          <Users className="proof-icon" size={18} color="#1890ff" />
          <Text className="block proof-label">{totalUsers.toLocaleString()} 人已使用</Text>
        </View>
        <View className="proof-divider" />
        <View className="proof-item">
          <TrendingUp className="proof-icon" size={18} color="#1890ff" />
          <Text className="block proof-label">{totalVideos.toLocaleString()} 个视频已生成</Text>
        </View>
      </View>

      {/* 紧迫感提示 */}
      <View className="urgency-banner">
        <Flame className="urgency-icon" size={20} color="#FF4D4F" />
        <Text className="block urgency-text">限时免费体验，仅剩 {freeTrialCount} 次机会！</Text>
      </View>

      {!showResult && !isGenerating && (
        <>
          {/* 图片上传区域 */}
          <View className="upload-section">
            <View className="section-header">
              <ImagePlus className="section-icon" size={24} color="#1890ff" />
              <View>
                <Text className="block section-title">上传店铺图片</Text>
                <Text className="block section-subtitle">3-5张图片，智能技术生成30秒以上视频</Text>
              </View>
            </View>

            {/* 图片列表 */}
            <View className="images-list">
              {uploadedImages.map((image, index) => (
                <View
                  key={index}
                  id={`image-item-${index}`}
                  className={`image-item ${dragIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  onTouchStart={() => handleTouchStart(index)}
                  onTouchMove={(e) => handleTouchMove(e, index)}
                  onTouchEnd={handleTouchEnd}
                >
                  <Image
                    src={image}
                    mode="aspectFill"
                    className="uploaded-image"
                  />
                  <View
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveImage(index)
                    }}
                  >
                    <X size={16} color="#fff" />
                  </View>
                  <View className="image-number">{index + 1}</View>
                </View>
              ))}

              {/* 上传按钮 */}
              {uploadedImages.length < 5 && (
                <View className="upload-btn" onClick={handleUploadImages}>
                  <Camera size={32} color="#1890ff" />
                  <Text className="block upload-btn-text">添加图片</Text>
                </View>
              )}
            </View>

            {/* 提示信息 */}
            {uploadedImages.length > 0 && (
              <View className="upload-tip">
                <Text className="block tip-text">
                  提示：拖拽图片可调整播放顺序
                </Text>
              </View>
            )}
          </View>

          {/* 聊天式输入区域 */}
          <View className="chat-section">
            <View className="section-header">
              <Wand className="section-icon" size={24} color="#1890ff" />
              <View>
                <Text className="block section-title">选择推广内容</Text>
                <Text className="block section-subtitle">智能技术分析，生成专业口播脚本</Text>
              </View>
            </View>

            {/* 快捷选项 */}
            <View className="quick-options">
              {QUICK_OPTIONS.map((option) => (
                <View
                  key={option.id}
                  className={`option-card ${selectedOption === option.id ? 'option-selected' : ''}`}
                  onClick={() => handleSelectOption(option.id)}
                >
                  <Text className="block option-icon">{option.icon}</Text>
                  <View className="option-content">
                    <Text className="block option-label">{option.label}</Text>
                    <Text className="block option-description">{option.description}</Text>
                  </View>
                  {selectedOption === option.id && (
                    <Check className="option-check" size={20} color="#1890ff" />
                  )}
                </View>
              ))}
            </View>

            {/* 自定义输入 */}
            {selectedOption === 'custom' && (
              <View className="custom-input-section">
                <View className="input-wrapper">
                  <View style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
                    <View style={{ flex: 1, backgroundColor: '#f5f5f5', borderRadius: '12px', padding: '12px' }}>
                      <Input
                        className="custom-input"
                        placeholder={QUICK_OPTIONS.find(o => o.id === 'custom')?.placeholder}
                        value={customInput}
                        onInput={(e) => setCustomInput(e.detail.value)}
                        placeholderStyle="color: #8c8c8c; font-size: 14px;"
                        style={{ fontSize: '14px', width: '100%' }}
                      />
                    </View>
                    <View style={{ flexShrink: 0 }}>
                      <Button
                        className="confirm-btn"
                        onClick={handleCustomInputConfirm}
                        style={{
                          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '12px 20px',
                          fontSize: '14px',
                          fontWeight: '500',
                          boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)'
                        }}
                      >
                        生成
                      </Button>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* AI 智能分析结果 */}
          {generatedScript && (
            <View className="script-section">
              <View className="section-header">
                <Sparkles className="section-icon" size={24} color="#1890ff" />
                <View>
                  <Text className="block section-title">智能生成的口播脚本</Text>
                  <Text className="block section-subtitle">点击&quot;优化文案&quot;可进一步提升效果</Text>
                </View>
              </View>
              <View className="script-content">
                <Text className="block script-text">{generatedScript}</Text>
              </View>
              <View className="script-actions">
                <Button
                  className="action-btn optimize-btn"
                  onClick={handleOptimizeScript}
                  style={{
                    background: 'linear-gradient(135deg, #FA8C16 0%, #D46B08 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    flex: 1
                  }}
                >
                  <Zap size={18} color="#fff" />
                  <Text className="block">优化文案</Text>
                </Button>
                <Button
                  className="action-btn generate-btn"
                  onClick={handleGenerate}
                  style={{
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
                    flex: 1
                  }}
                >
                  <Play size={18} color="#fff" />
                  <Text className="block">生成视频</Text>
                </Button>
              </View>
            </View>
          )}
        </>
      )}

      {/* AI 分析中 */}
      {isAnalyzing && (
        <View className="analyzing-section">
          <View className="analyzing-animation">
            <View className="pulse-ring" />
            <View className="pulse-ring delay-1" />
            <View className="pulse-ring delay-2" />
            <Sparkles className="analyzing-icon" size={40} color="#1890ff" />
          </View>
          <Text className="block analyzing-text">智能技术正在分析...</Text>
          <Text className="block analyzing-subtext">提取关键信息 · 生成专业脚本</Text>
        </View>
      )}

      {/* 生成进度 */}
      {isGenerating && (
        <View className="generating-section">
          <View className="generating-header">
            <Text className="block generating-title">智能技术正在生成视频</Text>
            <Text className="block generating-progress">{generationProgress}%</Text>
          </View>

          {/* 进度条 */}
          <View className="progress-bar">
            <View
              className="progress-fill"
              style={{ width: `${generationProgress}%` }}
            />
          </View>

          {/* 步骤列表 */}
          <View className="steps-list">
            {GENERATION_STEPS.map((step, index) => (
              <View
                key={step.id}
                className={`step-item ${index <= generationStep ? 'step-active' : ''}`}
              >
                <View className="step-icon">
                  {index < generationStep ? (
                    <Check size={20} color="#1890ff" />
                  ) : index === generationStep ? (
                    <View className="step-loading" />
                  ) : (
                    <View className="step-number">{index + 1}</View>
                  )}
                </View>
                <View className="step-content">
                  <Text className="block step-title">{step.title}</Text>
                  <Text className="block step-description">{step.description}</Text>
                </View>
                {index === generationStep && (
                  <View className="step-pulse" />
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 生成结果 */}
      {showResult && (
        <View className="result-section">
          {/* 成功提示 */}
          <View className="success-banner">
            <Check className="success-icon" size={24} color="#52c41a" />
            <View>
              <Text className="block success-title">视频生成成功！</Text>
              <Text className="block success-subtitle">预计浏览量提升 300%+</Text>
            </View>
          </View>

          {/* 视频预览区域（模拟） */}
          <View className="video-preview">
            <View className="preview-placeholder">
              <Play className="preview-icon" size={48} color="#1890ff" />
              <Text className="block preview-text">点击预览视频</Text>
            </View>
          </View>

          {/* 视频信息 */}
          <View className="video-info">
            <View className="info-item">
              <Text className="block info-label">视频时长</Text>
              <Text className="block info-value">30秒以上</Text>
            </View>
            <View className="info-divider" />
            <View className="info-item">
              <Text className="block info-label">配音类型</Text>
              <Text className="block info-value">专家智能配音</Text>
            </View>
            <View className="info-divider" />
            <View className="info-item">
              <Text className="block info-label">画质</Text>
              <Text className="block info-value">{isVIP ? '1080P' : '720P'}</Text>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="result-actions">
            <Button
              className="result-action-btn secondary-btn"
              onClick={handleRegenerate}
              style={{
                background: '#f5f5f5',
                color: '#1890ff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                flex: 1
              }}
            >
              <RefreshCw size={18} color="#1890ff" />
              <Text className="block">重新生成</Text>
            </Button>
            <Button
              className="result-action-btn primary-btn"
              onClick={handleDownload}
              style={{
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
                flex: 1
              }}
            >
              <Download size={18} color="#fff" />
              <Text className="block">{isVIP ? '下载高清视频' : '下载视频'}</Text>
            </Button>
          </View>
        </View>
      )}

      {/* 套餐功能预览 */}
      {!isVIP && !showResult && !isGenerating && (
        <View className="vip-preview">
          <View className="vip-header">
            <Crown className="vip-logo" size={28} color="#FFD700" />
            <View className="vip-title-section">
              <Text className="block vip-main-title">购买套餐</Text>
              <Text className="block vip-subtitle">解锁全部高级功能</Text>
            </View>
          </View>

          {/* 套餐功能列表 */}
          <View className="vip-features">
            {PLAN_FEATURES.map((feature) => (
              <View key={feature.id} className="feature-item">
                <View className="feature-icon-wrapper">
                  <Text className="block feature-icon">{feature.icon}</Text>
                </View>
                <View className="feature-content">
                  <Text className="block feature-title">{feature.title}</Text>
                  <Text className="block feature-description">{feature.description}</Text>
                </View>
                {feature.free ? (
                  <View className="feature-free-tag">
                    <Text className="block free-tag-text">免费</Text>
                  </View>
                ) : (
                  <View className="feature-lock">
                    <Lock size={16} color="#999" />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* 购买按钮 */}
          <Button
            className="vip-buy-btn"
            onClick={() => Taro.navigateTo({ url: '/pages/vip/index' })}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(255, 215, 0, 0.5)'
            }}
          >
            <Crown size={20} color="#fff" />
            <Text className="block">购买套餐</Text>
            <Text className="block vip-price" style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: '600' }}>¥299/10次</Text>
          </Button>
        </View>
      )}

      {/* 成功案例 */}
      {!showResult && !isGenerating && (
        <View className="success-cases">
          <View className="cases-header">
            <Star className="cases-icon" size={20} color="#FFD700" />
            <View style={{ flex: 1 }}>
              <Text className="block cases-title">成功案例</Text>
              <Text className="block cases-subtitle">看看他们如何用智能视频提升销量</Text>
            </View>
          </View>

          <View className="cases-list">
            {SUCCESS_CASES.map((case_, index) => (
              <View key={index} className="case-card">
                <View className="case-avatar">
                  <Text className="block case-avatar-text">{case_.name[0]}</Text>
                </View>
                <View className="case-content">
                  <View className="case-header-row">
                    <Text className="block case-name">{case_.name}</Text>
                    <Text className="block case-shop">{case_.shop}</Text>
                  </View>
                  <View className="case-stats">
                    <View className="case-stat">
                      <TrendingUp className="stat-icon" size={14} color="#52c41a" />
                      <Text className="block stat-label">浏览 {case_.views}</Text>
                    </View>
                    <View className="case-stat">
                      <Zap className="stat-icon" size={14} color="#FA8C16" />
                      <Text className="block stat-label">提升 {case_.increase}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 底部提示 */}
      <View className="footer-tip">
        <Text className="block footer-text">
          智能视频生成技术，仅供展示用途
        </Text>
      </View>
    </ScrollView>
  )
}

export default IndexPage
