// 导入相关模块和类型
import type Watcher from './watcher'
import config from '../config'
import Dep, { cleanupDeps } from './dep'
import { callHook, activateChildComponent } from '../instance/lifecycle'

// 导入工具函数
import { warn, nextTick, devtools, inBrowser, isIE } from '../util/index'
import type { Component } from 'types/component'

// 最大更新次数限制，防止无限循环
export const MAX_UPDATE_COUNT = 100

// 观察者队列
const queue: Array<Watcher> = []
// 激活的子组件队列
const activatedChildren: Array<Component> = []
// 用于检查重复观察者的哈希表
let has: { [key: number]: true | undefined | null } = {}
// 用于开发环境下检查循环更新的计数器
let circular: { [key: number]: number } = {}
// 标记是否正在等待刷新队列
let waiting = false
// 标记是否正在刷新队列
let flushing = false
// 当前正在处理的观察者索引
let index = 0

/**
 * 重置调度器状态
 */
function resetSchedulerState() {
  index = queue.length = activatedChildren.length = 0
  has = {}
  if (__DEV__) {
    circular = {}
  }
  waiting = flushing = false
}

// 当前刷新时间戳，用于事件监听器时间戳
export let currentFlushTimestamp = 0

// 获取当前时间的函数，默认为Date.now
let getNow: () => number = Date.now

// 在非IE浏览器中，如果支持performance.now，则使用更高精度的时间戳
if (inBrowser && !isIE) {
  const performance = window.performance
  if (
    performance &&
    typeof performance.now === 'function' &&
    getNow() > document.createEvent('Event').timeStamp
  ) {
    getNow = () => performance.now()
  }
}

// 观察者排序比较函数
const sortCompareFn = (a: Watcher, b: Watcher): number => {
  // post watchers排在最后
  if (a.post) {
    if (!b.post) return 1
  } else if (b.post) {
    return -1
  }
  // 按id升序排列
  return a.id - b.id
}

/**
 * 刷新队列并执行观察者
 */
function flushSchedulerQueue() {
  currentFlushTimestamp = getNow()
  flushing = true
  let watcher, id

  // 刷新前对队列排序
  queue.sort(sortCompareFn)

  // 遍历队列执行观察者
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    // 执行before钩子
    if (watcher.before) {
      watcher.before()
    }
    id = watcher.id
    has[id] = null
    // 执行观察者
    watcher.run()
    // 开发环境下检查循环更新
    if (__DEV__ && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' +
            (watcher.user
              ? `in watcher with expression "${watcher.expression}"`
              : `in a component render function.`),
          watcher.vm
        )
        break
      }
    }
  }

  // 重置状态前保存队列副本
  const activatedQueue = activatedChildren.slice()
  const updatedQueue = queue.slice()

  resetSchedulerState()

  // 调用组件生命周期钩子
  callActivatedHooks(activatedQueue)
  callUpdatedHooks(updatedQueue)
  cleanupDeps()

  // 开发工具钩子
  if (devtools && config.devtools) {
    devtools.emit('flush')
  }
}

// 调用updated钩子
function callUpdatedHooks(queue: Watcher[]) {
  let i = queue.length
  while (i--) {
    const watcher = queue[i]
    const vm = watcher.vm
    if (vm && vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated')
    }
  }
}

/**
 * 将激活的keep-alive组件加入队列
 */
export function queueActivatedComponent(vm: Component) {
  vm._inactive = false
  activatedChildren.push(vm)
}

// 调用activated钩子
function callActivatedHooks(queue) {
  for (let i = 0; i < queue.length; i++) {
    queue[i]._inactive = true
    activateChildComponent(queue[i], true)
  }
}

/**
 * 将观察者加入队列
 */
export function queueWatcher(watcher: Watcher) {
  const id = watcher.id
  // 跳过重复观察者
  if (has[id] != null) {
    return
  }

  // 跳过无递归的当前观察者
  if (watcher === Dep.target && watcher.noRecurse) {
    return
  }

  has[id] = true
  // 根据是否正在刷新决定插入位置
  if (!flushing) {
    queue.push(watcher)
  } else {
    let i = queue.length - 1
    while (i > index && queue[i].id > watcher.id) {
      i--
    }
    queue.splice(i + 1, 0, watcher)
  }
  // 触发队列刷新
  if (!waiting) {
    waiting = true
    // 开发环境下同步刷新
    if (__DEV__ && !config.async) {
      flushSchedulerQueue()
      return
    }
    // 异步刷新
    nextTick(flushSchedulerQueue)
  }
}
