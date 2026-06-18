//全局事件监听

import { defineStore } from 'pinia';

interface Listener<T> {
  (payload?: T): void;
}

interface ListenerWithSource<T> {
  listener: Listener<T>;
  source?: unknown; // 用来存储组件实例或其他唯一标识符
}

interface ListenersMap {
  [eventName: string]: ListenerWithSource<any>[];
}

export const eventBusStore = defineStore({
  id: 'eventBus',
  state: (): { listeners: ListenersMap } => ({
    listeners: {},
  }),
  actions: {
    // 订阅事件
    $on<T>(eventName: string, callback: Listener<T>, source?: unknown) {
      if (!this.listeners[eventName]) {
        this.listeners[eventName] = [];
      }

      // 检查是否已经有相同的监听器存在
      let existingListenerIndex = this.listeners[eventName].findIndex(
        ({ source: cbSource }) => cbSource === source
      );

      if (existingListenerIndex === -1) {
        // 如果没有找到相同的监听器，则添加新的监听器
        this.listeners[eventName].push({ listener: callback, source });
      } else {
        // 否则更新已有的监听器
        this.listeners[eventName][existingListenerIndex] = {
          listener: callback,
          source,
        };
      }
    },

    // 发布事件
    $emit<T>(eventName: string, payload?: T) {
      const callbacks = this.listeners[eventName];
      if (callbacks) {
        callbacks.forEach(({ listener }) => listener(payload));
      }
    },

    // 移除事件监听器
    $off<T>(eventName: string, source?: unknown) {
      const callbacks = this.listeners[eventName];
      if (callbacks) {
        this.listeners[eventName] = callbacks.filter(
          ({ source: cbSource }) => cbSource !== source
        );
      }
    },

    // 清空所有事件监听器
    $clear() {
      this.listeners = {};
    },

    // 移除指定源的所有监听器
    $clearBySource(source?: unknown) {
      Object.keys(this.listeners).forEach(eventName => {
        this.$off(eventName, source);
      });
    },
  },
});