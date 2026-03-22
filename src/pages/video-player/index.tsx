import { View, Text, Video, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import { Network } from '@/network'
import './index.css'

interface TaskResult {
  videoUrl: string
  copywriting?: string
  storeName?: string
}

export default function VideoPlayerPage() {
  const router = useRouter()
  const { taskId } = router.params
  
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTaskResult = useCallback(async () => {
    if (!taskId) return
    
    try {
      const response = await Network.request({
        url: `/api/video/task/${taskId}`,
        method: 'GET'
      })

      console.log('任务结果:', response)

      const data = response as any
      if (data.code === 200 && data.data) {
        setTaskResult(data.data.result)
      }
    } catch (error) {
      console.error('获取任务结果失败:', error)
      Taro.showToast({ title: '获取视频失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    if (!taskId) {
      Taro.showToast({ title: '任务ID不存在', icon: 'error' })
      return
    }

    fetchTaskResult()
  }, [taskId, fetchTaskResult])

  const handleDownload = () => {
    if (!taskResult?.videoUrl) {
      Taro.showToast({ title: '视频地址不存在', icon: 'error' })
      return
    }

    // 使用 Network.downloadFile 下载视频
    Network.downloadFile({
      url: taskResult.videoUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          Taro.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              Taro.showToast({ title: '保存成功', icon: 'success' })
            },
            fail: (err) => {
              console.error('保存失败:', err)
              Taro.showToast({ title: '保存失败', icon: 'error' })
            }
          })
        }
      },
      fail: (err) => {
        console.error('下载失败:', err)
        Taro.showToast({ title: '下载失败', icon: 'error' })
      }
    })
  }

  const handleShare = () => {
    // 小程序分享
    Taro.showShareMenu({
      withShareTicket: true
    })
  }

  const handleCopywritingCopy = async () => {
    if (!taskResult?.copywriting) {
      Taro.showToast({ title: '文案不存在', icon: 'error' })
      return
    }

    try {
      await Taro.setClipboardData({
        data: taskResult.copywriting
      })
      Taro.showToast({ title: '文案已复制', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '复制失败', icon: 'error' })
    }
  }

  if (loading) {
    return (
      <View className="flex flex-col items-center justify-center h-full bg-white">
        <Text className="text-lg">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col h-full bg-white">
      {/* 视频播放器 */}
      <View className="w-full bg-black">
        {taskResult?.videoUrl ? (
          <Video
            src={taskResult.videoUrl}
            className="w-full"
            style={{ height: '562px' }}
            controls
            autoplay
            showFullscreenBtn
            showPlayBtn
            showCenterPlayBtn
          />
        ) : (
          <View className="flex items-center justify-center h-96">
            <Text className="text-white">视频加载失败</Text>
          </View>
        )}
      </View>

      {/* 店铺信息 */}
      {taskResult?.storeName && (
        <View className="p-4 border-b border-gray-100">
          <Text className="block text-lg font-bold text-gray-900">
            {taskResult.storeName}
          </Text>
        </View>
      )}

      {/* 口播文案 */}
      {taskResult?.copywriting && (
        <View className="p-6">
          <View className="flex flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900">口播文案</Text>
            <Button 
              className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
              onClick={handleCopywritingCopy}
            >
              复制
            </Button>
          </View>
          
          <View className="bg-gray-50 rounded-xl p-4">
            <Text className="block text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
              {taskResult.copywriting}
            </Text>
          </View>
        </View>
      )}

      {/* 操作按钮 */}
      <View className="mt-auto p-6 border-t border-gray-100">
        <View className="flex flex-row gap-4">
          <Button 
            className="flex-1 bg-green-500 text-white rounded-full py-3"
            onClick={handleDownload}
          >
            下载视频
          </Button>
          <Button 
            className="flex-1 bg-blue-500 text-white rounded-full py-3"
            onClick={handleShare}
          >
            分享
          </Button>
        </View>
      </View>
    </View>
  )
}
