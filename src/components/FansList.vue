<template>
  <div class="q-pa-md flex justify-center">
    <div style="max-width: 90%; width: 300px">
      <q-intersection
        v-for="focus in focusList"
        :key="focus.userId"
        transition="flip-right"
        class="justify-center"
      >
        <q-item v-if="!isNull" :clickable="false" class="row" style="padding: 0%">
          <q-item-section avatar>
            <q-avatar text-color="white">
              <img :src="'http://localhost:8010' + focus.avatar" alt="..." />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ focus.userName }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <!-- 针对每个用户单独维护关注状态 -->
            <q-btn
              v-if="focus.isFocus"
              @click="cancelFocus(focus.userId)"
              icon="sym_o_menu"
              class="text-white"
              style="
                align-items: center;
                justify-content: center;
                background-color: cornflowerblue;
                margin-left: 10%;
                width: 100%;
              "
            >
              取消关注
            </q-btn>
            <q-btn
              v-else
              @click="addFocus(focus.userId)"
              icon="sym_o_add"
              class="text-white"
              style="
                align-items: center;
                justify-content: center;
                background-color: cornflowerblue;
                margin-left: 10%;
                width: 100%;
              "
            >
              关注
            </q-btn>
          </q-item-section>
        </q-item>
      </q-intersection>
    </div>
  </div>
  <p v-if="isNull" style="text-align: center">暂无粉丝</p>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from 'src/stores/useStore'
import { useQuasar } from 'quasar'

import api from 'src/utils/axios'
const useStore = useUserStore()
const route = useRoute()
const userId = String(route.params.userId)
const focusList = ref()
const message = ref()
const q = useQuasar()
// 用对象存储每个用户的关注状态

const isNull = ref(false)
const cancelFocus = async (focusedUserId) => {
  try {
    if (useStore.isLoggedIn) {
      const response = await api.post(`/personal/${userId}/removeFocus`, {
        FocusId: useStore.userId,
        FocusedId: focusedUserId,
      })
      if (response) {
        message.value = response.data.message
        // 只修改当前用户的关注状态
        const user = focusList.value.find((item) => item.userId === focusedUserId)
        if (user) user.isFocus = false
        q.notify({
          message: '取消成功',
          color: 'primary',
        })
      }
    } else {
      q.notify({
        message: '请先登录',
        color: 'red',
      })
    }
  } catch (error) {
    console.log('取消关注失败', error)
  }
}

const addFocus = async (focusedUserId) => {
  try {
    if (useStore.isLoggedIn) {
      const response = await api.post(`/personal/${userId}/addFocus`, {
        FocusId: useStore.userId,
        FocusedId: focusedUserId,
      })
      if (response) {
        console.log(response)
        message.value = response.data.message
        q.notify({
          message: message.value,
          color: 'primary',
        })
        // 只修改当前用户的关注状态
        if (response.data.isFocus === 2) {
          const user = focusList.value.find((item) => item.userId === focusedUserId)
          if (user) user.isFocus = true
        }
      }
    } else {
      q.notify({
        message: '请先登录',
        color: 'red',
      })
    }
  } catch (error) {
    console.log('关注失败', error)
  }
}

const getFansList = async () => {
  try {
    const response = await api.get(`/personal/${userId}/fansList`)
    if (response.data) {
      focusList.value = response.data
      console.log(response.data)

      isNull.value = false
    } else {
      focusList.value = []
      isNull.value = true
    }
  } catch (error) {
    console.log('获取粉丝列表失败', error)
    isNull.value = true
    focusList.value = []
  }
}

onMounted(getFansList)
</script>
