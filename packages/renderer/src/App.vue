<template>
  <div class="main">
    <h3>总价</h3>
    <ElInput
      v-model.number="price"
      class="price-input"
      placeholder="点击此处输入总价"
      @keyup.enter="selectGoodes"
    >
      <template #prepend>￥</template>
    </ElInput>
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
  <ElDialog v-model="showDialog">
    <div>商品信息已发送，是否扣减库存？</div>
    <template #action>
      <ElButton type="primary" @click="onInventorySure">是</ElButton>
      <ElButton @click="showDialog = false">否</ElButton>
    </template>
  </ElDialog>
  <ConfigDrawer @config-change="onConfigChange" />
  <UserDrawer />
</template>

<script lang="ts" setup>
import type { Ref } from 'vue'
import { computed, reactive, ref } from 'vue'
import ConfigDrawer from './components/ConfigDrawer.vue'
import UserDrawer from './components/UserDrawer.vue'
import type { Goods, Config } from './utils'
import { sortGoodes, getSellGoods } from './utils'
import {
  ElButton,
  ElInput,
  ElDialog,
  ElMessage,
  ElMessageBox,
} from 'element-plus'
const preloadApi = window.preloadApi
const price = ref('') as Ref<string | number>

const allGoodsObj = ref(preloadApi.getGoods()) // 商品库全部商品对象
const goodsList = computed(() => sortGoodes(Object.values(allGoodsObj.value) as Goods[])) // 商品库全部商品列表，从大到小排列

const config = reactive(preloadApi.getConfig() as Config)
const onConfigChange = function(cfg: Config) {
  Object.assign(config, cfg)
}
const goodsSHowList = computed(() =>
  goodsList.value.filter(n => n.price <= config.priceLimit).reverse(),
)
preloadApi.on('updated', () => {
  ElMessage.success('更新成功！')
  allGoodsObj.value = preloadApi.getGoods()
})

let sellGoods: Goods[] = []
/**
 * 计算卖出的商品
 * @returns {any}
 */
const selectGoodes = async function () {
  const totalPrice = +price.value
  if (totalPrice > 999) {
    await ElMessageBox.confirm('当前金额较大，确认没错？', {
      confirmButtonText: '没有错',
      cancelButtonText: '输错了，重新输入',
      customClass: 'confirm-box',
      confirmButtonClass: 'confirm-btn',
      closeOnClickModal: false,
    })
  }
  if (totalPrice >= 2) {
    sellGoods = getSellGoods(totalPrice, goodsList.value)
    const codeList = sellGoods.map(n => n.code)
    sendGoods(codeList)
  } else {
    ElMessage.error('价格不对，请重新输入！')
  }
  price.value = ''
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
li {
  list-style: none;
}
.cfg-drawer {
  overflow: auto;
  height: auto !important;
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
.price-input {
  width: 100%;
  line-height: 48px;
}
.price-input input {
  font-size: 36px;
  height: 50px;
}
.goods-content {
  margin-top: 60px;
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
.confirm-box {
  --el-messagebox-content-font-size: 24px;
}
.confirm-box .el-button {
  font-size: 18px;
}
.confirm-btn {
  --el-button-bg-color: #409eff;
  --el-button-border-color: #409eff;
  --el-button-hover-bg-color: rgb(102, 177, 255);
  --el-button-hover-border-color: rgb(102, 177, 255);
  --el-button-active-bg-color: rgb(58, 142, 230);
  --el-button-active-border-color: rgb(58, 142, 230);
  --el-button-hover-text-color: white;
}
</style>
