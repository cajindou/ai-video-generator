export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '发现',
      backgroundColor: '#1a1a2e'
    })
  : {
      navigationBarTitleText: '发现',
      backgroundColor: '#1a1a2e'
    }
