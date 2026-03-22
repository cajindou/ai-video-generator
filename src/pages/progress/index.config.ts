export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '生成进度',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black'
    })
  : {
      navigationBarTitleText: '生成进度',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black'
    }
