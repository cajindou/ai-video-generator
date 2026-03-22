import { View, Text, ScrollView } from '@tarojs/components'
import { ArrowLeft } from 'lucide-react-taro'
import Taro from '@tarojs/taro'
import './index.css'

/**
 * 用户协议页面
 */
const UserAgreementPage = () => {
  return (
    <View className="policy-page">
      {/* 顶部导航 */}
      <View className="policy-header">
        <View className="policy-back" onClick={() => Taro.navigateBack()}>
          <ArrowLeft size={24} color="#333" />
        </View>
        <Text className="policy-title">用户协议</Text>
        <View className="policy-back" />
      </View>

      {/* 内容区 */}
      <ScrollView scrollY className="policy-content">
        <View className="policy-section">
          <Text className="policy-section-title">生效日期</Text>
          <Text className="policy-text">2025年1月1日</Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">一、总则</Text>
          <Text className="policy-text">
            1.1 本协议是您（以下简称&ldquo;用户&rdquo;）与宇轩百货小程序（以下简称&ldquo;本小程序&rdquo;）之间就使用本小程序服务所订立的协议。
          </Text>
          <Text className="policy-text">
            1.2 您在使用本小程序服务之前，应当仔细阅读本协议。如您不同意本协议的任何内容，请勿使用本小程序服务。
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">二、服务说明</Text>
          <Text className="policy-text">
            2.1 本小程序提供视频生成服务，用户可以上传店铺图片，由智能技术自动分析并生成探店视频。
          </Text>
          <Text className="policy-text">
            2.2 本小程序服务仅限个人非商业用途使用。
          </Text>
          <Text className="policy-text">
            2.3 用户应自行承担使用本小程序服务所产生的流量费用等网络费用。
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">三、用户账号</Text>
          <Text className="policy-text">
            3.1 用户应妥善保管自己的账号信息，对账号下的所有活动承担责任。
          </Text>
          <Text className="policy-text">
            3.2 如发现账号被非法使用，应立即通知本小程序。
          </Text>
          <Text className="policy-text">
            3.3 用户不得将账号转让、出借或与他人共享。
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">四、用户行为规范</Text>
          <Text className="policy-text">
            4.1 用户在使用本小程序服务时，必须遵守相关法律法规，不得利用本小程序服务从事违法违规活动。
          </Text>
          <Text className="policy-text">
            4.2 禁止上传以下内容：
          </Text>
          <Text className="policy-text">
            • 违反法律法规的内容
          </Text>
          <Text className="policy-text">
            • 涉及色情、暴力、恐怖的内容
          </Text>
          <Text className="policy-text">
            • 侵犯他人隐私、知识产权的内容
          </Text>
          <Text className="policy-text">
            • 虚假、欺诈性内容
          </Text>
          <Text className="policy-text">
            • 其他违反公序良俗的内容
          </Text>
          <Text className="policy-text">
            4.3 用户应对其上传内容的真实性、合法性负责。
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">五、知识产权</Text>
          <Text className="policy-text">
            5.1 本小程序的所有内容，包括但不限于文字、图片、视频、软件、程序、版面设计等，均受法律保护。
          </Text>
          <Text className="policy-text">
            5.2 用户使用本小程序服务生成的视频，其知识产权归用户所有，但本小程序享有在宣传推广等商业用途中使用该视频的权利。
          </Text>
          <Text className="policy-text">
            5.3 用户上传的图片，应确保不侵犯他人的知识产权。
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">六、免责声明</Text>
          <Text className="policy-text">
            6.1 本小程序不对用户上传内容的准确性、合法性承担责任。
          </Text>
          <Text className="policy-text">
            6.2 因不可抗力导致的服务中断或延迟，本小程序不承担责任。
          </Text>
          <Text className="policy-text">
            6.3 用户因使用本小程序服务而产生的任何损失，本小程序不承担责任，除非法律法规另有规定。
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">七、协议变更</Text>
          <Text className="policy-text">
            7.1 本小程序有权根据需要修改本协议。
          </Text>
          <Text className="policy-text">
            7.2 协议变更后，本小程序将通过适当方式通知用户。
          </Text>
          <Text className="policy-text">
            7.3 如用户不同意变更后的协议，可停止使用本小程序服务。
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">八、争议解决</Text>
          <Text className="policy-text">
            8.1 因本协议引起的任何争议，双方应友好协商解决。
          </Text>
          <Text className="policy-text">
            8.2 协商不成的，任何一方均可向本小程序所在地人民法院提起诉讼。
          </Text>
        </View>

        <View className="policy-section">
          <Text className="policy-section-title">九、其他</Text>
          <Text className="policy-text">
            9.1 本协议的解释权归本小程序所有。
          </Text>
          <Text className="policy-text">
            9.2 本协议自用户开始使用本小程序服务时生效。
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

export default UserAgreementPage
