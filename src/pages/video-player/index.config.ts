export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '视频播放',
      backgroundColor: '#000000',
      navigationStyle: 'custom'
    })
  : {
      navigationBarTitleText: '视频播放',
      backgroundColor: '#000000',
      navigationStyle: 'custom'
    }
