export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '图片编辑',
      navigationStyle: 'custom'
    })
  : {
      navigationBarTitleText: '图片编辑',
      navigationStyle: 'custom'
    }
