// 导入 Vue 构造函数，这是 Vue 的核心实例
import Vue from './instance/index'
// 导入全局 API 初始化方法
import { initGlobalAPI } from './global-api/index'
// 导入服务器端渲染判断方法
import { isServerRendering } from 'core/util/env'
// 导入函数式组件渲染上下文
import { FunctionalRenderContext } from 'core/vdom/create-functional-component'
// 导入 Vue 版本号
import { version } from 'v3'

/**
 * 初始化 Vue 的全局 API
 */
initGlobalAPI(Vue)

/**
 * 在 Vue 原型上定义 $isServer 属性，用于判断当前是否在服务器端渲染
 */
Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

/**
 * 在 Vue 原型上定义 $ssrContext 属性，获取服务器端渲染上下文
 */
Object.defineProperty(Vue.prototype, '$ssrContext', {
  get() {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

/**
 * 暴露 FunctionalRenderContext 用于 SSR 运行时助手安装
 */
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
})

/**
 * 设置 Vue 的版本号
 */
Vue.version = version

/**
 * 导出 Vue 构造函数
 */
export default Vue
