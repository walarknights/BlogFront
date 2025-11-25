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
              <img
                :src="'http://localhost:8010' + focus.avatar"
                alt="..."
                @click="toPersonal(focus.userId)"
              />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ focus.userName }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <!-- 针对每个用户单独维护关注状态 -->
            <q-btn
              v-if="isFocusMap[focus.userId]"
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
  <p v-if="isNull" style="text-align: center">暂无关注</p>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from 'src/utils/axios'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/useStore'
import { useRouter } from 'vue-router'
const router = useRouter()
const useStore = useUserStore()
const q = useQuasar()
const route = useRoute()
const userId = route.params.userId
const focusList = ref()
// 用对象存储每个用户的关注状态
const isFocusMap = ref({})
const message = ref('')
const albFocus = ref(true)
const isNull = ref(false)

const toPersonal = (focusedUserId) => {
  console.log(focusedUserId)

  router
    .push({
      name: 'Personal',
      params: {
        userId: focusedUserId,
      },
    })
    .then(() => {
      // 跳转后刷新页面
      window.location.reload()
    })
}

const getFocusList = async () => {
  try {
    const response = await api.get(`/personal/${userId}/focusList`)
    if (response.data) {
      focusList.value = response.data
      isNull.value = false
      // 初始化每个用户的关注状态为true
      isFocusMap.value = {}
      response.data.forEach((item) => {
        isFocusMap.value[item.userId] = true
      })
    } else {
      focusList.value = []
      isNull.value = true
    }
  } catch (error) {
    console.log('获取关注列表失败', error)
    isNull.value = true
    focusList.value = []
  }
}

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
        isFocusMap.value[focusedUserId] = false
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
    console.log('关注失败', error)
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
        albFocus.value = response.data.isFocus
        q.notify({
          message: '关注成功',
          color: 'primary',
        })
        // 只修改当前用户的关注状态
        isFocusMap.value[focusedUserId] = true
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
onMounted(getFocusList)
</script>
