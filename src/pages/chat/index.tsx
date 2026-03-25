import { View, Text, Button, Image, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { Send, Mic, Sparkles, User, Zap, Star, CirclePlay, Gift, Info } from 'lucide-react-taro'
import './index.css'

/**
 * 客服页面 - 在线客服助手（科技风格）
 */
const ChatPage = () => {
  const [messages, setMessages] = useState<Array<{
    id: number
    type: 'user' | 'assistant'
    content: string
    time: string
  }>>([])
  
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [scrollIntoView, setScrollIntoView] = useState('')
  
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  // 初始化欢迎消息
  useEffect(() => {
    const welcomeMessage = {
      id: 0,
      type: 'assistant' as const,
      content: `🎉 嗨！我是在线客服，你的视频创作伙伴！

✨ 我能帮你：
• 快速生成专业探店视频
• 优化视频文案和效果
• 解答使用问题
• 提供创作灵感

💡 小提示：告诉我你的需求，我会帮你快速解决问题！`,
      time: getCurrentTime()
    }
    setMessages([welcomeMessage])
  }, [])

  // 滚动到底部（小程序不支持 scrollTo API，使用 scroll-into-view）
  useEffect(() => {
    if (messages.length > 0) {
      setScrollIntoView(`msg-${messages.length - 1}`)
    }
  }, [messages])

  // 获取当前时间
  const getCurrentTime = () => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputText.trim()) {
      return
    }

    const userMessage = {
      id: messages.length,
      type: 'user' as const,
      content: inputText,
      time: getCurrentTime()
    }

    setMessages(prev => [...prev, userMessage])
    const question = inputText
    setInputText('')
    setIsTyping(true)

    try {
      // 调用后端LLM接口
      const response = await Network.request({
        url: '/api/chat/message',
        method: 'POST',
        data: {
          message: question,
          conversationHistory: messages.map(m => ({
            role: m.type,
            content: m.content
          }))
        }
      })

      console.log('LLM响应:', response.data)

      if (response.data.code === 200 && response.data.data?.reply) {
        const assistantMessage = {
          id: messages.length + 1,
          type: 'assistant' as const,
          content: response.data.data.reply,
          time: getCurrentTime()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(response.data.msg || '获取回复失败')
      }
    } catch (err: any) {
      console.error('调用LLM失败', err)
      // 降级：使用本地回复
      const aiResponse = generate智能Response(question)
      const assistantMessage = {
        id: messages.length + 1,
        type: 'assistant' as const,
        content: aiResponse,
        time: getCurrentTime()
      }
      setMessages(prev => [...prev, assistantMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // 生成智能回复（模拟）
  const generate智能Response = (userInput: string) => {
    const lowerInput = userInput.toLowerCase()
    
    if (lowerInput.includes('视频') || lowerInput.includes('生成')) {
      return `🎬 关于视频生成，我来帮你解答！

**快速生成视频三步骤：**
1. 📸 上传3-5张照片（第一张放主播形象照）
2. ⚡ 点击"生成"按钮，智能技术自动制作
3. ✅ 等待约15秒，视频完成！

**💡 在线客服的独家建议：**
• 图片质量越高，视频效果越好
• 主播照片要正面、笑容灿烂
• 产品图片要清晰展示卖点

需要我帮你开始制作吗？💪`
    } else if (lowerInput.includes('图片') || lowerInput.includes('照片') || lowerInput.includes('上传')) {
      return `📸 关于图片上传，在线客服来告诉你：

**上传要求：**
✅ 图片数量：3-5张
✅ 图片格式：JPG、PNG
✅ 图片大小：每张不超过5MB

**📋 最佳拍摄顺序：**
1️⃣ 主播形象照（正面、微笑、光线充足）
2️⃣ 核心产品/环境展示图
3️⃣ 优惠信息或转化助推图

**⚠️ 注意事项：**
• 避免模糊或过暗的图片
• 保持图片风格统一
• 图片比例建议 3:4 或 1:1

还有什么疑问吗？😊`
    } else if (lowerInput.includes('时间') || lowerInput.includes('多久')) {
      return `⏱️ 关于生成时间，在线客服告诉你：

**视频生成时长：**
• 标准时长：约30秒以上
• 生成耗时：通常10-20秒
• 处理速度：智能极速渲染

**🚀 为什么这么快？**
• 采用最先进的智能技术
• 智能优化处理流程
• 服务器集群加速

**💡 在线客服的优化建议：**
• 选择网络较好的环境
• 避免高峰期操作
• 图片数量越少，生成越快

还有其他问题吗？🎯`
    } else if (lowerInput.includes('价格') || lowerInput.includes('收费') || lowerInput.includes('免费')) {
      return `💰 关于收费标准，在线客服来介绍：

**免费权益：**
✅ 每天3次免费视频生成
✅ 无限次查看教程
✅ 7天历史记录保存

功能完全免费使用，尽情体验！✨`
    } else if (lowerInput.includes('你好') || lowerInput.includes('在吗') || lowerInput.includes('hi') || lowerInput.includes('hello')) {
      return `👋 你好呀！我是在线客服，很高兴见到你！

我是你的智能视频创作伙伴，专门帮你解决所有视频生成相关的问题。

**现在你可以：**
• 🎬 问我如何制作视频
• 📸 了解图片上传要求
• ⏱️ 询问生成时间
• 💰 咨询收费标准
• 💡 获取创作灵感

有什么问题尽管问我，在线客服随时在线！💪✨`
    } else if (lowerInput.includes('谢谢') || lowerInput.includes('感谢')) {
      return `😊 不客气！能帮到你，在线客服很开心！

如果还有其他问题，随时来找我哦~

记住：
• 有问题随时问在线客服
• 创作灵感和我聊
• 用法技巧我教你

在线客服会一直陪伴你，让你的视频创作更轻松！🎉💕`
    } else {
      return `🤔 关于这个问题，在线客服来帮你！

从你的提问来看，你可能想了解相关的视频创作知识。让我为你提供一些通用的建议：

**📋 视频创作要点：**
1. **内容为王**：选择有吸引力的主题
2. **视觉冲击**：高质量图片是基础
3. **节奏把控**：30秒充分展示核心卖点
4. **文案精炼**：每句话都要有价值

**💡 在线客服的建议：**
• 先明确你的目标受众
• 突出产品和服务的优势
• 加入真实的体验感

能否具体告诉我，你想实现什么效果？我会给你更精准的建议！😊`
    }
  }

  // 开始录音
  const handleStartRecord = () => {
    if (!isWeapp) {
      Taro.showToast({ title: '仅小程序支持语音', icon: 'none' })
      return
    }

    const recorderManager = Taro.getRecorderManager()
    
    recorderManager.onStart(() => {
      setIsRecording(true)
      Taro.showToast({ title: '开始录音', icon: 'none' })
    })

    recorderManager.onStop((res) => {
      setIsRecording(false)
      console.log('录音结束', res.tempFilePath)
      Taro.showToast({ title: '录音成功', icon: 'success' })
      // TODO: 转换为文本并发送
    })

    recorderManager.start({
      format: 'mp3',
      sampleRate: 16000,
      numberOfChannels: 1
    })
  }

  // 停止录音
  const handleStopRecord = () => {
    const recorderManager = Taro.getRecorderManager()
    recorderManager.stop()
  }

  // 快捷问题
  const quickQuestions = [
    { icon: <CirclePlay size={20} color="#8B5CF6" />, text: '如何生成视频？' },
    { icon: <Info size={20} color="#8B5CF6" />, text: '图片上传要求' },
    { icon: <Zap size={20} color="#8B5CF6" />, text: '生成需要多久？' },
    { icon: <Gift size={20} color="#8B5CF6" />, text: '收费标准' }
  ]

  // 选择快捷问题
  const handleQuickQuestion = (question: string) => {
    setInputText(question)
  }

  return (
    <View className="tech-chat-page">
      {/* 科技感背景 */}
      <View className="tech-bg"></View>
      <View className="tech-particles"></View>

      {/* 顶部标题栏 */}
      <View className="tech-header">
        <View className="tech-header-left">
          <View className="tech-avatar-container">
            <Image
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoqi&backgroundColor=b6e3f4"
              mode="aspectFill"
              className="tech-avatar"
            />
            <View className="tech-avatar-online"></View>
          </View>
          <View className="tech-header-info">
            <Text className="tech-header-title">在线客服</Text>
            <View className="flex items-center gap-1">
              <Sparkles size={12} color="#10B981" />
              <Text className="tech-header-status">在线 · 顶级销冠</Text>
            </View>
          </View>
        </View>
        <View className="tech-header-right">
          <Star size={20} color="#F59E0B" />
          <Text className="tech-header-rating">4.9</Text>
        </View>
      </View>

      {/* 快捷问题区 */}
      {messages.length <= 1 && (
        <View className="tech-quick-questions">
          <Text className="tech-quick-title">💡 常见问题</Text>
          <View className="tech-quick-list">
            {quickQuestions.map((item, index) => (
              <View
                key={index}
                className="tech-quick-item"
                onClick={() => handleQuickQuestion(item.text)}
              >
                <View className="tech-quick-icon">{item.icon}</View>
                <Text className="tech-quick-text">{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 消息列表 */}
      <ScrollView
        scrollY
        className="tech-message-list"
        scrollIntoView={scrollIntoView}
        scrollWithAnimation
        style={{ paddingBottom: '20px' }}
      >
        {messages.map((message) => (
          <View key={message.id} id={`msg-${message.id}`} className={`tech-message-item ${message.type}`}>
            {/* 助手消息 */}
            {message.type === 'assistant' && (
              <View className="tech-message-wrapper tech-message-assistant">
                <Image
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoqi&backgroundColor=b6e3f4"
                  mode="aspectFill"
                  className="tech-message-avatar"
                />
                <View className="tech-message-content tech-message-assistant-content">
                  <Text className="tech-message-text">{message.content}</Text>
                  <Text className="tech-message-time">{message.time}</Text>
                </View>
              </View>
            )}

            {/* 用户消息 */}
            {message.type === 'user' && (
              <View className="tech-message-wrapper tech-message-user">
                <View className="tech-message-content tech-message-user-content">
                  <Text className="tech-message-text">{message.content}</Text>
                  <Text className="tech-message-time">{message.time}</Text>
                </View>
                <View className="tech-message-avatar tech-message-avatar-user">
                  <User size={20} color="#8B5CF6" />
                </View>
              </View>
            )}
          </View>
        ))}

        {/* 输入中提示 */}
        {isTyping && (
          <View className="tech-message-item assistant">
            <View className="tech-message-wrapper tech-message-assistant">
              <Image
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoqi&backgroundColor=b6e3f4"
                mode="aspectFill"
                className="tech-message-avatar"
              />
              <View className="tech-message-content tech-message-assistant-content">
                <View className="tech-typing-indicator">
                  <View className="tech-typing-dot"></View>
                  <View className="tech-typing-dot"></View>
                  <View className="tech-typing-dot"></View>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 底部输入栏 */}
      <View className="tech-input-bar">
        {isWeapp && (
          <Button
            onClick={isRecording ? handleStopRecord : handleStartRecord}
            className={`tech-icon-btn ${isRecording ? 'tech-btn-recording' : ''}`}
          >
            <Mic size={24} color={isRecording ? '#EF4444' : '#8B5CF6'} />
          </Button>
        )}

        <View className="tech-input-wrapper">
          <Input
            className="tech-input"
            placeholder="输入消息，或点击左侧图标..."
            placeholderClass="tech-input-placeholder"
            value={inputText}
            onInput={(e) => setInputText(e.detail.value)}
            confirmType="send"
            onConfirm={handleSendMessage}
          />
        </View>

        <Button
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
          className={`tech-send-btn ${inputText.trim() ? 'tech-btn-active' : 'tech-btn-disabled'}`}
        >
          <Send size={24} color={inputText.trim() ? '#fff' : 'rgba(255,255,255,0.3)'} />
        </Button>
      </View>

      {/* 底部安全区域 */}
      <View className="tech-safe-area" />
    </View>
  )
}

export default ChatPage
