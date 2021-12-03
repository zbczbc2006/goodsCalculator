import fs from 'fs'
import iconv from 'iconv-lite'
import Papa from 'papaparse'

export const enum GoodsTypes {
  None = '',
  Cigarette = 'cigarette',
  Normal = 'normal',
}

/**
 * 导入商品
 * @param {string} path
 * @param {GoodsTypes} type
 */
export function importGoods(path: string, type: GoodsTypes = GoodsTypes.None) {
  const fileStr = iconv.decode(fs.readFileSync(path), 'GB2312')
  const { data } = Papa.parse(fileStr, {
    header: true,
  }) as { data: any[] }
  const goods = {} as any
  data
    .filter((n: any) => n['商品条码'].trim() && +n['零售价'])
    .forEach((n: any) => {
      const code = n['商品条码'].trim()
      goods[code] = {
        code,
        name: n['商品名称'].trim(),
        price: +n['零售价'],
        inventory: +n['库存'],
        type,
      }
    })
  return goods
}
