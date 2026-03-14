export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '隐私政策' })
  : { navigationBarTitleText: '隐私政策' }
