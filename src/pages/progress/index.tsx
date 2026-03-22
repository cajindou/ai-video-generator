import { View, Text, Progress, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import './index.css'

interface ProductAnalysis {
  name: string
  category: string
  features: string[]
  painPoints: string[]
  highlights: string[]
  differentiators: string[]
  sellingPoints: string[]
}

interface TaskStatus {
  taskId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  step: string
  analysis?: {
    shopName?: string
    industry?: string
    industryName?: string
    products?: ProductAnalysis[]
    overallAtmosphere?: string
    targetAudience?: string
  }
  result?: {
    videoUrl: string
    copywriting?: string
    storeName?: string
  }
  error?: string
}

export default function ProgressPage() {
  const router = useRouter()
  const { taskId } = router.params
  
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskId) {
      Taro.showToast({ title: '任务ID不存在', icon: 'error' })
      return
    }

    // 开始轮询任务状态
    const pollInterval = setInterval(async () => {
      try {
        const response = await Network.request({
          url: `/api/video/task/${taskId}`,
          method: 'GET'
        })

        console.log('任务状态:', response)
        
        const data = response as any
        if (data.code === 200 && data.data) {
          setTaskStatus(data.data)
          setLoading(false)

          // 如果任务完成或失败，停止轮询
          if (data.data.status === 'completed') {
            clearInterval(pollInterval)
            // 跳转到视频播放页
            setTimeout(() => {
              Taro.navigateTo({
                url: `/pages/video-player/index?taskId=${taskId}`
              })
            }, 1000)
          } else if (data.data.status === 'failed') {
            clearInterval(pollInterval)
            Taro.showToast({ title: data.data.error || '生成失败', icon: 'error' })
          }
        }
      } catch (error) {
        console.error('查询任务状态失败:', error)
      }
    }, 2000) // 每2秒查询一次

    // 清理定时器
    return () => clearInterval(pollInterval)
  }, [taskId])

  const handleCancel = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要取消生成吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateBack()
        }
      }
    })
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
      {/* 顶部标题 */}
      <View className="p-6 border-b border-gray-100">
        <Text className="block text-xl font-bold text-gray-900">视频生成中</Text>
        <Text className="block text-sm text-gray-500 mt-1">
          预计需要 30-60 秒，请耐心等待
        </Text>
      </View>

      {/* 进度显示 */}
      <View className="p-6">
        <View className="flex flex-row items-center justify-between mb-3">
          <Text className="text-base font-medium text-gray-900">
            {taskStatus?.step || '正在处理...'}
          </Text>
          <Text className="text-base font-bold text-green-600">
            {taskStatus?.progress || 0}%
          </Text>
        </View>
        <Progress 
          percent={taskStatus?.progress || 0} 
          strokeWidth={8}
          active
        />
      </View>

      {/* AI分析结果 */}
      {taskStatus?.analysis && taskStatus.analysis.products && taskStatus.analysis.products.length > 0 && (
        <View className="p-6 border-t border-gray-100">
          <View className="flex flex-row items-center mb-4">
            <Text className="text-lg font-semibold text-gray-900">AI识别到的产品</Text>
            <View className="ml-2 px-2 py-1 bg-green-100 rounded">
              <Text className="text-xs text-green-600">{taskStatus.analysis.products.length}个产品</Text>
            </View>
          </View>

          {taskStatus.analysis.products.map((product, index) => (
            <View key={index} className="bg-gray-50 rounded-xl p-4 mb-3">
              <View className="flex flex-row items-center mb-2">
                <Text className="text-base font-semibold text-gray-900">{product.name}</Text>
                {product.category && (
                  <View className="ml-2 px-2 py-1 bg-blue-100 rounded">
                    <Text className="text-xs text-blue-600">{product.category}</Text>
                  </View>
                )}
              </View>
              
              {product.highlights && product.highlights.length > 0 && (
                <View className="mt-2">
                  <Text className="block text-sm text-gray-600 mb-1">亮点：</Text>
                  <Text className="block text-sm text-gray-800">
                    {product.highlights.join('、')}
                  </Text>
                </View>
              )}

              {product.painPoints && product.painPoints.length > 0 && (
                <View className="mt-2">
                  <Text className="block text-sm text-gray-600 mb-1">解决痛点：</Text>
                  <Text className="block text-sm text-gray-800">
                    {product.painPoints.join('、')}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* 底部按钮 */}
      <View className="mt-auto p-6 border-t border-gray-100">
        <Button 
          className="w-full bg-gray-100 text-gray-700 rounded-full py-3"
          onClick={handleCancel}
        >
          取消生成
        </Button>
      </View>
    </View>
  )
}
