// 导入工具函数和类型定义
import { isRegExp, isArray, remove } from 'shared/util'
import { getFirstComponentChild } from 'core/vdom/helpers/index'
import type VNode from 'core/vdom/vnode'
import type { VNodeComponentOptions } from 'types/vnode'
import type { Component } from 'types/component'
import { getComponentName } from '../vdom/create-component'

// 缓存条目类型定义，用于存储keep-alive缓存的组件实例
type CacheEntry = {
  name?: string // 组件名称
  tag?: string // 组件标签
  componentInstance?: Component // 组件实例
}

// 缓存映射表类型
type CacheEntryMap = Record<string, CacheEntry | null>

// 获取组件名称的辅助函数
function _getComponentName(opts?: VNodeComponentOptions): string | null {
  return opts && (getComponentName(opts.Ctor.options as any) || opts.tag)
}

// 检查组件名称是否匹配给定的模式
function matches(
  pattern: string | RegExp | Array<string>,
  name: string
): boolean {
  if (isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

// 清理不符合条件的缓存
function pruneCache(
  keepAliveInstance: {
    cache: CacheEntryMap
    keys: string[]
    _vnode: VNode
    $vnode: VNode
  },
  filter: Function
) {
  const { cache, keys, _vnode, $vnode } = keepAliveInstance
  for (const key in cache) {
    const entry = cache[key]
    if (entry) {
      const name = entry.name
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode)
      }
    }
  }
  $vnode.componentOptions!.children = undefined
}

// 清理单个缓存条目
function pruneCacheEntry(
  cache: CacheEntryMap,
  key: string,
  keys: Array<string>,
  current?: VNode
) {
  const entry = cache[key]
  if (entry && (!current || entry.tag !== current.tag)) {
    // @ts-expect-error can be undefined
    entry.componentInstance.$destroy()
  }
  cache[key] = null
  remove(keys, key)
}

// 支持的prop类型
const patternTypes: Array<Function> = [String, RegExp, Array]

// keep-alive组件定义
export default {
  name: 'keep-alive',
  abstract: true, // 抽象组件

  props: {
    include: patternTypes, // 包含的组件
    exclude: patternTypes, // 排除的组件
    max: [String, Number] // 最大缓存数量
  },

  methods: {
    // 缓存虚拟节点
    cacheVNode() {
      const { cache, keys, vnodeToCache, keyToCache } = this
      if (vnodeToCache) {
        const { tag, componentInstance, componentOptions } = vnodeToCache
        cache[keyToCache] = {
          name: _getComponentName(componentOptions),
          tag,
          componentInstance
        }
        keys.push(keyToCache)
        // 如果超过最大缓存数量，清理最旧的缓存
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
        this.vnodeToCache = null
      }
    }
  },

  // 组件生命周期钩子
  created() {
    this.cache = Object.create(null) // 初始化缓存
    this.keys = [] // 初始化缓存键
  },
  // 组件销毁钩子
  destroyed() {
    // 组件销毁时清理所有缓存
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },
  // 组件挂载钩子
  mounted() {
    this.cacheVNode()
    // 监听 include 变化，动态更新缓存
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })
    // 监听 exclude 变化，动态更新缓存
    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },
  // 更新钩子，在组件更新时调用
  updated() {
    this.cacheVNode()
  },

  // 渲染函数
  render() {
    const slot = this.$slots.default
    const vnode = getFirstComponentChild(slot)
    const componentOptions = vnode && vnode.componentOptions
    if (componentOptions) {
      // 检查组件是否符合缓存条件
      const name = _getComponentName(componentOptions)
      const { include, exclude } = this
      if (
        // 不在包含列表中
        (include && (!name || !matches(include, name))) ||
        // 在排除列表中
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      const { cache, keys } = this
      const key =
        vnode.key == null
          ? // 相同构造函数可能注册为不同的本地组件
            // 所以仅cid不够 (#3269)
            componentOptions.Ctor.cid +
            (componentOptions.tag ? `::${componentOptions.tag}` : '')
          : vnode.key
      if (cache[key]) {
        // 命中缓存
        vnode.componentInstance = cache[key].componentInstance
        // 将当前key移到最新位置
        remove(keys, key)
        keys.push(key)
      } else {
        // 延迟设置缓存直到更新
        this.vnodeToCache = vnode
        this.keyToCache = key
      }

      // @ts-expect-error can vnode.data can be undefined
      vnode.data.keepAlive = true
    }
    return vnode || (slot && slot[0])
  }
}
