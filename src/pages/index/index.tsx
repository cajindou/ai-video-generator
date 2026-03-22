import { View, Text, Button, Image, ScrollView, Textarea, Video } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { ImagePlus, Sparkles, Crown, Users, TrendingUp, Camera, X, Check, CircleAlert, Film, Eye } from 'lucide-react-taro'
import { AuthService } from '@/services/auth.service'
import { Network } from '@/network'
import './index.css'

/**
 * 首页 - 宇轩百货爆款口播探店
 * 
 * 完整的12秒美女口播视频生成流程：
 * 1. 上传3-5张图片
 * 2. 点击预览 → AI分析图片、生成文案、制作分镜
 * 3. 用户确认预览结果
 * 4. 确认后生成视频
 */

// 分镜项类型
interface StoryboardItem {
  id: number
  imageIndex: number
  duration: number
  narration: string
  sceneDescription: string
  cameraMovement: string
  transition: string
  subtitle: string
  emotion: string
}

// 图片分析结果类型
interface ImageAnalysis {
  shopName: string
  industryName: string
  products: Array<{
    name: string
    sellingPoints: string[]
  }>
  atmosphere: string
  targetAudience: string
  sellingPoints: string[]
}

// 预览数据类型
interface PreviewData {
  imageAnalysis: ImageAnalysis
  script: string
  storyboard: StoryboardItem[]
  previewReady: boolean
  videoUrl?: string // 预生成的视频URL（可选）
}

