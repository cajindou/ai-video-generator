export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '在线客服助手',
      backgroundColor: '#1a1a2e'
    })
  : {
      navigationBarTitleText: '在线客服助手',
      backgroundColor: '#1a1a2e'
    }
