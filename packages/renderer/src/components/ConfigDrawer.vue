<template>
  <ElDrawer
    v-model="showDrawer"
    direction="ttb"
    custom-class="cfg-drawer"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    title="设置项"
  >
    <div class="cfg-item">
      <span class="item-label">商品码输入框坐标</span>
      <span class="item-value">
        <ElInputNumber v-model="config.codeInput.x" placeholder="x" :min="0" />
        <ElInputNumber v-model="config.codeInput.y" placeholder="y" :min="0" />
      </span>
    </div>
    <div class="cfg-item">
      <span class="item-label">自动扣减库存</span>
      <span class="item-value">
        <ElSwitch v-model="config.autoInventory" />
      </span>
    </div>
    <div v-if="!config.autoInventory" class="cfg-item">
      <span class="item-label">提示扣减库存</span>
      <span class="item-value">
        <ElSwitch v-model="config.hintInventory" />
      </span>
    </div>
    <div class="cfg-item">
      <span class="item-label">显示低价商品列表</span>
      <span class="item-value">
        <ElSwitch v-model="config.showList" />
      </span>
    </div>
    <div v-if="config.showList" class="cfg-item">
      <span class="item-label">低价价格阈值</span>
      <span class="item-value">
        <ElInputNumber v-model="config.priceLimit" :min="1" />
      </span>
    </div>
    <div class="operate">
      <ElButton
        class="operate-btn"
        size="small"
        type="primary"
        @click="onConfigSure"
      >
        确定
      </ElButton>
      <ElButton class="operate-btn" size="small" @click="onConfigCancel">取消</ElButton>
    </div>
  </ElDrawer>
</template>

<script lang="ts" setup>
import { reactive, ref, toRaw, defineEmits } from 'vue'
import type { Config } from '../utils'
import { ElButton, ElSwitch, ElInputNumber, ElDrawer } from 'element-plus'

const preloadApi = window.preloadApi
const emit = defineEmits(['config-change'])
const config = reactive({} as Config)
const configBak = preloadApi.getConfig() as Config
Object.assign(config, configBak)
const showDrawer = ref(false)

preloadApi.on('config', () => {
  showDrawer.value = true
})

function onConfigSure() {
  preloadApi.setConfig(toRaw(config))
  showDrawer.value = false
  Object.assign(configBak, config)
  emit('config-change', toRaw(config))
}
function onConfigCancel() {
  showDrawer.value = false
  Object.assign(config, configBak)
}
</script>

<style>
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
</style>
