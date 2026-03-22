export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '用户协议' })
  : { navigationBarTitleText: '用户协议' }
