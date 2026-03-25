import { View, Text, Image, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { History, Star, ChevronRight, Shield, Award, Camera, Pencil } from 'lucide-react-taro'
import { Network } from '@/network'
import { DatabaseHelper } from '@/utils/database'
import './index.css'

/**
 * 我的页面 - 个人中心
 */
const ProfilePage = () => {
  const [userId, setUserId] = useState('')
  const [isVIP, setIsVIP] = useState(false)
  const [user, setUser] = useState({
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user123',
    nickname: '探索者',
    level: '普通用户',
    videos: 0,
    favorites: 0,
  })
  
  // 编辑昵称相关
  const [showEditNickname, setShowEditNickname] = useState(false)
  const [editNickname, setEditNickname] = useState('')

  // 生成8-9位数字ID
  const generateUserId = () => {
    // 生成8-9位纯数字ID
    const length = Math.random() > 0.5 ? 8 : 9
    let id = ''
    for (let i = 0; i < length; i++) {
      id += Math.floor(Math.random() * 10).toString()
    }
    return id
  }

  // 获取或创建用户ID
  const getOrCreateUserId = () => {
    let storedUserId = Taro.getStorageSync('userId')
    if (!storedUserId) {
      storedUserId = generateUserId()
      Taro.setStorageSync('userId', storedUserId)
    }
    return storedUserId
  }

  // 获取用户信息
  const loadUserInfo = async () => {
    try {
      // 获取或创建用户ID
      const uid = getOrCreateUserId()
      setUserId(uid)
      
      // 获取昵称
      const storedNickname = Taro.getStorageSync('userNickname')
      if (storedNickname) {
        setUser(prev => ({ ...prev, nickname: storedNickname }))
      }
      
      // 获取头像
      const storedAvatar = Taro.getStorageSync('userAvatar')
      if (storedAvatar) {
        setUser(prev => ({ ...prev, avatar: storedAvatar }))
      }
      
      // 获取VIP状态
      const userInfo = Taro.getStorageSync('userInfo')
      if (userInfo?.openid) {
        try {
          const quotaRes = await Network.request({
            url: `/api/vip/quota?openid=${userInfo.openid}`
          })
          
          if (quotaRes.data?.code === 200) {
            setIsVIP(quotaRes.data.data.isVip)
            if (quotaRes.data.data.isVip) {
              setUser(prev => ({ ...prev, level: '尊享会员' }))
            }
          }
        } catch (e) {
          console.log('获取VIP状态失败', e)
        }
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
    }
  }

  // 加载统计数据
  const loadStats = async () => {
    try {
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

  useEffect(() => {
    loadStats()
    loadUserInfo()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 上传头像
  const handleUploadAvatar = () => {
    if (Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) {
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
              let avatarUrl = uploadData.data.url
              if (avatarUrl.startsWith('/')) {
                avatarUrl = `https://yuxuanbaihuo.site${avatarUrl}`
              }
              setUser(prev => ({ ...prev, avatar: avatarUrl }))
              Taro.setStorageSync('userAvatar', avatarUrl)
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

  // 打开编辑昵称弹窗
  const handleEditNickname = () => {
    setEditNickname(user.nickname)
    setShowEditNickname(true)
  }

  // 保存昵称
  const handleSaveNickname = () => {
    if (!editNickname.trim()) {
      Taro.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    if (editNickname.length > 12) {
      Taro.showToast({ title: '昵称最多12个字', icon: 'none' })
      return
    }
    setUser(prev => ({ ...prev, nickname: editNickname.trim() }))
    Taro.setStorageSync('userNickname', editNickname.trim())
    setShowEditNickname(false)
    Taro.showToast({ title: '昵称修改成功', icon: 'success' })
  }

  // 复制ID
  const handleCopyId = () => {
    Taro.setClipboardData({ data: userId })
    Taro.showToast({ title: 'ID已复制', icon: 'success' })
  }

  // 功能菜单
  const menuItems = [
    {
      icon: <History size={20} color="#8B5CF6" />,
      title: '生成历史',
      desc: '查看我的所有视频',
      badge: `${user.videos}个`,
      action: () => Taro.switchTab({ url: '/pages/discover/index' })
    },
    {
      icon: <Star size={20} color="#8B5CF6" />,
      title: '我的收藏',
      desc: '收藏的精彩视频',
      badge: `${user.favorites}个`,
      action: () => Taro.switchTab({ url: '/pages/discover/index' })
    }
  ]

  // 法律信息菜单
  const legalItems = [
    {
      icon: <Shield size={20} color="#8B5CF6" />,
      title: '隐私政策',
      action: () => Taro.navigateTo({ url: '/pages/privacy/index' })
    },
    {
      icon: <Shield size={20} color="#8B5CF6" />,
      title: '用户协议',
      action: () => Taro.navigateTo({ url: '/pages/agreement/index' })
    }
  ]

  return (
    <View className="tech-page">
      {/* 科技感背景 */}
      <View className="tech-bg"></View>
      <View className="tech-particles"></View>

      {/* 主内容区 */}
      <ScrollView scrollY className="tech-content" style={{ paddingBottom: '20px' }}>
        {/* 用户信息卡片 */}
        <View className="tech-profile-card">
          <View className="tech-profile-bg"></View>
          
          {/* 用户头像和信息 */}
          <View className="tech-user-info">
            <View className="tech-avatar-container" onClick={handleUploadAvatar}>
              <Image src={user.avatar} mode="aspectFill" className="tech-avatar" />
              <View className="tech-avatar-upload">
                <Camera size={16} color="#fff" />
              </View>
            </View>
            
            <View className="tech-user-details">
              {/* 昵称 + 编辑按钮 */}
              <View className="tech-nickname-row" onClick={handleEditNickname}>
                <Text className="tech-user-name">{user.nickname}</Text>
                <Pencil size={16} color="#8B5CF6" className="tech-edit-icon" />
              </View>
              <View className="tech-user-level">
                <Text className="tech-level-text">{user.level}</Text>
              </View>
              {/* 用户专属ID */}
              <View className="tech-userid-section">
                <Text className="tech-userid-label">ID: </Text>
                <Text className="tech-userid-value">{userId}</Text>
                <Text className="tech-copy-btn" onClick={handleCopyId}>复制</Text>
              </View>
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
              <Text className="tech-stat-value">{user.favorites}</Text>
              <Text className="tech-stat-label">收藏数</Text>
            </View>
          </View>
        </View>

        {/* 功能菜单 */}
        <View className="tech-section">
          <Text className="tech-section-title">我的功能</Text>
          <View className="tech-menu-list">
            {menuItems.map((item, index) => (
              <View key={index} className="tech-menu-item" onClick={item.action}>
                <View className="tech-menu-icon">{item.icon}</View>
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

        {/* 法律信息菜单 */}
        <View className="tech-section">
          <Text className="tech-section-title">法律信息</Text>
          <View className="tech-menu-list">
            {legalItems.map((item, index) => (
              <View key={index} className="tech-menu-item" onClick={item.action}>
                <View className="tech-menu-icon">{item.icon}</View>
                <View className="tech-menu-content">
                  <Text className="tech-menu-title">{item.title}</Text>
                </View>
                <View className="tech-menu-right">
                  <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 版本信息 */}
        <View className="tech-footer-info">
          <Text className="tech-footer-text">宇轩百货 V2.0</Text>
          <Text className="tech-footer-desc">Powered by AI Technology</Text>
        </View>
      </ScrollView>

      {/* 编辑昵称弹窗 */}
      {showEditNickname && (
        <View className="tech-modal-overlay" onClick={() => setShowEditNickname(false)}>
          <View className="tech-modal-content" onClick={(e) => e.stopPropagation()}>
            <Text className="tech-modal-title">修改昵称</Text>
            <View className="tech-modal-input-wrap">
              <Input
                className="tech-modal-input"
                placeholder="请输入昵称（最多12个字）"
                placeholderClass="tech-modal-placeholder"
                value={editNickname}
                maxlength={12}
                onInput={(e) => setEditNickname(e.detail.value)}
              />
            </View>
            <View className="tech-modal-btns">
              <View className="tech-modal-btn tech-modal-cancel" onClick={() => setShowEditNickname(false)}>
                <Text className="tech-modal-btn-text">取消</Text>
              </View>
              <View className="tech-modal-btn tech-modal-confirm" onClick={handleSaveNickname}>
                <Text className="tech-modal-btn-text-confirm">保存</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View className="tech-safe-area" />
    </View>
  )
}

export default ProfilePage
