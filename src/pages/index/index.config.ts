export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '宇轩百货',
      backgroundColor: '#1a1a2e'
    })
  : {
      navigationBarTitleText: '宇轩百货',
      backgroundColor: '#1a1a2e'
    }
