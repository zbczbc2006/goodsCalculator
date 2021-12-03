import { contextBridge, ipcRenderer } from 'electron'
import { merge } from 'lodash-es'
import Store from 'electron-store'
const store = new Store()
const apiKey = 'electron'
/**
 * @see https://github.com/electron/electron/issues/21437#issuecomment-573522360
 */
const api = {
  versions: process.versions,
} as const
const name = store.get('userName')
const goodsKey = `userMap.${name}.goods`
const configKey = `userMap.${name}.config`
/**
 * The "Main World" is the JavaScript context that your main renderer code runs in.
 * By default, the page you load in your renderer executes code in this world.
 *
 * @see https://www.electronjs.org/docs/api/context-bridge
 */
contextBridge.exposeInMainWorld(apiKey, api)
contextBridge.exposeInMainWorld('preloadApi', {
  getGoods() {
    return store.get(goodsKey)
  },
  setGoods(goods: any) {
    store.set(goodsKey, merge(store.get(goodsKey), goods))
  },
  getConfig() {
    return store.get(configKey)
  },
  setConfig(config: any) {
    store.set(configKey, merge(store.get(configKey), config))
  },
  getStore(label: string) {
    return store.get(label)
  },
  setStore(label: string, value: any) {
    return store.set(label, value)
  },
  deleteStore(label: string) {
    return store.delete(label)
  },
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data)
  },
  on: (channel: string, callback: (...args: any[]) => any) => {
    const newCallback = (_: any, ...args0: any[]) => callback(...args0)
    ipcRenderer.on(channel, newCallback)
  },
  once: (channel: string, callback: (...args: any[]) => any) => {
    const newCallback = (_: any, ...args0: any[]) => callback(...args0)
    ipcRenderer.once(channel, newCallback)
  },
  removeListener: (channel: string, callback: (...args: any[]) => any) => {
    ipcRenderer.removeListener(channel, callback)
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
})
