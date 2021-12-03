<template>
  <ElDrawer
    v-model="showDrawer"
    direction="ttb"
    custom-class="user-drawer"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    title="账户管理"
  >
    <div class="content-item">
      <h4>当前账户: {{ currentUser }}</h4>
    </div>
    <ElButton type="primary" @click="onAdduser">+ 新建账户</ElButton>
    <div class="content-item">
      <h4>用户列表</h4>
      <ul class="user-list">
        <li v-for="user of userList" :key="user">
          <span>{{ user }}</span>
          <ElButton type="primary" :disabled="user === currentUser" @click="onSwitchUser(user)">切换账户</ElButton>
          <ElButton type="danger" :disabled="user === currentUser" @click="onDeleteUser(user)">删除账户</ElButton>
        </li>
      </ul>
    </div>
  </ElDrawer>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { ElButton, ElMessageBox, ElDrawer } from 'element-plus'
import { getInitUser } from '../utils'

const preloadApi = window.preloadApi
const currentUser = preloadApi.getStore('userName')
const userMap = ref(preloadApi.getStore('userMap'))
const userList = computed(() => Object.keys(userMap.value))

const showDrawer = ref(false)

preloadApi.on('user', () => {
  showDrawer.value = true
})
const onAdduser = function () {
  ElMessageBox.prompt('输入账户名', '', {
    inputValidator(newUser: string) {
      newUser = newUser.trim()
      return newUser in userMap.value ? '账户名已存在！' : true
    },
  }).then(({ value }) => {
    const newUser = value.trim()
    userMap.value[newUser] = getInitUser()
    preloadApi.setStore(`userMap.${newUser}`, getInitUser())
  })
}
const onSwitchUser = function (newUser: string) {
  preloadApi.setStore('userName', newUser)
  preloadApi.send('relaunch')
}
const onDeleteUser = function (newUser: string) {
  ElMessageBox.confirm(`确定删除用户${newUser}？`)
    .then(() => {
      delete userMap.value[newUser]
      preloadApi.deleteStore(`userMap.${newUser}`)
    })
}
</script>

<style>
.user-drawer {
  overflow: auto;
  height: auto !important;
}
.user-item {
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
