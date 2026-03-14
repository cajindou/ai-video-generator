/**
 * 本地存储工具
 * 封装 Taro.setStorage / Taro.getStorage / Taro.removeStorage
 */

import Taro from '@tarojs/taro'

export namespace Storage {
  /**
   * 设置存储
   */
  export const set = (key: string, value: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        Taro.setStorage({
          key,
          data: value,
          success: () => resolve(),
          fail: (err) => reject(err)
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * 获取存储
   */
  export const get = <T = any>(key: string, defaultValue?: T): Promise<T> => {
    return new Promise((resolve) => {
      try {
        Taro.getStorage({
          key,
          success: (res) => resolve(res.data as T),
          fail: () => resolve(defaultValue as T)
        })
      } catch (err) {
        resolve(defaultValue as T)
      }
    })
  }

  /**
   * 删除存储
   */
  export const remove = (key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        Taro.removeStorage({
          key,
          success: () => resolve(),
          fail: (err) => reject(err)
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * 清空存储
   */
  export const clear = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        Taro.clearStorage({
          success: () => resolve(),
          fail: (err) => reject(err)
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
   * 获取所有存储
   */
  export const getAll = (): Promise<Record<string, any>> => {
    return new Promise((resolve) => {
      try {
        Taro.getStorageInfo({
          success: (res) => {
            const keys = res.keys
            const result: Record<string, any> = {}
            
            Promise.all(
              keys.map(key => get(key))
            ).then((values) => {
              keys.forEach((key, index) => {
                result[key] = values[index]
              })
              resolve(result)
            })
          },
          fail: () => resolve({})
        })
      } catch (err) {
        resolve({})
      }
    })
  }
}
