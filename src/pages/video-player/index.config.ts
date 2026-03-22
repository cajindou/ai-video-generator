export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '视频预览',
      navigationBarBackgroundColor: '#000000',
      navigationBarTextStyle: 'white'
    })
  : {
      navigationBarTitleText: '视频预览',
      navigationBarBackgroundColor: '#000000',
      navigationBarTextStyle: 'white'
    }
