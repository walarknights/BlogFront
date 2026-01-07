<template>
  <q-dialog v-model="modelValue" class="login-dialog">
    <q-card style="width: 50%">
      <div
        v-show="!isRegisterMode && isimgload"
        class="column background-image"
        style="align-content: stretch; height: 700px; align-items: center"
      >
        <q-card-section style="height: 40%">
          <h3 style="text-align: center">用户登录</h3>
        </q-card-section>

        <q-card-section style="width: 80%">
          <q-input
            filled
            v-model="username"
            label="用户名"
            placeholder="请输入用户名"
            dense
            style="border: 1px solid black"
          />
        </q-card-section>

        <q-card-section style="width: 80%">
          <q-input
            filled
            v-model="password"
            label="密码"
            :type="visible ? 'text' : 'password'"
            placeholder="请输入密码"
            dense
            style="border: 1px solid black"
          >
            <q-btn
              @click="visible = !visible"
              :icon="visible ? 'sym_o_visibility' : 'sym_o_visibility_lock'"
              flat
              style="position: absolute; right: 0; top: 0"
            />
          </q-input>
        </q-card-section>

        <q-card-section style="padding-top: 0; padding-bottom: 0; height: 10%">
          <div
            class="error-message"
            :class="{ 'message-hidden': !errorMsg }"
            style="margin: 0%; min-height: 1.5em; color: red"
          >
            {{ errorMsg }}
          </div>
        </q-card-section>
        <div class="row" style="justify-content: space-around; width: 100%">
          <q-btn
            @click="login"
            :disabled="isLoading"
            icon="sym_o_login"
            style="background-color: cornflowerblue"
          >
            <div style="margin-left: 5%">{{ isLoading ? '登录中...' : '登录' }}</div>
          </q-btn>
          <q-btn @click="close" icon="sym_o_close" style="background-color: cornflowerblue">
            <div style="margin-left: 5%">取消</div>
          </q-btn>
          <q-btn
            @click="switchToRegister"
            icon="sym_o_start"
            style="background-color: cornflowerblue"
          >
            <div style="margin-left: 5%">注册</div>
          </q-btn>
        </div>
      </div>

      <div
        v-show="isRegisterMode && isimgload"
        class="column background-image"
        style="align-content: stretch; height: 700px; align-items: center"
      >
        <q-card-section
          style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 20%;
            margin-top: 5%;
            margin-bottom: 5%;
          "
        >
          <p style="text-align: center; margin-top: 10%; font-size: 45px">用户注册</p>
        </q-card-section>

        <q-card-section style="width: 80%">
          <q-input
            filled
            v-model="setusername"
            label="用户名"
            placeholder="请输入用户名"
            dense
            style="border: 1px solid black"
          />
        </q-card-section>

        <q-card-section style="width: 80%" class="row">
          <q-input
            filled
            v-model="setpassword"
            label="密码"
            :type="setpasswordVisible ? 'text' : 'password'"
            placeholder="请输入密码"
            dense
            style="border: 1px solid black; width: 100%; position: relative"
          >
            <q-btn
              @click="setpasswordVisible = !setpasswordVisible"
              :icon="setpasswordVisible ? 'sym_o_visibility' : 'sym_o_visibility_lock'"
              flat
              style="position: absolute; right: 0; top: 0"
            />
          </q-input>
        </q-card-section>
        <q-card-section style="width: 80%">
          <q-input
            filled
            v-model="rpassword"
            label="确认"
            :type="rpasswordVisible ? 'text' : 'password'"
            placeholder="请再次输入密码"
            dense
            style="border: 1px solid black; width: 100%; position: relative"
          >
            <q-btn
              @click="rpasswordVisible = !rpasswordVisible"
              :icon="rpasswordVisible ? 'sym_o_visibility' : 'sym_o_visibility_lock'"
              flat
              style="position: absolute; right: 0; top: 0"
            />
          </q-input>
        </q-card-section>

        <q-card-section style="padding-top: 0; padding-bottom: 0; height: 10%">
          <div
            class="error-message"
            :class="{ 'message-hidden': !errorMsg }"
            style="margin: 0%; min-height: 1.5em; color: red"
          >
            {{ errorMsg }}
          </div>
        </q-card-section>
        <div class="row" style="justify-content: space-around; width: 100%">
          <q-btn
            @click="setup"
            :disabled="isLoading"
            icon="sym_o_login"
            style="background-color: cornflowerblue"
          >
            <div style="margin-left: 5%">注册</div>
          </q-btn>
          <q-btn @click="close" icon="sym_o_close" style="background-color: cornflowerblue">
            <div style="margin-left: 5%">取消</div>
          </q-btn>
          <q-btn
            @click="switchToRegister"
            icon="sym_o_undo"
            style="background-color: cornflowerblue"
          >
            <div style="margin-left: 5%">登录</div>
          </q-btn>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from 'src/utils/axios'
