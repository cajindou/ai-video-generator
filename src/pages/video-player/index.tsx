import { View, Text, Video, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { ArrowLeft, Download, Share2, Heart, Volume2, VolumeX } from 'lucide-react-taro'
import { useState, useEffect } from 'react'
import { DatabaseHelper } from '@/utils/database'
import './index.css'

/**
 * 视频播放页面
 */
const VideoPlayerPage = () => {
  const router = useRouter()
  const videoUrl = decodeURIComponent(router.params.videoUrl || '')
  const title = decodeURIComponent(router.params.title || '视频播放')
  const storeName = decodeURIComponent(router.params.storeName || '未知店铺')

  const [isMuted, setIsMuted] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  // 检查收藏状态
  useEffect(() => {
    if (videoUrl) {
      DatabaseHelper.isVideoFavorite(videoUrl)
        .then((res) => {
          if (res.code === 200 && res.data?.isFavorite) {
            setIsLiked(true)
          }
        })
        .catch((err) => {
          console.error('检查收藏状态失败:', err)
        })
    }
  }, [videoUrl])

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleDownload = () => {
    Taro.showToast({ title: '下载功能开发中', icon: 'none' })
  }

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' })
  }

  const handleLike = async () => {
    try {
      const result = await DatabaseHelper.toggleVideoFavorite({
        videoUrl: videoUrl,
        storeName: storeName,
        coverImage: videoUrl // 使用视频URL作为封面（实际应用中应使用真实的封面图片）
      })

      if (result.code === 200) {
        setIsLiked(result.data?.isFavorite || false)
        Taro.showToast({
          title: result.msg || (isLiked ? '取消收藏' : '已收藏'),
          icon: 'success'
        })
      } else {
        throw new Error(result.msg || '操作失败')
      }
    } catch (err) {
      console.error('收藏操作失败:', err)
      Taro.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      })
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <View className="video-player-page">
      {/* 顶部导航栏 */}
      <View className="video-header">
        <Button onClick={handleBack} className="video-back-btn">
          <ArrowLeft size={24} color="#fff" />
        </Button>
        <Text className="video-title">{title}</Text>
        <View className="video-header-actions">
          <Button onClick={handleShare} className="video-action-btn">
            <Share2 size={20} color="#fff" />
          </Button>
          <Button onClick={handleDownload} className="video-action-btn">
            <Download size={20} color="#fff" />
          </Button>
        </View>
      </View>

      {/* 视频播放区域 */}
      <View className="video-container">
        <Video
          src={videoUrl}
          className="video-player"
          controls
          autoplay
          loop
          showCenterPlayBtn
          showPlayBtn
          objectFit="contain"
          muted={isMuted}
          enableProgressGesture
          showFullscreenBtn
        />
        
        {/* 静音按钮 */}
        <Button onClick={toggleMute} className="video-mute-btn">
          {isMuted ? <VolumeX size={24} color="#fff" /> : <Volume2 size={24} color="#fff" />}
        </Button>
      </View>

      {/* 底部操作栏 */}
      <View className="video-footer">
        <Button onClick={handleLike} className={`video-like-btn ${isLiked ? 'video-like-active' : ''}`}>
          <Heart size={20} color={isLiked ? '#EF4444' : '#fff'} />
          <Text className="video-like-text">{isLiked ? '已收藏' : '收藏'}</Text>
        </Button>
        
        <Button onClick={handleDownload} className="video-footer-btn">
          <Download size={20} color="#fff" />
          <Text className="video-footer-text">下载</Text>
        </Button>
        
        <Button onClick={handleShare} className="video-footer-btn">
          <Share2 size={20} color="#fff" />
          <Text className="video-footer-text">分享</Text>
        </Button>
      </View>
    </View>
  )
}

export default VideoPlayerPage
