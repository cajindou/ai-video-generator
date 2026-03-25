import { View, Text, Button, Image, ScrollView, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import Taro from '@tarojs/taro'
import { Send, Mic, Sparkles, User, Zap, Star, CirclePlay, Gift, Crown } from 'lucide-react-taro'
import './index.css'

/**
 * 客服页面 - 在线客服助手（真人销售专家风格）
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
      content: `哈喽～欢迎来到宇轩百货！👋

我是你的专属客服小宇，有什么想问的尽管说～`,
      time: getCurrentTime()
    }
    setMessages([welcomeMessage])
  }, [])

  // 滚动到底部
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
      // 降级：使用本地智能回复
      const aiResponse = generateSalesResponse(question)
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

  // 真人销售专家风格回复
  const generateSalesResponse = (userInput: string) => {
    const input = userInput.toLowerCase()
    
    // 视频生成相关
    if (input.includes('视频') || input.includes('生成') || input.includes('制作')) {
      const replies = [
        `做视频超简单的！上传几张照片，点一下生成就行～\n\n不过现在免费用户每天只能做3个哦，想多做的宝子可以考虑开个会员，无限次生成超爽的 😎`,
        `这个我熟！拍照→上传→生成，三步搞定～\n\n对了，你是想给什么产品做视频呀？如果是做探店的话，我建议多拍几张环境图，效果会更赞！\n\n💡 小提示：会员可以无限生成，而且视频清晰度更高哦～`,
        `视频生成大概15-20秒就搞定啦！\n\n不过提醒你一下，免费版每天有限额的。你如果是打算长期用的话，真的建议开个会员，不限次数，想怎么玩怎么玩，特别适合经常要做内容的宝子 ✨`
      ]
      return replies[Math.floor(Math.random() * replies.length)]
    }
    
    // 图片上传
    if (input.includes('图片') || input.includes('照片') || input.includes('上传')) {
      return `照片要求不高的～3-5张，清晰点就行。\n\n👉 建议第一张放人物照，后面放产品或环境\n👉 图片别太暗，光线好效果更佳\n\n对了，你准备给什么拍视频呀？可以跟我说说，我帮你参谋参谋 😊`
    }
    
    // 时间相关
    if (input.includes('时间') || input.includes('多久') || input.includes('快')) {
      return `差不多15-20秒就能出片，喝口水的时间就有了～\n\n是不是比想象中快？哈哈我们技术还是不错的。\n\n不过免费用户高峰期可能要排队哦，会员有专属通道，秒出片！你要不要试试？`
    }
    
    // 价格/收费/会员
    if (input.includes('价格') || input.includes('收费') || input.includes('会员') || input.includes('多少钱') || input.includes('免费') || input.includes('vip')) {
      return `来啦来啦！这个我要好好跟你说说～\n\n💰 现在有优惠活动：\n• 月卡会员原价99，限时59.9\n• 季卡159，平均每天才1块多\n• 年卡最划算，299包年\n\n🎁 会员特权：\n• 无限次生成视频\n• 专属高清画质\n• 优先客服支持\n• 不用排队秒出片\n\n说真的，你要是经常做内容，开个会员绝对值。算下来一天几毛钱，省去剪辑外包好几百呢！\n\n要不要我帮你看看哪个适合你？😊`
    }
    
    // 开通/购买
    if (input.includes('开通') || input.includes('购买') || input.includes('支付')) {
      return `太好啦！有眼光～\n\n你现在就可以点首页的「VIP会员」进去看看，支持微信支付，特别方便。\n\n个人建议：如果你是打算长期做探店内容的话，直接年卡最划算，折合每天不到1块钱，比请人剪辑便宜太多了！\n\n开通了随时来找我，有问题我帮你解决 💪`
    }
    
    // 问候
    if (input.includes('你好') || input.includes('在吗') || input.includes('hi') || input.includes('hello') || input.includes('哈')) {
      return `在的在的！👋\n\n有啥想问的直接说～你是想了解视频制作，还是想看看会员权益？我都给你讲明白 😊`
    }
    
    // 感谢
    if (input.includes('谢谢') || input.includes('感谢') || input.includes('好的')) {
      return `客气啥～有需要随时找我！\n\n对了，你是已经在用了还是准备试试？有任何问题我都在线哦 ✨`
    }
    
    // 效果/质量
    if (input.includes('效果') || input.includes('质量') || input.includes('好看')) {
      return `效果这块你放心！我们用的最新的AI技术，做出来的视频很有质感。\n\n你看那些探店达人用的都是这种风格～\n\n💡 小提示：会员版画质更高，而且可以自定义风格，做出专属你品牌的调性！要不要试试？`
    }
    
    // 问题/帮助
    if (input.includes('问题') || input.includes('帮助') || input.includes('怎么') || input.includes('如何')) {
      return `你说，啥问题？\n\n是使用上的问题，还是想了解会员？我给你解答 😊`
    }
    
    // 默认回复 - 引导到会员
    const defaultReplies = [
      `嗯嗯，我懂你的意思～\n\n其实不管你做什么内容，视频都是最好的展示方式。你现在一天能做几个视频呀？要是觉得不够用的话，可以看看我们的会员方案，特别适合经常做内容的宝子 ✨`,
      `收到～有什么想问的尽管说！\n\n对了，你是已经在用我们的视频生成功能了吗？感觉怎么样？\n\n如果用得顺手的话，真心建议开个会员，不限次数太爽了，想做几个做几个 🎬`,
      `明白了～\n\n我跟你说，做探店内容最重要的就是稳定产出。免费版每天3个可能有点紧张，会员的话就可以放开手脚做了。\n\n你要不要先试试？有问题随时来找我 😊`
    ]
    return defaultReplies[Math.floor(Math.random() * defaultReplies.length)]
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
    { icon: <CirclePlay size={18} color="#8B5CF6" />, text: '怎么做视频' },
    { icon: <Crown size={18} color="#F59E0B" />, text: '会员多少钱' },
    { icon: <Zap size={18} color="#8B5CF6" />, text: '要多久出片' },
    { icon: <Gift size={18} color="#8B5CF6" />, text: '有什么优惠' }
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
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoyu&backgroundColor=b6e3f4"
              mode="aspectFill"
              className="tech-avatar"
            />
            <View className="tech-avatar-online"></View>
          </View>
          <View className="tech-header-info">
            <Text className="tech-header-title">客服小宇</Text>
            <View className="flex items-center gap-1">
              <Sparkles size={12} color="#10B981" />
              <Text className="tech-header-status">在线 · 销售专家</Text>
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
          <Text className="tech-quick-title">💡 快速了解</Text>
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
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoyu&backgroundColor=b6e3f4"
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
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoyu&backgroundColor=b6e3f4"
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
            placeholder="输入消息..."
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
