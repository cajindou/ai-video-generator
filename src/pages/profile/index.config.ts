export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '我的',
      backgroundColor: '#1a1a2e'
    })
  : {
      navigationBarTitleText: '我的',
      backgroundColor: '#1a1a2e'
    }