import { useUserStore } from 'src/stores/useStore'

const userStore = useUserStore()
const setpasswordVisible = ref(false)
const rpasswordVisible = ref(false)
const visible = ref(false)
const props = defineProps({
  show: Boolean,
})

const emit = defineEmits(['close', 'transData'])

const username = ref('')
const password = ref('')
const setusername = ref('')
const setpassword = ref('')
const rpassword = ref('')
const errorMsg = ref('')
const isLoading = ref(false)
const img = new Image()

const isimgload = ref(false)
img.onload = () => {
  isimgload.value = true
}
img.src = 'img/LoginBack.jpg'

const modelValue = computed({
  get: () => props.show,
  set: (value) => {
    if (!value) {
      emit('close')
      isRegisterMode.value = false
    }
  },
})
const isRegisterMode = ref(false)
const switchToRegister = () => {
  isRegisterMode.value = !isRegisterMode.value
}
onMounted(async () => {
  const token = localStorage.getItem('authToken')
  if (token) {
    try {
      const response = await api.post('/user/verifyToken', {
        token: token,
      })

      if (response.data.userResponse) {
        userStore.setUser(response.data.userResponse)
        emit('transData', response.data.userResponse)
      } else {
        localStorage.removeItem('authToken')
      }
    } catch (error) {
      console.error('Token 验证失败:', error)

      localStorage.removeItem('authToken')
    }
  } else {
    const data = {
      userId: 0,
      username: '',
      followers: 0,
      following: 0,
      dynamicNum: 0,
      avatar: '/static/usersInfo/avatar/default.png',
    }
    userStore.setUser(data)
  }
  isRegisterMode.value = false
})
const login = async () => {
  if (!username.value || !password.value) {
    errorMsg.value = '用户名和密码不能为空'
    return
  }

  try {
    isLoading.value = true
    errorMsg.value = ''

    const response = await api.post('/user/login', {
      username: username.value,
      password: password.value,
    })
    if (response.data) {
      localStorage.setItem('authToken', response.data.token)
      userStore.setUser(response.data.userResponse)
      emit('transData', response.data.userResponse)
      console.log(userStore.avatar)

      close()
    } else {
      throw new Error('登录响应数据无效')
    }
  } catch (error) {
    console.error('登录失败', error)
    errorMsg.value = error.response?.data?.message || '网络错误，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

const setup = async () => {
  if (!setusername.value || !setpassword.value) {
    errorMsg.value = '用户名和密码不能为空'
    return
  }
  if (setpassword.value != rpassword.value) {
    errorMsg.value = '两次密码不一致'
    return
  }

  try {
    isLoading.value = true
    errorMsg.value = ''

    const response = await api.post('/user/setUser', {
      username: setusername.value,
      password: setpassword.value,
    })

    if (response.data) {
      userStore.setUser(response.data.user)
      localStorage.setItem('authToken', response.data.token)
      emit('transData', response.data)
      close()
    } else {
      throw new Error('注册响应数据无效')
    }
  } catch (error) {
    console.error('注册失败', error)
    errorMsg.value = error.response?.data?.message || '网络错误，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

const close = () => {
  username.value = ''
  password.value = ''
  errorMsg.value = ''
  emit('close')
  isRegisterMode.value = false
}
</script>

<style scoped>
.login-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 120%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.login-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.button-group {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.button-group button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button-group button:first-child {
  background-color: #4caf50;
  color: white;
}

.button-group button:last-child {
  background-color: #f44336;
  color: white;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.background-image {
  position: relative;
  overflow: hidden;
}

.background-image::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('img/LoginBack.jpg');
  background-size: cover; /* 或 contain，根据需求选择 */
  background-position: center;
  opacity: 0.4; /* 设置透明度 */
  z-index: 0; /* 确保背景图在内容后面 */
}

.message-hidden {
  visibility: hidden;
}

.error-message {
  /* 比如错误文本颜色 */
  color: red;

  min-height: 1.5em;
  /* 其他需要的样式 */
  text-align: center; /* 居中显示错误消息 */
  padding: 5px 0; /* 给一点垂直内边距 */
}
</style>
