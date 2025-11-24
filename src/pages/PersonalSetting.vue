<template>
  <q-page class="q-pa-md" style="width: 60%; margin-top: 1%; margin-left: 20%">
    <q-card>
      <q-card-section>
        <div class="text-h6">修改个人信息</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form @submit.prevent="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.username"
            label="用户名"
            :rules="[(val) => !!val || '用户名不能为空']"
            outlined
            dense
          />
          <q-input
            v-model="form.password"
            label="密码"
            type="password"
            :rules="[(val) => !!val || '密码不能为空']"
            outlined
            dense
          />
          <div>
            <q-avatar size="80px" class="q-mb-sm">
              <img :src="avatarPreview" alt="头像" />
            </q-avatar>
            <q-uploader
              label="上传头像"
              accept="image/*"
              @added="onAvatarChange"
              :auto-upload="false"
              :hide-upload-btn="true"
              style="max-width: 400px"
              max-files="1"
            />
          </div>
          <q-btn label="保存修改" type="submit" color="primary" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from 'src/utils/axios'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const userId = parseInt(String(route.params.userId))
const avatarFile = ref(null)

const defaultAvatar = 'https://cdn.quasar.dev/img/avatar.png'

const form = ref({
  username: '',
  password: '',
  avatar: '',
})
const oldPassword = ref('')

onMounted(async () => {
  try {
    const res = await api.get(`/personal/${userId}/userInfo`)
    console.log(res.data)

    if (res.data) {
      form.value.username = res.data.username || ''
      form.value.avatar = res.data.avatar || ''
      oldPassword.value = res.data.password || ''
      console.log(form.value.avatar)
    } else {
      $q.notify({ type: 'negative', message: '未获取到用户信息' })
    }

    // 密码一般不返回，留空让用户填写新密码
  } catch (error) {
    $q.notify({ type: 'negative', message: error })
  }
})

function onAvatarChange(files) {
  if (files.length > 0) {
    avatarFile.value = files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      form.value.avatar = String(e.target.result)
    }
    reader.readAsDataURL(files[0])
  }
}

const avatarPreview = computed(() => {
  if (form.value.avatar && form.value.avatar.startsWith('data:image')) {
    return form.value.avatar
  }
  if (form.value.avatar) {
    return 'http://localhost:8010' + form.value.avatar
  }
  return defaultAvatar
})

async function onSubmit() {
  if (form.value.password && form.value.password === oldPassword.value) {
    $q.notify({ type: 'negative', message: '新密码不能和旧密码一样' })
    return
  }
  let avatarUrl = form.value.avatar
  if (avatarFile.value) {
    const formData = new FormData()
    formData.append('file', avatarFile.value)
    const res = await api.post(`/personal/${userId}/avatarSave`, formData)
    avatarUrl = res.data.url
    console.log(avatarUrl)
  }
  const response = await api.put(`/personal/${userId}/setting `, {
    username: form.value.username,
    password: form.value.password,
    avatar: avatarUrl,
  })
  if (response.data) {
    $q.notify({
      type: 'info',
      color: 'primary',
      message: '修改成功',
    })
    router.push({ name: 'HomeM' })
  }
}
</script>

<style scoped></style>
