import { View, Text, ScrollView } from '@tarojs/components'
import { ArrowLeft } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import './index.css'

/**
 * 隐私政策页面
 */
const PrivacyPolicyPage = () => {
  return (
    <View className="policy-page">
      {/* 顶部导航 */}
      <View className="policy-header">
        <View className="policy-back" onClick={() => Taro.navigateBack()}>
          <ArrowLeft size={24} color="#333" />
        </View>
        <Text className="policy-title">隐私政策</Text>
        <View className="policy-back" />
      </View>

      {/* 内容区 */}
      <ScrollView scrollY className="policy-content">
        <View className="policy-section">
          <Text className="policy-section-title">生效日期</Text>
          <Text className="policy-text">2025年1月1日</Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">引言</Text>
          <Text className="policy-text">
            欢迎使用宇轩百货小程序（以下简称&ldquo;本小程序&rdquo;）。我们深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。我们致力于维持您对我们的信任，恪守以下原则，保护您的个人信息：权责一致原则、目的明确原则、选择同意原则、最少够用原则、确保安全原则、主体参与原则、公开透明原则等。
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">一、我们如何收集和使用您的个人信息</Text>
          <Text className="policy-text">
            1. 图片信息：当您使用视频生成功能时，我们会收集您上传的店铺图片，用于智能技术分析和视频生成。
          </Text>
          <Text className="policy-text">
            2. 设备信息：我们会收集您的设备型号、操作系统版本、唯一设备标识符等信息，用于提供基础服务。
          </Text>
          <Text className="policy-text">
            3. 日志信息：当您使用本小程序时，我们会自动收集您的使用日志信息，包括操作记录、访问时间等。
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">二、信息的存储</Text>
          <Text className="policy-text">
            1. 存储地点：您的个人信息将存储于中华人民共和国境内。
          </Text>
          <Text className="policy-text">
            2. 存储期限：我们仅在实现目的所必需的最短时间内保留您的个人信息，除非法律法规要求更长的保留期限。
          </Text>
          <Text className="policy-text">
            3. 删除或匿名化：当您的个人信息达到存储期限或我们停止提供服务时，我们会删除或匿名化处理您的个人信息。
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">三、信息的安全</Text>
          <Text className="policy-text">
            我们会采取合理的安全措施来保护您的个人信息，包括但不限于：
          </Text>
          <Text className="policy-text">
            1. 数据加密技术
          </Text>
          <Text className="policy-text">
            2. 访问控制和权限管理
          </Text>
          <Text className="policy-text">
            3. 安全事件应急预案
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">四、您的权利</Text>
          <Text className="policy-text">
            在您使用本小程序期间，您可以：
          </Text>
          <Text className="policy-text">
            1. 访问、更新和管理您的个人信息
          </Text>
          <Text className="policy-text">
            2. 删除您的个人信息
          </Text>
          <Text className="policy-text">
            3. 撤回对个人信息处理的同意
          </Text>
          <Text className="policy-text">
            4. 注销账号
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">五、未成年人的个人信息保护</Text>
          <Text className="policy-text">
            我们非常重视对未成年人个人信息的保护。若您是未成年人，建议您请您的监护人仔细阅读本隐私政策，并在征得您的监护人同意的前提下使用我们的服务。
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">六、隐私政策的更新</Text>
          <Text className="policy-text">
            我们可能会适时更新本隐私政策。更新后的隐私政策将在本小程序中公布，不再另行通知。
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">七、联系我们</Text>
          <Text className="policy-text">
            如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式与我们联系：
          </Text>
          <Text className="policy-text">
            邮箱：452747345@qq.com
          </Text>
          <Text className="policy-text">
            客服微信：18009006222
          </Text>
        </View>

        <View className="policy-footer">
          <Text className="policy-footer-text">
            本小程序由宇轩百货运营
          </Text>
          <Text className="policy-footer-text">
            最后更新日期：2025年1月1日
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default PrivacyPolicyPage
