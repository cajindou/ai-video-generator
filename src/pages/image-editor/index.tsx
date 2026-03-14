import { View, Text, Button, Canvas, Slider } from '@tarojs/components'
import { useState, useEffect, useRef, useCallback } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Check, X, RotateCw, Crop, Sun, Contrast, Droplets, Sparkles } from 'lucide-react-taro'
import './index.css'

/**
 * 图片编辑页面 - 裁剪和滤镜
 */
const ImageEditor = () => {
  const router = useRouter()
  const imageUrl = router.params.imageUrl || ''
  const imageIndex = parseInt(router.params.imageIndex || '0', 10)
  
  // 状态管理
  const [imageInfo, setImageInfo] = useState({ width: 0, height: 0 })
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [mode, setMode] = useState<'filter' | 'crop'>('filter')
  
  // 裁剪相关
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 })
  
  const canvasRef = useRef<any>(null)

  // 加载图片信息
  useEffect(() => {
    if (!imageUrl) {
      Taro.showToast({ title: '图片参数错误', icon: 'none' })
      Taro.navigateBack()
      return
    }

    // 获取图片信息
    Taro.getImageInfo({
      src: imageUrl,
      success: (res) => {
        console.log('图片信息:', res)
        setImageInfo({ width: res.width, height: res.height })
        
        // 初始化裁剪区域（居中矩形）
        const cropSize = Math.min(res.width, res.height) * 0.8
        setCropRect({
          x: (res.width - cropSize) / 2,
          y: (res.height - cropSize) / 2,
          width: cropSize,
          height: cropSize
        })
      },
      fail: (err) => {
        console.error('获取图片信息失败', err)
        Taro.showToast({ title: '加载图片失败', icon: 'none' })
        Taro.navigateBack()
      }
    })
  }, [imageUrl])

  // 渲染Canvas
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current) return

    const query = Taro.createSelectorQuery()
    query.select('#editor-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          console.log('Canvas节点未就绪')
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        
        // 设置Canvas尺寸
        const dpr = Taro.getSystemInfoSync().pixelRatio
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)

        // 清空Canvas
        ctx.clearRect(0, 0, res[0].width, res[0].height)

        // 计算图片在Canvas中的显示尺寸（保持宽高比）
        const canvasWidth = res[0].width
        const canvasHeight = res[0].height
        const imageScale = Math.min(
          canvasWidth / imageInfo.width,
          canvasHeight / imageInfo.height
        )
        
        const displayWidth = imageInfo.width * imageScale
        const displayHeight = imageInfo.height * imageScale
        const offsetX = (canvasWidth - displayWidth) / 2
        const offsetY = (canvasHeight - displayHeight) / 2

        // 应用滤镜
        const image = canvas.createImage()
        image.src = imageUrl
        
        image.onload = () => {
          ctx.save()
          
          // 应用滤镜
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
          
          // 旋转
          if (rotation !== 0) {
            ctx.translate(canvasWidth / 2, canvasHeight / 2)
            ctx.rotate((rotation * Math.PI) / 180)
            ctx.translate(-canvasWidth / 2, -canvasHeight / 2)
          }
          
          // 绘制图片
          ctx.drawImage(
            image,
            offsetX,
            offsetY,
            displayWidth,
            displayHeight
          )
          
          ctx.restore()
          
          // 裁剪模式下绘制裁剪框
          if (mode === 'crop') {
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            ctx.strokeRect(
              offsetX + cropRect.x * imageScale,
              offsetY + cropRect.y * imageScale,
              cropRect.width * imageScale,
              cropRect.height * imageScale
            )
            
            // 绘制遮罩（裁剪框外半透明）
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
            // 上
            ctx.fillRect(offsetX, offsetY, displayWidth, cropRect.y * imageScale)
            // 下
            ctx.fillRect(
              offsetX,
              offsetY + (cropRect.y + cropRect.height) * imageScale,
              displayWidth,
              displayHeight - (cropRect.y + cropRect.height) * imageScale
            )
            // 左
            ctx.fillRect(
              offsetX,
              offsetY + cropRect.y * imageScale,
              cropRect.x * imageScale,
              cropRect.height * imageScale
            )
            // 右
            ctx.fillRect(
              offsetX + (cropRect.x + cropRect.width) * imageScale,
              offsetY + cropRect.y * imageScale,
              displayWidth - (cropRect.x + cropRect.width) * imageScale,
              cropRect.height * imageScale
            )
          }
        }
      })
  }, [brightness, contrast, saturation, rotation, mode, cropRect, imageInfo, imageUrl])

  // 监听滤镜变化重新渲染
  useEffect(() => {
    const timer = setTimeout(() => {
      renderCanvas()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [brightness, contrast, saturation, rotation, mode, cropRect, imageInfo, renderCanvas])

  // 重置滤镜
  const handleResetFilters = () => {
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setRotation(0)
    Taro.vibrateShort({ type: 'light' })
  }

  // 旋转图片
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
    Taro.vibrateShort({ type: 'light' })
  }

  // 保存编辑
  const handleSave = () => {
    Taro.showLoading({ title: '保存中...' })
    
    const query = Taro.createSelectorQuery()
    query.select('#editor-canvas')
      .fields({ node: true, size: true })
      .exec((queryRes) => {
        if (!queryRes || !queryRes[0] || !queryRes[0].node) return

        const canvas = queryRes[0].node
        
        // 导出Canvas为图片
        Taro.canvasToTempFilePath({
          canvas: canvas,
          fileType: 'jpg',
          quality: 0.9,
          success: (saveRes) => {
            console.log('保存成功:', saveRes.tempFilePath)
            
            // 返回上一页并传递编辑后的图片
            const pages = Taro.getCurrentPages()
            const prevPage = pages[pages.length - 2]
            if (prevPage) {
              prevPage.setData?.({
                editedImageUrl: saveRes.tempFilePath,
                editedImageIndex: imageIndex
              })
            }
            
            Taro.hideLoading()
            Taro.navigateBack()
            Taro.showToast({ title: '保存成功', icon: 'success' })
          },
          fail: (err) => {
            console.error('保存失败', err)
            Taro.hideLoading()
            Taro.showToast({ title: '保存失败', icon: 'none' })
          }
        })
      })
  }

  // 取消编辑
  const handleCancel = () => {
    Taro.showModal({
      title: '确认取消',
      content: '未保存的编辑将丢失，确定要退出吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateBack()
        }
      }
    })
  }

  return (
    <View className="image-editor-page">
      {/* 顶部导航栏 */}
      <View className="editor-header">
        <Button onClick={handleCancel} className="editor-header-btn">
          <X size={24} color="#fff" />
        </Button>
        <Text className="editor-header-title">
          {mode === 'filter' ? '滤镜编辑' : '裁剪编辑'}
        </Text>
        <View className="editor-mode-switch">
          <Button
            onClick={() => setMode('filter')}
            className={`editor-mode-btn ${mode === 'filter' ? 'editor-mode-active' : ''}`}
          >
            <Sparkles size={20} color={mode === 'filter' ? '#8B5CF6' : '#666'} />
          </Button>
          <Button
            onClick={() => setMode('crop')}
            className={`editor-mode-btn ${mode === 'crop' ? 'editor-mode-active' : ''}`}
          >
            <Crop size={20} color={mode === 'crop' ? '#8B5CF6' : '#666'} />
          </Button>
        </View>
      </View>

      {/* Canvas 编辑区域 */}
      <View className="editor-canvas-container">
        <Canvas
          id="editor-canvas"
          type="2d"
          className="editor-canvas"
          ref={canvasRef}
        ></Canvas>
      </View>

      {/* 滤镜调节面板 */}
      {mode === 'filter' && (
        <View className="editor-filter-panel">
          <View className="filter-row">
            <View className="filter-label">
              <Sun size={16} color="#8B5CF6" />
              <Text className="filter-label-text">亮度</Text>
            </View>
            <Slider
              value={brightness}
              min={0}
              max={200}
              step={1}
              showValue
              activeColor="#8B5CF6"
              backgroundColor="rgba(139, 92, 246, 0.2)"
              onChange={(e) => setBrightness(e.detail.value)}
              className="filter-slider"
            />
          </View>
          
          <View className="filter-row">
            <View className="filter-label">
              <Contrast size={16} color="#8B5CF6" />
              <Text className="filter-label-text">对比度</Text>
            </View>
            <Slider
              value={contrast}
              min={0}
              max={200}
              step={1}
              showValue
              activeColor="#8B5CF6"
              backgroundColor="rgba(139, 92, 246, 0.2)"
              onChange={(e) => setContrast(e.detail.value)}
              className="filter-slider"
            />
          </View>
          
          <View className="filter-row">
            <View className="filter-label">
              <Droplets size={16} color="#8B5CF6" />
              <Text className="filter-label-text">饱和度</Text>
            </View>
            <Slider
              value={saturation}
              min={0}
              max={200}
              step={1}
              showValue
              activeColor="#8B5CF6"
              backgroundColor="rgba(139, 92, 246, 0.2)"
              onChange={(e) => setSaturation(e.detail.value)}
              className="filter-slider"
            />
          </View>
        </View>
      )}

      {/* 裁剪调节面板 */}
      {mode === 'crop' && (
        <View className="editor-crop-panel">
          <View className="crop-info">
            <Text className="crop-info-text">裁剪区域尺寸</Text>
            <Text className="crop-info-value">
              {Math.round(cropRect.width)} × {Math.round(cropRect.height)}
            </Text>
          </View>
        </View>
      )}

      {/* 底部操作栏 */}
      <View className="editor-footer">
        <Button onClick={handleRotate} className="editor-tool-btn">
          <RotateCw size={20} color="#fff" />
          <Text className="editor-tool-text">旋转</Text>
        </Button>
        
        <Button onClick={handleResetFilters} className="editor-tool-btn">
          <X size={20} color="#fff" />
          <Text className="editor-tool-text">重置</Text>
        </Button>
        
        <Button onClick={handleSave} className="editor-save-btn">
          <Check size={20} color="#fff" />
          <Text className="editor-save-text">保存</Text>
        </Button>
      </View>
    </View>
  )
}

export default ImageEditor
