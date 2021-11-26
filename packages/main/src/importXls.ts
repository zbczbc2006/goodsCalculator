import xlsx from 'node-xlsx'
import Store from 'electron-store'
import { merge } from 'lodash-es'

export const enum GoodsTypes {
  Cigarette = 'cigarette',
  Normal = 'normal'
}

const store = new Store()

/**
 * 更新商品
 * @param {string} path
 * @param {GoodsTypes} type
 */
export function updateGoods(path: string, type?: GoodsTypes) {
  const page = xlsx.parse(path)[0].data as string[][]
  const title = page.shift() as string[]
  const codeIndex = title.indexOf('条形码')
  const nameIndex = title.indexOf('商品名称')
  const priceIndex = title.indexOf('零售价')
  const inventoryIndex = title.indexOf('库存数')
  const goods = {} as any
  page.forEach(n => {
    const code = n[codeIndex]
    goods[code] = {
      code,
      name: n[nameIndex],
      price: +n[priceIndex],
      inventory: n[inventoryIndex],
      type,
    }
  })
  store.set('goods', merge(store.get('goods'), goods))
}