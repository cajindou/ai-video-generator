export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '开通会员' })
  : { navigationBarTitleText: '开通会员' }
