<template>
  <NDrawer
    v-model:show="showCfg"
    placement="top"
    height="auto"
    :mask-closable="false"
  >
    <NDrawerContent title="设置项">
      <div class="cfg-item">
        <span class="item-label">商品码输入框坐标</span>
        <span class="item-value">
          <NInputGroup>
            <NInputNumber v-model:value="config.codeInput.x" placeholder="x" :min="0" />
            <NInputNumber v-model:value="config.codeInput.y" placeholder="y" :min="0" />
          </NInputGroup>
        </span>
      </div>
      <div class="cfg-item">
        <span class="item-label">支付宝按钮坐标</span>
        <span class="item-value">
          <NInputGroup>
            <NInputNumber v-model:value="config.alipayBtn.x" placeholder="x" :min="0" />
            <NInputNumber v-model:value="config.alipayBtn.y" placeholder="y" :min="0" />
          </NInputGroup>
        </span>
      </div>
      <div class="cfg-item">
        <span class="item-label">自动扣减库存</span>
        <span class="item-value">
          <NSwitch v-model:value="config.autoInventory" />
        </span>
      </div>
      <div v-if="!config.autoInventory" class="cfg-item">
        <span class="item-label">提示扣减库存</span>
        <span class="item-value">
          <NSwitch v-model:value="config.hintInventory" />
        </span>
      </div>
      <div class="cfg-item">
        <span class="item-label">显示低价商品列表</span>
        <span class="item-value">
          <NSwitch v-model:value="config.showList" />
        </span>
      </div>
      <div v-if="config.showList" class="cfg-item">
        <span class="item-label">低价价格阈值</span>
        <span class="item-value">
          <NInputNumber v-model:value="config.priceLimit" :min="1">
            <template #prefix>￥</template>
          </NInputNumber>
        </span>
      </div>
      <div class="operate">
        <NButton class="operate-btn" type="primary" @click="onConfigSure">确定</NButton>
        <NButton class="operate-btn" @click="onConfigCancel">取消</NButton>
      </div>
    </NDrawerContent>
  </NDrawer>
  <div class="main">
    <h3>输入价格</h3>
    <NInputNumber
      v-model:value="price"
      class="price-input"
      placeholder="按回车生效"
      :min="1"
      size="large"
      @keyup.enter="selectGoodes"
    >
      <template #prefix>￥</template>
    </NInputNumber>
    <div v-if="config.showList" class="goods-content">
      <h3>低价商品列表</h3>
      <ul class="goods-list">
        <li
          v-for="goods of goodsSHowList"
          :key="goods.code"
          class="goods-itme"
          @click="sendGoods([goods.code])"
        >
          <span>{{ goods.name }}</span>
          <span class="goods-price">￥{{ goods.price }}</span>
          <!-- <span>{{ goods.inventory }}</span> -->
        </li>
      </ul>
    </div>
  </div>
  <n-modal v-model:show="showDialog" preset="dialog">
    <div>商品信息已发送，是否扣减库存？</div>
    <template #action>
      <NButton type="primary" @click="onInventorySure">是</NButton>
      <NButton @click="showDialog = false">否</NButton>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, toRaw } from 'vue'
import type { Goods } from './utils'
import { sortGoodes, getSellGoods } from './utils'
import {
  NButton,
  NSwitch,
  NInputNumber,
  NInputGroup,
  NDrawer,
  NDrawerContent,
  NModal,
} from 'naive-ui'
const preloadApi = window.preloadApi
const price = ref()
const config = reactive({
  codeInput: {
    x: 0,
    y: 0,
  },
  alipayBtn: {
    x: 0,
    y: 0,
  },
  autoInventory: false,
  hintInventory: true,
  showList: false,
  priceLimit: 5,
})
const configBak = preloadApi.getStore('config')
Object.assign(config, configBak)
const showCfg = ref(false)

const allGoodsObj = ref(preloadApi.getGoods()) // 商品库全部商品对象
const goodsList = computed(() => sortGoodes(Object.values(allGoodsObj.value) as Goods[])) // 商品库全部商品列表，从大到小排列
const goodsSHowList = computed(() =>
  goodsList.value.filter(n => n.price <= config.priceLimit).reverse(),
)

preloadApi.on('updated', () => {
  allGoodsObj.value = preloadApi.getGoods()
})
preloadApi.on('config', () => {
  showCfg.value = true
})

function onConfigSure() {
  preloadApi.setStore('config', toRaw(config))
  showCfg.value = false
  Object.assign(configBak, config)
}
function onConfigCancel() {
  showCfg.value = false
  Object.assign(config, configBak)
}

let sellGoods: Goods[] = []
/**
 * 计算卖出的商品
 * @returns {any}
 */
const selectGoodes = function () {
  if (!price.value || price.value < 2) {
    price.value = ''
    alert('价格不对，请重新输入！')
    return
  }
  sellGoods = getSellGoods(price.value, goodsList.value)
  const codeList = sellGoods.map(n => n.code)
  sendGoods(codeList)
}

/**
 * 发送卖出的商品
 * @param {string[]} codeList
 * @returns {any}
 */
const sendGoods = function (codeList: string[]) {
  preloadApi.send('sellGoods', codeList)
  if (config.autoInventory) {
    deductInventory()
  } else if (config.hintInventory) {
    showDialog.value = true
  }
}

/**
 * 减库存
 * @returns {any}
 */
function deductInventory() {
  const goodsObj = {} as any
  for (let i = sellGoods.length - 1; i >= 0; i--) {
    const goods = sellGoods[i]
    if (!(goods.code in goodsObj)) {
      goodsObj[goods.code] = goods
    }
  }
  preloadApi.setGoods(goodsObj)
  Object.assign(allGoodsObj.value, goodsObj)
}

const showDialog = ref(false)
function onInventorySure() {
  showDialog.value = false
  deductInventory()
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 60px 20px 0;
}
.cfg-item {
  display: flex;
  margin-bottom: 12px;
}
.item-label {
  font-size: 16px;
  width: 200px;
}
.operate {
  display: flex;
  justify-content: flex-start;
}

.operate-btn {
  width: 80px;
  margin: 0 20px;
}
.price-input .n-input {
  --font-size: 45px !important;
}
.price-input .n-button {
  --icon-size: 45px !important;
}
.goods-content {
  margin-top: 160px;
}
.goods-list {
  list-style: none;
  font-size: 16px;
  display: flex;
  flex-wrap: wrap;
  padding: 0;
}
.goods-itme {
  margin: 12px;
  width: 100px;
  cursor: pointer;
  border: 1px solid lightblue;
  border-radius: 2px;
}
</style>
