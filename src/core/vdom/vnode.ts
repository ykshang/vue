import type { Component } from 'types/component'
import type { ComponentOptions } from 'types/options'
import type { VNodeComponentOptions, VNodeData } from 'types/vnode'

/**
 * Virtual DOM节点类，表示Vue中的虚拟节点
 * @internal
 */
export default class VNode {
  tag?: string // 节点标签名
  data: VNodeData | undefined // 节点数据，包含属性、事件等
  children?: Array<VNode> | null // 子节点数组
  text?: string // 文本内容
  elm: Node | undefined // 对应的真实DOM节点
  ns?: string // 命名空间
  context?: Component // 所属的Vue组件实例
  key: string | number | undefined // 节点的key，用于diff算法优化
  componentOptions?: VNodeComponentOptions // 组件选项
  componentInstance?: Component // 组件实例
  parent: VNode | undefined | null // 父节点

  // 以下为内部属性
  raw: boolean // 是否包含原始HTML(仅服务端渲染使用)
  isStatic: boolean // 是否是静态节点
  isRootInsert: boolean // 是否是根插入节点，用于过渡动画检查
  isComment: boolean // 是否是注释节点
  isCloned: boolean // 是否是克隆节点
  isOnce: boolean // 是否是v-once节点
  asyncFactory?: Function // 异步组件工厂函数
  asyncMeta: Object | void // 异步组件元数据
  isAsyncPlaceholder: boolean // 是否是异步组件占位符
  ssrContext?: Object | void // 服务端渲染上下文
  fnContext: Component | void // 函数式组件的上下文
  fnOptions?: ComponentOptions | null // 用于SSR缓存
  fnScopeId?: string | null // 函数式组件的作用域ID
  devtoolsMeta?: Object | null // 用于devtools调试
  isComponentRootElement?: boolean | null // 是否是组件根元素(用于SSR指令)

  constructor(
    tag?: string,
    data?: VNodeData,
    children?: Array<VNode> | null,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.ns = undefined
    this.context = context
    this.fnContext = undefined
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.key = data && data.key
    this.componentOptions = componentOptions
    this.componentInstance = undefined
    this.parent = undefined
    this.raw = false
    this.isStatic = false
    this.isRootInsert = true
    this.isComment = false
    this.isCloned = false
    this.isOnce = false
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  /**
   * @deprecated 已废弃，请使用componentInstance替代
   * 获取组件实例(向后兼容)
   */
  /* istanbul ignore next */
  get child(): Component | void {
    return this.componentInstance
  }
}

/**
 * 创建空注释节点
 * @param text 注释文本内容
 * @returns 空注释VNode
 */
export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}

/**
 * 创建文本节点
 * @param val 文本内容
 * @returns 文本VNode
 */
export function createTextVNode(val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val))
}

/**
 * 克隆VNode(浅拷贝)
 * 用于静态节点和插槽节点，因为它们可能在多次渲染中被重用
 * 克隆它们可以避免DOM操作依赖elm引用时出错
 * @param vnode 要克隆的VNode
 * @returns 克隆后的新VNode
 */
export function cloneVNode(vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    // #7975
    // clone children array to avoid mutating original in case of cloning
    // a child.
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  )
  cloned.ns = vnode.ns
  cloned.isStatic = vnode.isStatic
  cloned.key = vnode.key
  cloned.isComment = vnode.isComment
  cloned.fnContext = vnode.fnContext
  cloned.fnOptions = vnode.fnOptions
  cloned.fnScopeId = vnode.fnScopeId
  cloned.asyncMeta = vnode.asyncMeta
  cloned.isCloned = true
  return cloned
}
