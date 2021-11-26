
export interface Goods {
      code: string,
      name: string,
      price: number,
      inventory: number,
      type: string,
}
export function sortGoodes (goodsList: Goods[]) {
  return goodsList.filter(n => n.inventory).sort((a, b) => a.price !== b.price ? b.price - a.price : b.inventory - a.inventory)
}
export function getSellGoods (price: number, goodsList: Goods[]) {
  const sellGoods = []
  const goodsList2 = JSON.parse(JSON.stringify(goodsList))
  for(let i = 0; i < goodsList2.length && price > 0; i++) {
    const goods = goodsList2[i]
    if (goods.price <= price && goods.inventory > 0) {
      goods.inventory--
      sellGoods.push(goods)
      price = price - goods.price
      i--
    }
  }
  return sellGoods
}