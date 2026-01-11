<template>
  <div class="custom-background">
    <q-page-container>
      <q-page
        class="column"
        style="margin: 0% 10%; justify-content: center; align-items: center"
        :style-fn="myTweak"
      >
        <div
          class="shadow-12 column content-center"
          style="border-radius: 1%; background-color: white"
        >
          <div style="justify-content: center; height: 100%">
            <div class="header column content-background" style="align-items: center; height: 80%">
              <div
                v-if="userInfo"
                style="
                  background-color: white;
                  margin-bottom: 1%;
                  margin-top: 1%;
                  align-items: center;
                  z-index: 2;
                  padding: 10px;
                  border-radius: 5%;
                "
                class="row"
              >
                <div class="column">
                  <q-avatar style="margin: 0; padding: 0; height: 60px">
                    <img
                      :src="userInfo.avatar"
                      alt="..."
                      style="background-color: black; border: 1px black; height: 80%"
                    />
                  </q-avatar>
                  <strong style="font-size: medium; color: #0863e3">{{ userInfo.username }}</strong>
                </div>
                <div class="column" style="margin-left: 20px">
                  <q-btn
                    @click="addFocus"
                    icon="sym_o_add"
                    style="margin-top: 10px; background-color: aqua"
                    >关注</q-btn
                  >
                  <div class="row" style="margin-top: 10px">
                    <div class="user-stats">
                      <div class="stat-item">
                        <div class="stat-number">{{ formatfocuses }}</div>
                        <div class="stat-label">关注</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-number">{{ formatfollowers }}</div>
                        <div class="stat-label">粉丝</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-number">{{ userInfo.dynamicNum }}</div>
                        <div class="stat-label">博客</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="content row" style="justify-content: center">
                <ShowCompent style="width: 80%; padding: 0; margin-bottom: 5%" />
              </div>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </div>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router'
import ShowCompent from 'src/components/ShowCompent.vue'
import { onMounted, ref, computed } from 'vue'
import api from 'src/utils/axios'
import { useUserStore } from 'src/stores/useStore'
import { useQuasar } from 'quasar'
const q = useQuasar()
const route = useRoute()
const userId = parseInt(route.params.userId as string)
const albFocus = ref(true)
const useStore = useUserStore()
const userInfo = ref({
  userId: 0,
  followings: 0,
  followers: 0,
  dynamicNum: 0,

  username: '',
  avatar: '',
})
function myTweak(offset) {
  return {
    minHeight: offset ? `calc(100vh - ${offset}px)` : '100vh',
  }
}

const fetchPersonalPage = async () => {
  try {
    const response = await api.get(`/personal/getInfo/${userId}`)
    if (response.data) {
      userInfo.value = response.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

const formatfocuses = computed(() => {
  if (!userInfo.value) return '0'
  const followings = userInfo.value.followings
  if (followings >= 10000) {
    return (followings / 10000).toFixed(1) + '万'
  }
  return followings
})

const formatfollowers = computed(() => {
  if (!userInfo.value) return '0'
  const followers = userInfo.value.followers
  if (followers >= 10000) {
    return (followers / 10000).toFixed(1) + '万'
  }
  return followers
})

const addFocus = async () => {
  try {
    if (useStore.isLogIn) {
      const response = await api.post(`/personal/${userId}/addFocus`, {
        FocusId: useStore.userId,
        FocusedId: userInfo.value.userId,
      })
      if (response) {
        albFocus.value = response.data.isFocus
        if (albFocus.value == false) {
          q.notify({
            message: '不能关注自己',
            color: 'red',
          })
        } else if (albFocus.value == true) {
          q.notify({
            message: '已经关注过了',
            color: 'blue-4',
          })
        } else {
          console.log(albFocus.value)

          q.notify({
            message: '关注成功',
            color: 'green-10',
          })
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
onMounted(fetchPersonalPage)
</script>
<style>
.custom-background {
  background-image: url('/img/CreateBac.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
}

.content-background {
  position: relative; /* 为伪元素定位 */
}

.content-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/img/移星桂冠.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.5;
  z-index: 0;
}
.user-stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
  margin-bottom: 16px;
}

.stat-item {
  padding: 0 10px;
}

.stat-number {
  font-size: 18px;
  font-weight: 600;

  color: #066be6;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.basicNum {
  z-index: 2;
  background-color: white;
}
</style>
