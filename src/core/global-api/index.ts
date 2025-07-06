/**
 * Vue 全局 API 初始化文件
 * 负责初始化 Vue 的全局 API 和方法
 */

// 导入 Vue 配置对象
import config from '../config'
// 导入全局 use 方法初始化函数
import { initUse } from './use'
// 导入全局 mixin 方法初始化函数
import { initMixin } from './mixin'
// 导入全局 extend 方法初始化函数
import { initExtend } from './extend'
// 导入全局资源注册方法初始化函数
import { initAssetRegisters } from './assets'
// 导入响应式系统的 set 和 del 方法
import { set, del } from '../observer/index'
// 导入 nextTick 方法
import { nextTick } from '../util/next-tick'
/**
 * 导入资源类型常量 (component/directive/filter)
 */
import { ASSET_TYPES } from 'shared/constants'
/**
 * 导入内置组件 (如 keep-alive, transition 等)
 */
import builtInComponents from '../components/index'
/**
 * 导入响应式观察方法
 */
import { observe } from 'core/observer/index'

/**
 * 导入工具方法
 */
import {
  warn,       // 警告方法
  extend,     // 对象扩展方法
  nextTick,   // 异步更新方法
  mergeOptions, // 选项合并方法
  defineReactive // 定义响应式属性方法
} from '../util/index'
/**
 * 导入全局 API 类型定义
 */
import type { GlobalAPI } from 'types/global-api'

/**
 * 初始化 Vue 全局 API
 * @param Vue - Vue 构造函数
 */
export function initGlobalAPI(Vue: GlobalAPI) {
  /**
   * 配置 Vue.config 对象
   * 使用 getter 方式访问配置，开发环境下禁止直接替换整个 config 对象
   */
  const configDef: Record<string, any> = {}
  configDef.get = () => config
  if (__DEV__) {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  /**
   * 暴露内部工具方法
   * 注意：这些方法不是公共 API 的一部分，可能会发生变化
   */
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  /**
   * 全局响应式 set 方法
   */
  Vue.set = set
  /**
   * 全局响应式 delete 方法
   */
  Vue.delete = del
  /**
   * 全局 nextTick 方法
   */
  Vue.nextTick = nextTick

  /**
   * 2.6 版本引入的显式响应式 API
   * 使一个对象可响应
   */
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }

  /**
   * 初始化 Vue.options 对象
   * 用于存储全局组件、指令和过滤器
   */
  Vue.options = Object.create(null)
  /**
   * 为每种资源类型创建命名空间
   */
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  /**
   * 设置基础构造函数
   * 用于 Weex 多实例场景中扩展组件
   */
  Vue.options._base = Vue

  /**
   * 将内置组件扩展到全局组件选项中
   */
  extend(Vue.options.components, builtInComponents)

  // 初始化各全局 API
  initUse(Vue)      // 初始化 Vue.use()
  initMixin(Vue)    // 初始化 Vue.mixin()
  initExtend(Vue)   // 初始化 Vue.extend()
  initAssetRegisters(Vue) // 初始化组件/指令/过滤器注册方法
}