const IndexPage = () => {
  // ========== 状态管理 ==========
  
  // 图片上传
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  
  // 额外信息
  const [extraInfo, setExtraInfo] = useState('')
  
  // 流程状态
  const [currentStep, setCurrentStep] = useState<'upload' | 'previewing' | 'preview' | 'generating' | 'result'>('upload')
  
  // 预览数据
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  
  // 视频结果
  const [videoUrl, setVideoUrl] = useState('')
  
  // 用户状态
  const [freeTrialCount, setFreeTrialCount] = useState(3)
  const [isVIP, setIsVIP] = useState(false)
  
  // 社交证明
  const [totalUsers] = useState(5000)
  const [totalVideos] = useState(20000)

  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  // ========== 生命周期 ==========
  
  useEffect(() => {
    if (isWeapp) {
      loadUserInfo()
    }
  }, [isWeapp])

  // ========== 用户相关 ==========
  
  const loadUserInfo = async () => {
    try {
      let user = AuthService.getUserInfo()
      if (!user) {
        user = await AuthService.login()
      }
      if (user) {
        setFreeTrialCount(user.quota.remainingQuota)
        setIsVIP(user.quota.isVip)
      }
    } catch (error) {
      console.error('[IndexPage] 加载用户信息失败:', error)
    }
  }

  // ========== 图片上传 ==========
  
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
      Taro.showToast({ title: '拍照失败，请重试', icon: 'none' })
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
      Taro.showToast({ title: '选择图片失败，请重试', icon: 'none' })
    }
  }

  const uploadSingleImage = async (tempFilePath: string) => {
    try {
      Taro.showLoading({ title: '上传中...' })
      
      const uploadResult = await Network.uploadFile({
        url: '/api/upload',
        filePath: tempFilePath,
        name: 'file'
      })
      
      if (uploadResult && uploadResult.data) {
        const responseData = typeof uploadResult.data === 'string' 
          ? JSON.parse(uploadResult.data) 
          : uploadResult.data
        
        if (responseData.code === 200 && responseData.data?.url) {
          const serverUrl = responseData.data.url
          
          setUploadedImages(prev => {
            const updated = [...prev, serverUrl]
            if (updated.length > 5) {
              Taro.showToast({ title: '最多上传5张图片', icon: 'none' })
              return updated.slice(0, 5)
            }
            return updated
          })
          
          Taro.hideLoading()
          Taro.showToast({ title: '上传成功', icon: 'success' })
        } else {
          throw new Error(responseData.msg || '上传失败')
        }
      }
    } catch (err: any) {
      Taro.hideLoading()
      Taro.showToast({ title: err.message || '上传失败', icon: 'none' })
    }
  }

  const handleRemoveImage = (index: number) => {
    const updated = [...uploadedImages]
    updated.splice(index, 1)
    setUploadedImages(updated)
  }

  // ========== 核心流程 ==========
  
  /**
   * 步骤1: 预览分析
   * 调用后端预览接口，获取分析结果
   */
  const handlePreview = async () => {
    if (uploadedImages.length < 3) {
      Taro.showToast({ title: '请上传至少3张图片', icon: 'none' })
      return
    }

    if (freeTrialCount <= 0 && !isVIP) {
      Taro.showModal({
        title: '试用次数已用完',
        content: '购买套餐享受无限次生成！',
        confirmText: '购买套餐',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/vip/index' })
          }
        }
      })
      return
    }

    setCurrentStep('previewing')
    Taro.showLoading({ title: 'AI分析中，请稍候...' })

    try {
      // 使用可用的 /api/video/generate 接口
      // 视频生成需要较长时间（1-3分钟），设置较长超时
      const result = await Network.request({
        url: '/api/video/generate',
        method: 'POST',
        data: {
          images: uploadedImages,
          openid: AuthService.getOpenid(),
          extraInfo: extraInfo
        },
        timeout: 300000 // 5分钟超时
      })

      const response = result as any

      if (response && response.code === 200 && response.data) {
        // 构造预览数据格式
        const mockPreviewData = {
          imageAnalysis: {
            shopName: response.data.storeName || '店铺',
            industryName: '零售',
            products: [{ name: '精选商品', sellingPoints: ['品质优良', '价格实惠'] }],
            atmosphere: '温馨舒适',
            targetAudience: '年轻消费者',
            sellingPoints: ['精选好物', '超值优惠']
          },
          script: response.data.copywriting || '欢迎光临！',
          storyboard: uploadedImages.map((_img: string, idx: number) => ({
            id: idx + 1,
            imageIndex: idx,
            duration: 2.4,
            narration: response.data.copywriting || '',
            sceneDescription: '精彩展示',
            cameraMovement: '平移',
            transition: '淡入淡出',
            subtitle: '',
            emotion: '热情'
          })),
          previewReady: true,
          videoUrl: response.data.videoUrl
        }
        
        setPreviewData(mockPreviewData)
        setCurrentStep('preview')
        Taro.hideLoading()
        Taro.showToast({ title: '视频已生成!', icon: 'success' })
        
        // 视频已生成，直接跳转到播放页
        if (response.data.videoUrl) {
          Taro.navigateTo({
            url: `/pages/video-player/index?videoUrl=${encodeURIComponent(response.data.videoUrl)}&copywriting=${encodeURIComponent(response.data.copywriting || '')}`
          })
        }
      } else {
        throw new Error(response?.msg || '生成失败')
      }
    } catch (error: any) {
      console.error('[IndexPage] 预览失败:', error)
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '预览失败', icon: 'none' })
      setCurrentStep('upload')
    }
  }

  /**
   * 步骤2: 用户确认后生成视频
   * 必须用户明确点击确认才能调用
   */
  const handleConfirmAndGenerate = async () => {
    if (!previewData) {
      Taro.showToast({ title: '请先预览', icon: 'none' })
      return
    }

    // 显示确认弹窗
    Taro.showModal({
      title: '确认生成视频？',
      content: '将使用豆包1.5生成12秒美女口播视频，预计耗时2-3分钟。',
      confirmText: '确认生成',
      cancelText: '再看看',
      success: async (res) => {
        if (res.confirm) {
          await doGenerateVideo()
        }
      }
    })
  }

  /**
   * 执行视频生成
   */
  const doGenerateVideo = async () => {
    // 如果预览步骤已经生成了视频，直接跳转
    if (previewData?.videoUrl) {
      setVideoUrl(previewData.videoUrl)
      setCurrentStep('result')
      Taro.hideLoading()
      Taro.showToast({ title: '视频生成成功!', icon: 'success' })
      
      // 更新试用次数
      if (!isVIP) {
        setFreeTrialCount(prev => Math.max(0, prev - 1))
      }
      
      // 跳转到视频播放页
      Taro.navigateTo({
        url: `/pages/video-player/index?videoUrl=${encodeURIComponent(previewData.videoUrl)}&copywriting=${encodeURIComponent(previewData.script || '')}`
      })
      return
    }

    // 否则调用生成接口
    setCurrentStep('generating')
    Taro.showLoading({ title: '生成视频中...', mask: true })

    try {
      const result = await Network.request({
        url: '/api/video/generate',
        method: 'POST',
        data: {
          images: uploadedImages,
          openid: AuthService.getOpenid(),
          extraInfo: extraInfo
        }
      })

      const response = result as any

      if (response && response.code === 200 && response.data?.videoUrl) {
        setVideoUrl(response.data.videoUrl)
        setCurrentStep('result')
        Taro.hideLoading()
        Taro.showToast({ title: '视频生成成功!', icon: 'success' })
        
        // 更新试用次数
        if (!isVIP) {
          setFreeTrialCount(prev => Math.max(0, prev - 1))
        }
        
        // 跳转到视频播放页
        Taro.navigateTo({
          url: `/pages/video-player/index?videoUrl=${encodeURIComponent(response.data.videoUrl)}&copywriting=${encodeURIComponent(response.data.copywriting || '')}`
        })
      } else {
        throw new Error(response?.msg || '生成失败')
      }
    } catch (error: any) {
      console.error('[IndexPage] 生成失败:', error)
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '生成失败', icon: 'none' })
      setCurrentStep('preview')
    }
  }

  /**
   * 重新开始
   */
  const handleReset = () => {
    setUploadedImages([])
    setExtraInfo('')
    setPreviewData(null)
    setVideoUrl('')
    setCurrentStep('upload')
  }

  // ========== 渲染 ==========
  
  return (
    <ScrollView className="index-page" scrollY>
      {/* 顶部 */}
      <View className="gradient-header">
        <View className="header-content">
          <View className="title-section">
            <View className="title-row">
              <Sparkles className="title-icon" size={28} color="#fff" />
              <Text className="block main-title">爆款口播探店</Text>
            </View>
            <Text className="block subtitle">宇轩百货 · 12秒美女口播视频</Text>
          </View>

          <View className="trial-badge">
            {isVIP ? (
              <View className="vip-badge">
                <Crown size={14} color="#FFD700" />
                <Text className="block vip-text">会员</Text>
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
          <Users size={16} color="#1890ff" />
          <Text className="block proof-label">{totalUsers.toLocaleString()} 人已使用</Text>
        </View>
        <View className="proof-divider" />
        <View className="proof-item">
          <TrendingUp size={16} color="#1890ff" />
          <Text className="block proof-label">{totalVideos.toLocaleString()} 个视频已生成</Text>
        </View>
      </View>

      {/* ========== 上传阶段 ========== */}
      {currentStep === 'upload' && (
        <>
          {/* 图片上传区域 */}
          <View className="upload-section">
            <View className="section-header">
              <ImagePlus size={20} color="#1890ff" />
              <View>
                <Text className="block section-title">上传店铺图片</Text>
                <Text className="block section-subtitle">3-5张图片，生成12秒美女口播视频</Text>
              </View>
            </View>

            <View className="images-list">
              {uploadedImages.map((image, index) => (
                <View key={index} className="image-item">
                  <Image src={image} mode="aspectFill" className="uploaded-image" />
                  <View className="delete-btn" onClick={() => handleRemoveImage(index)}>
                    <X size={14} color="#fff" />
                  </View>
                  <View className="image-number">{index + 1}</View>
                </View>
              ))}

              {uploadedImages.length < 5 && (
                <View className="upload-btn" onClick={handleUploadImages}>
                  <Camera size={28} color="#1890ff" />
                  <Text className="block upload-btn-text">添加图片</Text>
                </View>
              )}
            </View>

            {uploadedImages.length > 0 && (
              <View className="upload-tip">
                <Text className="block tip-text">已上传 {uploadedImages.length}/5 张图片</Text>
                {uploadedImages.length < 3 && (
                  <Text className="block tip-warning">还需上传 {3 - uploadedImages.length} 张</Text>
                )}
              </View>
            )}
          </View>

          {/* 补充信息 */}
          <View className="extra-info-section">
            <View className="section-header">
              <Text className="block section-title">补充信息</Text>
              <Text className="block section-subtitle">可选：价格、活动、商品细节等</Text>
            </View>
            <View className="textarea-wrapper">
              <Textarea
                className="extra-textarea"
                placeholder="例如：招牌菜88元一份，新店开业全场8折..."
                value={extraInfo}
                onInput={(e) => setExtraInfo(e.detail.value)}
                maxlength={200}
                placeholderStyle="color: #8c8c8c;"
                style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
              />
            </View>
            <Text className="block char-count">{extraInfo.length}/200</Text>
          </View>

          {/* 预览按钮 */}
          <View className="generate-section">
            <Button
              className="generate-btn"
              onClick={handlePreview}
              disabled={uploadedImages.length < 3}
              style={{
                width: '100%',
                background: uploadedImages.length >= 3 
                  ? 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)' 
                  : '#d9d9d9',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Eye size={20} color="#fff" />
              <Text className="block">AI预览分析</Text>
            </Button>
          </View>
        </>
      )}

      {/* ========== 预览中 ========== */}
      {currentStep === 'previewing' && (
        <View className="generating-section">
          <View className="generating-animation">
            <View className="pulse-ring" />
            <Sparkles size={40} color="#1890ff" />
          </View>
          <Text className="block generating-text">AI专家团队正在分析...</Text>
          <View className="expert-steps">
            <View className="expert-step">
              <View className="step-icon">📊</View>
              <Text className="block">图片分析专家</Text>
            </View>
            <View className="expert-step">
              <View className="step-icon">✍️</View>
              <Text className="block">文案专家</Text>
            </View>
            <View className="expert-step">
              <View className="step-icon">🎬</View>
              <Text className="block">分镜专家</Text>
            </View>
          </View>
        </View>
      )}

      {/* ========== 预览结果 ========== */}
      {currentStep === 'preview' && previewData && (
        <View className="preview-section">
          {/* 分析结果卡片 */}
          <View className="preview-card">
            <View className="card-header">
              <View className="card-icon">📊</View>
              <Text className="block card-title">图片分析结果</Text>
            </View>
            <View className="card-content">
              <View className="info-row">
                <Text className="block info-label">店铺名称</Text>
                <Text className="block info-value">{previewData.imageAnalysis?.shopName || '识别中...'}</Text>
              </View>
              <View className="info-row">
                <Text className="block info-label">行业类型</Text>
                <Text className="block info-value">{previewData.imageAnalysis?.industryName || '-'}</Text>
              </View>
              <View className="info-row">
                <Text className="block info-label">店铺氛围</Text>
                <Text className="block info-value">{previewData.imageAnalysis?.atmosphere || '-'}</Text>
              </View>
              {previewData.imageAnalysis?.products?.length > 0 && (
                <View className="info-row">
                  <Text className="block info-label">识别产品</Text>
                  <Text className="block info-value">
                    {previewData.imageAnalysis.products.map(p => p.name).join('、')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 文案卡片 */}
          <View className="preview-card">
            <View className="card-header">
              <View className="card-icon">✍️</View>
              <Text className="block card-title">AI生成文案</Text>
            </View>
            <View className="card-content">
              <Text className="block script-preview">{previewData.script}</Text>
            </View>
          </View>

          {/* 分镜卡片 */}
          <View className="preview-card">
            <View className="card-header">
              <View className="card-icon">🎬</View>
              <Text className="block card-title">分镜脚本</Text>
            </View>
            <View className="card-content">
              {previewData.storyboard?.map((item, index) => (
                <View key={item.id} className="storyboard-item">
                  <View className="storyboard-header">
                    <View className="storyboard-number">{index + 1}</View>
                    <Text className="block storyboard-duration">{item.duration}秒</Text>
                  </View>
                  <Text className="block storyboard-narration">{item.narration}</Text>
                  <Text className="block storyboard-scene">{item.sceneDescription}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 确认提示 */}
          <View className="confirm-notice">
            <CircleAlert size={16} color="#faad14" />
            <Text className="block notice-text">确认后将生成12秒美女口播视频，预计耗时2-3分钟</Text>
          </View>

          {/* 操作按钮 */}
          <View className="preview-actions">
            <Button
              className="action-btn secondary"
              onClick={handleReset}
              style={{
                flex: 1,
                background: '#f5f5f5',
                color: '#666',
                border: 'none',
                borderRadius: '12px',
                padding: '14px'
              }}
            >
              重新上传
            </Button>
            <Button
              className="action-btn primary"
              onClick={handleConfirmAndGenerate}
              style={{
                flex: 2,
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Check size={18} color="#fff" />
              确认生成视频
            </Button>
          </View>
        </View>
      )}

      {/* ========== 生成中 ========== */}
      {currentStep === 'generating' && (
        <View className="generating-section">
          <View className="generating-animation">
            <View className="pulse-ring" />
            <Film size={40} color="#1890ff" />
          </View>
          <Text className="block generating-text">正在生成视频...</Text>
          <Text className="block generating-subtitle">豆包1.5模型正在创作，请耐心等待</Text>
          <View className="progress-bar">
            <View className="progress-fill" style={{ width: '60%' }} />
          </View>
          <Text className="block progress-text">预计还需 1-2 分钟</Text>
        </View>
      )}

      {/* ========== 生成结果 ========== */}
      {currentStep === 'result' && videoUrl && (
        <View className="result-section">
          <View className="success-banner">
            <Check size={24} color="#52c41a" />
            <Text className="block success-title">视频生成成功！</Text>
          </View>

          <View className="video-preview">
            <Video
              src={videoUrl}
              className="preview-video"
              controls
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          </View>

          {previewData?.script && (
            <View className="script-section">
              <Text className="block script-title">口播文案</Text>
              <Text className="block script-text">{previewData.script}</Text>
            </View>
          )}

          <View className="result-actions">
            <Button
              className="action-btn secondary"
              onClick={handleReset}
              style={{
                flex: 1,
                background: '#f5f5f5',
                color: '#1890ff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px'
              }}
            >
              再做一个
            </Button>
            <Button
              className="action-btn primary"
              onClick={() => {
                Taro.showToast({ title: '下载功能开发中', icon: 'none' })
              }}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px'
              }}
            >
              下载视频
            </Button>
          </View>
        </View>
      )}

      {/* 套餐入口 */}
      {!isVIP && currentStep === 'upload' && (
        <View className="vip-entry" onClick={() => Taro.navigateTo({ url: '/pages/vip/index' })}>
          <Crown size={20} color="#FFD700" />
          <Text className="block vip-entry-text">购买套餐，解锁更多功能</Text>
        </View>
      )}

      {/* 底部 */}
      <View className="footer-tip">
        <Text className="block footer-text">宇轩百货 · 12秒美女口播视频</Text>
      </View>
    </ScrollView>
  )
}

export default IndexPage
