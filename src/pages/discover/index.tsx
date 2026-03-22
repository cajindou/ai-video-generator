import { View, Text, Button, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Play, Clock, Heart, Search, Flame, Award, Star, Film } from 'lucide-react-taro'
import { DatabaseHelper } from '@/utils/database'
import './index.css'

/**
 * 发现页面 - 案例展示（科技风格）
 */
const DiscoverPage = () => {
  const [activeTab, setActiveTab] = useState<'hot' | 'new' | 'favorite'>('hot')
  const [historyList, setHistoryList] = useState<any[]>([])
  const [favoriteList, setFavoriteList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 加载历史记录
  const loadHistory = async () => {
    try {
      setLoading(true)
      const res = await DatabaseHelper.getAllVideoHistory()
      if (res.code === 200 && res.data) {
        setHistoryList(res.data)
      }
    } catch (err) {
      console.error('加载历史记录失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 加载收藏列表
  const loadFavorites = async () => {
    try {
      setLoading(true)
      const res = await DatabaseHelper.getAllVideoFavorites()
      if (res.code === 200 && res.data) {
        setFavoriteList(res.data)
      }
    } catch (err) {
      console.error('加载收藏列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 切换标签时加载数据
  useEffect(() => {
    if (activeTab === 'hot' || activeTab === 'new') {
      loadHistory()
    } else if (activeTab === 'favorite') {
      loadFavorites()
    }
  }, [activeTab])

  // 初始加载
  useEffect(() => {
    loadHistory()
  }, [])

  // 分类标签
  const categories = [
    { id: 'hot', name: '热门推荐', icon: <Flame size={14} color="#8B5CF6" /> },
    { id: 'new', name: '最新发布', icon: <Clock size={14} color="#8B5CF6" /> },
    { id: 'favorite', name: '我的收藏', icon: <Star size={14} color="#8B5CF6" /> }
  ]

  // 观看视频
  const handlePlayVideo = (item: any) => {
    if (item.videoUrl) {
      Taro.navigateTo({
        url: `/pages/video-player/index?videoUrl=${encodeURIComponent(item.videoUrl)}&title=${encodeURIComponent(item.storeName)}&storeName=${encodeURIComponent(item.storeName)}`
      })
    } else {
      Taro.showToast({ title: '视频暂未上传', icon: 'none' })
    }
  }

  // 获取当前标签的视频列表
  const getVideoList = () => {
    if (activeTab === 'hot') {
      // 热门推荐：按时间倒序（最新的在前）
      return historyList.slice()
    } else if (activeTab === 'new') {
      // 最新发布：按创建时间倒序
      return historyList.slice()
    } else {
      // 我的收藏
      return favoriteList
    }
  }

  // 获取当前视频列表
  const currentVideos = getVideoList()

  // 判断是否为空
  const isEmpty = currentVideos.length === 0

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  }

  return (
    <View className="tech-page">
      {/* 科技感背景 */}
      <View className="tech-bg"></View>
      <View className="tech-particles"></View>

      {/* 顶部标题栏 */}
      <View className="tech-header">
        <View className="flex items-center">
          <View className="tech-logo">
            <Heart size={24} color="#8B5CF6" />
          </View>
          <Text className="tech-title">发现</Text>
        </View>
        <View className="tech-filter-btn">
          <Search size={20} color="#8B5CF6" />
        </View>
      </View>

      {/* 分类标签栏 */}
      <View className="tech-tab-bar">
        {categories.map((category) => (
          <View
            key={category.id}
            className={`tech-tab-item ${activeTab === category.id ? 'tech-tab-active' : ''}`}
            onClick={() => setActiveTab(category.id as any)}
          >
            <View className="tech-tab-icon">{category.icon}</View>
            <Text className="tech-tab-text">{category.name}</Text>
          </View>
        ))}
      </View>

      {/* 主内容区 */}
      <ScrollView
        scrollY
        className="tech-content"
        style={{ paddingBottom: '20px' }}
      >
        {loading ? (
          <View className="tech-loading">
            <View className="tech-loading-spinner"></View>
            <Text className="tech-loading-text">加载中...</Text>
          </View>
        ) : isEmpty ? (
          /* 空状态 */
          <View className="tech-section">
            <View className="tech-empty-state">
              {activeTab === 'favorite' ? (
                <Star size={64} color="rgba(139, 92, 246, 0.3)" />
              ) : (
                <Film size={64} color="rgba(139, 92, 246, 0.3)" />
              )}
              <Text className="tech-empty-title">
                {activeTab === 'favorite' ? '暂无收藏' : '暂无历史记录'}
              </Text>
              <Text className="tech-empty-desc">
                {activeTab === 'favorite'
                  ? '去发现页收藏喜欢的视频吧'
                  : '去首页生成你的第一个视频吧'}
              </Text>
              <Button
                onClick={() => {
                  if (activeTab === 'favorite') {
                    setActiveTab('hot')
                  } else {
                    Taro.switchTab({ url: '/pages/index/index' })
                  }
                }}
                className="tech-empty-btn"
              >
                {activeTab === 'favorite' ? '去发现' : '去生成'}
              </Button>
            </View>
          </View>
        ) : (
          /* 视频列表 */
          <View className="tech-section">
            <View className="tech-section-header">
              <View className="flex items-center">
                {activeTab === 'hot' && <Flame size={20} color="#EF4444" />}
                {activeTab === 'new' && <Clock size={20} color="#8B5CF6" />}
                {activeTab === 'favorite' && <Star size={20} color="#8B5CF6" />}
                <Text className="tech-section-title">
                  {activeTab === 'hot' ? '热门推荐' : activeTab === 'new' ? '最新发布' : '我的收藏'}
                </Text>
              </View>
              {activeTab === 'hot' && <Text className="tech-section-more">更多 →</Text>}
            </View>

            <View className="tech-video-list">
              {currentVideos.map((item) => (
                <View key={item.id} className="tech-video-card">
                  {/* 封面图 */}
                  <View className="tech-video-cover" onClick={() => handlePlayVideo(item)}>
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <Image
                        src={item.imageUrls[0]}
                        mode="aspectFill"
                        className="tech-cover-image"
                      />
                    ) : (
                      <View className="tech-cover-placeholder">
                        <Film size={48} color="rgba(255, 255, 255, 0.5)" />
                      </View>
                    )}
                    <View className="tech-play-overlay">
                      <Play size={48} color="#fff" />
                    </View>
                    {activeTab === 'hot' && (
                      <View className="tech-video-badge tech-video-badge-hot">
                        <Award size={12} color="#fff" />
                        <Text className="tech-badge-text">热门</Text>
                      </View>
                    )}
                    <View className="tech-video-info">
                      <Text className="tech-time-text">{formatTime(item.createdAt)}</Text>
                    </View>
                  </View>

                  {/* 视频信息 */}
                  <View className="tech-video-details">
                    <Text className="tech-video-title">{item.storeName}</Text>
                    {item.copywriting && (
                      <Text className="tech-video-desc" numberOfLines={2}>
                        {item.copywriting}
                      </Text>
                    )}
                    <View className="tech-video-meta">
                      <View className="tech-views-badge">
                        <Clock size={12} color="#8B5CF6" />
                        <Text className="tech-views-text">{formatTime(item.createdAt)}</Text>
                      </View>
                      {activeTab === 'favorite' && (
                        <View className="tech-favorite-time">
                          <Star size={12} color="#EF4444" />
                          <Text className="tech-favorite-text">
                            {formatTime(item.createdAt)}收藏
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 加载更多提示 */}
        <View className="tech-load-more">
          <View className="tech-loading-dots">
            <View className="tech-dot"></View>
            <View className="tech-dot"></View>
            <View className="tech-dot"></View>
          </View>
          <Text className="tech-load-more-text">加载更多精彩内容...</Text>
        </View>
      </ScrollView>

      {/* 底部安全区域 */}
      <View className="tech-safe-area" />
    </View>
  )
}

export default DiscoverPage
