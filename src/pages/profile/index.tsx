import { View, Text, Button, Image, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Settings, History, Star, Download, Award, ChevronRight, Shield, Bell, LogOut, Camera } from 'lucide-react-taro'
import { Network } from '@/network'
import { DatabaseHelper } from '@/utils/database'
import './index.css'

/**
 * 我的页面 - 个人中心（科技风格）
 */
const ProfilePage = () => {
  const [openid, setOpenid] = useState('')
  const [isVIP, setIsVIP] = useState(false)
  const [user, setUser] = useState({
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user123',
    nickname: '探索者',
    level: '普通用户',
    videos: 0,
    favorites: 0,
    likes: 0,
    points: 9800,
    totalTime: '2.5小时',
    storageUsed: '128MB',
    storageTotal: '1GB',
    storagePercent: 12.8,
  })

  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  // 获取用户openid和VIP状态
  const loadUserInfo = async () => {
    try {
      const loginRes = await Taro.login()
      if (loginRes.code) {
        // 调用后端获取openid
        const res = await Network.request({
          url: '/api/auth/login',
          method: 'POST',
          data: { code: loginRes.code }
        })
        
        if (res.data?.code === 200 && res.data?.data?.openid) {
          setOpenid(res.data.data.openid)
          
          // 获取VIP状态
          const quotaRes = await Network.request({
            url: `/api/vip/quota?openid=${res.data.data.openid}`
          })
          
          if (quotaRes.data?.code === 200) {
            setIsVIP(quotaRes.data.data.isVip)
            if (quotaRes.data.data.isVip) {
              setUser(prev => ({ ...prev, level: '尊享会员' }))
            }
          }
        }
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
    }
  }

  // 加载统计数据
  const loadStats = async () => {
    try {
      // 获取视频总数和收藏总数
      const [historyRes, favoritesRes] = await Promise.all([
        DatabaseHelper.getVideoHistoryStats(),
        DatabaseHelper.getAllVideoFavorites()
      ])

      if (historyRes.code === 200 && historyRes.data) {
        setUser(prev => ({
          ...prev,
          videos: historyRes.data.total || 0
        }))
      }

      if (favoritesRes.code === 200 && favoritesRes.data) {
        setUser(prev => ({
          ...prev,
          favorites: favoritesRes.data.length || 0
        }))
      }
    } catch (err) {
      console.error('加载统计数据失败:', err)
    }
  }

  // 页面加载时获取统计数据和用户信息
  useEffect(() => {
    loadStats()
    loadUserInfo()
  }, [])

  // 上传头像
  const handleUploadAvatar = () => {
    if (!isWeapp) {
      Taro.showToast({ title: '仅小程序支持', icon: 'none' })
      return
    }

    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        if (res.tempFilePaths && res.tempFilePaths.length > 0) {
          Taro.showLoading({ title: '上传中...' })
          
          try {
            const uploadRes = await Network.uploadFile({
              url: '/api/upload',
              filePath: res.tempFilePaths[0],
              name: 'file'
            })

            const uploadData = JSON.parse(uploadRes.data)
            if (uploadData.code === 200 && uploadData.data?.url) {
              setUser(prev => ({ ...prev, avatar: uploadData.data.url }))
              Taro.showToast({ title: '头像更新成功', icon: 'success' })
            }
          } catch (err) {
            console.error('上传头像失败', err)
            Taro.showToast({ title: '上传失败', icon: 'none' })
          } finally {
            Taro.hideLoading()
          }
        }
      }
    })
  }
  const menuItems = [
    {
      icon: <History size={20} color="#8B5CF6" />,
      title: '生成历史',
      desc: '查看我的所有视频',
      badge: `${user.videos}个`,
      action: () => {
        Taro.switchTab({ url: '/pages/discover/index' })
        // 可以通过事件或全局状态设置默认标签
      }
    },
    {
      icon: <Star size={20} color="#8B5CF6" />,
      title: '我的收藏',
      desc: '收藏的精彩视频',
      badge: `${user.favorites}个`,
      action: () => {
        Taro.switchTab({ url: '/pages/discover/index' })
        // 可以通过事件或全局状态设置默认标签
      }
    },
    {
      icon: <Download size={20} color="#8B5CF6" />,
      title: '下载记录',
      desc: '已下载的视频',
      badge: '开发中',
      action: () => {
        Taro.showToast({ title: '开发中...', icon: 'none' })
      }
    },
    {
      icon: <Award size={20} color="#8B5CF6" />,
      title: '成就中心',
      desc: '查看我的成就',
      badge: '开发中',
      action: () => {
        Taro.showToast({ title: '开发中...', icon: 'none' })
      }
    }
  ]

  // 设置菜单
  const settingsItems = [
    {
      icon: <Shield size={20} color="#8B5CF6" />,
      title: '隐私设置',
      desc: '管理账号隐私',
      action: () => {
        Taro.showToast({ title: '开发中...', icon: 'none' })
      }
    },
    {
      icon: <Bell size={20} color="#8B5CF6" />,
      title: '消息通知',
      desc: '通知偏好设置',
      action: () => {
        Taro.showToast({ title: '开发中...', icon: 'none' })
      }
    },
    {
      icon: <Settings size={20} color="#8B5CF6" />,
      title: '通用设置',
      desc: '应用设置',
      action: () => {
        Taro.showToast({ title: '开发中...', icon: 'none' })
      }
    }
  ]

  // 法律信息菜单
  const legalItems = [
    {
      icon: <Shield size={20} color="#8B5CF6" />,
      title: '隐私政策',
      desc: '了解我们如何保护您的隐私',
      action: () => {
        Taro.navigateTo({ url: '/pages/privacy/index' })
      }
    },
    {
      icon: <Shield size={20} color="#8B5CF6" />,
      title: '用户协议',
      desc: '了解服务条款和用户权利',
      action: () => {
        Taro.navigateTo({ url: '/pages/agreement/index' })
      }
    }
  ]

  // 退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  }

  return (
    <View className="tech-page">
      {/* 科技感背景 */}
      <View className="tech-bg"></View>
      <View className="tech-particles"></View>

      {/* 主内容区 */}
      <ScrollView 
        scrollY 
        className="tech-content"
        style={{ paddingBottom: '20px' }}
      >
        {/* 用户信息卡片 */}
        <View className="tech-profile-card">
          {/* 背景装饰 */}
          <View className="tech-profile-bg"></View>
          
          {/* 用户头像和信息 */}
          <View className="tech-user-info">
            <View className="tech-avatar-container" onClick={handleUploadAvatar}>
              <Image
                src={user.avatar}
                mode="aspectFill"
                className="tech-avatar"
              />
              <View className="tech-avatar-badge">
                <Award size={16} color="#fff" />
              </View>
              <View className="tech-avatar-upload">
                <Camera size={16} color="#fff" />
              </View>
            </View>
            
            <View className="tech-user-details">
              <Text className="tech-user-name">{user.nickname}</Text>
              <View className="tech-user-level">
                <Text className="tech-level-text">{user.level}</Text>
              </View>
              {openid && (
                <View className="tech-openid-section">
                  <Text className="tech-openid-label">ID: </Text>
                  <Text className="tech-openid-value">{openid.substring(0, 16)}...</Text>
                  <Text 
                    className="tech-copy-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      Taro.setClipboardData({ data: openid })
                      Taro.showToast({ title: 'ID已复制', icon: 'success' })
                    }}
                  >
                    复制
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* VIP状态提示 */}
          {isVIP && (
            <View className="tech-vip-badge-large">
              <Award size={20} color="#FFD700" />
              <Text className="tech-vip-text">尊享会员</Text>
            </View>
          )}

          {/* 数据统计 */}
          <View className="tech-stats-grid">
            <View className="tech-stat-item">
              <Text className="tech-stat-value">{user.videos}</Text>
              <Text className="tech-stat-label">生成视频</Text>
            </View>
            <View className="tech-stat-divider"></View>
            <View className="tech-stat-item">
              <Text className="tech-stat-value">{user.likes}</Text>
              <Text className="tech-stat-label">获赞数</Text>
            </View>
            <View className="tech-stat-divider"></View>
            <View className="tech-stat-item">
              <Text className="tech-stat-value">{user.points}</Text>
              <Text className="tech-stat-label">积分</Text>
            </View>
          </View>

          {/* 详细数据统计 */}
          <View className="tech-detailed-stats">
            <View className="tech-detailed-stat-row">
              <View className="tech-detailed-stat-item">
                <Text className="tech-detailed-stat-label">总使用时长</Text>
                <Text className="tech-detailed-stat-value">{user.totalTime}</Text>
              </View>
              <View className="tech-detailed-stat-divider"></View>
              <View className="tech-detailed-stat-item">
                <Text className="tech-detailed-stat-label">本周使用</Text>
                <Text className="tech-detailed-stat-value">45分钟</Text>
              </View>
            </View>

            <View className="tech-storage-section">
              <View className="tech-storage-header">
                <Text className="tech-storage-label">存储空间</Text>
                <Text className="tech-storage-text">
                  {user.storageUsed} / {user.storageTotal}
                </Text>
              </View>
              <View className="tech-storage-bar">
                <View 
                  className="tech-storage-progress" 
                  style={{ width: `${user.storagePercent}%` }}
                ></View>
              </View>
              <View className="tech-storage-info">
                <Text className="tech-storage-desc">
                  已使用 {user.storagePercent}%，还有充足空间
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 功能菜单 */}
        <View className="tech-section">
          <Text className="tech-section-title">我的功能</Text>
          
          <View className="tech-menu-list">
            {menuItems.map((item, index) => (
              <View
                key={index}
                className="tech-menu-item"
                onClick={item.action}
              >
                <View className="tech-menu-icon">
                  {item.icon}
                </View>
                
                <View className="tech-menu-content">
                  <Text className="tech-menu-title">{item.title}</Text>
                  <Text className="tech-menu-desc">{item.desc}</Text>
                </View>

                <View className="tech-menu-right">
                  <Text className="tech-menu-badge">{item.badge}</Text>
                  <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 设置菜单 */}
        <View className="tech-section">
          <Text className="tech-section-title">设置</Text>
          
          <View className="tech-menu-list">
            {settingsItems.map((item, index) => (
              <View
                key={index}
                className="tech-menu-item"
                onClick={item.action}
              >
                <View className="tech-menu-icon">
                  {item.icon}
                </View>
                
                <View className="tech-menu-content">
                  <Text className="tech-menu-title">{item.title}</Text>
                  <Text className="tech-menu-desc">{item.desc}</Text>
                </View>

                <View className="tech-menu-right">
                  <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 法律信息菜单 */}
        <View className="tech-section">
          <Text className="tech-section-title">法律信息</Text>
          
          <View className="tech-menu-list">
            {legalItems.map((item, index) => (
              <View
                key={index}
                className="tech-menu-item"
                onClick={item.action}
              >
                <View className="tech-menu-icon">
                  {item.icon}
                </View>
                
                <View className="tech-menu-content">
                  <Text className="tech-menu-title">{item.title}</Text>
                  <Text className="tech-menu-desc">{item.desc}</Text>
                </View>

                <View className="tech-menu-right">
                  <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 退出登录按钮 */}
        <View className="tech-section">
          <Button
            onClick={handleLogout}
            className="tech-logout-btn"
          >
            <LogOut size={20} color="#EF4444" />
            <Text className="tech-logout-text">退出登录</Text>
          </Button>
        </View>

        {/* 版本信息 */}
        <View className="tech-footer-info">
          <Text className="tech-footer-text">宇轩百货 V2.0</Text>
          <Text className="tech-footer-desc">Powered by AI Technology</Text>
        </View>
      </ScrollView>

      {/* 底部安全区域 */}
      <View className="tech-safe-area" />
    </View>
  )
}

export default ProfilePage
