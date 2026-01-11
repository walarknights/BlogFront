<template>
  <div
    class="column"
    style="
      align-items: center;
      min-height: 100vh;
      background-image: url('/img/news3.jpg');
      background-size: cover;
      background-position: center;
    "
  >
    <q-form @submit.prevent="addarticle" style="width: 70vw">
      <TextEdit v-model:title="title" v-model:content="content" style="width: 100%; padding: 0%" />
      <TagAdd
        v-model:abstract="abstract"
        v-model:type="type"
        v-model:link="link"
        style="width: 100%; margin-top: 2%"
        @cover-uploaded="onCoverUploaded"
      />
      <q-footer elevated>
        <q-toolbar class="row flex-center">
          <q-btn label="发布博客" type="submit" color="primary" />
        </q-toolbar>
      </q-footer>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TextEdit from 'src/components/TextEdit.vue'
import TagAdd from 'src/components/TagAdd.vue'
import api from 'src/utils/axios'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/useStore'
import { useRouter } from 'vue-router'

const router = useRouter()
const title = ref<string>('')
const content = ref<string>('')
const type = ref<string>('')
const link = ref<string>('')
const abstract = ref<string>('')
const coverUploaded = ref<boolean>(false)
const coverFile = ref(null)
const $q = useQuasar()

const userStore = useUserStore()
const userId = userStore.userId
const isLogIn = userStore.isLogIn

const onCoverUploaded = (uploaded: boolean, file?: File) => {
  coverUploaded.value = uploaded
  coverFile.value = file ?? null // 保存文件对象
}

const addarticle = async () => {
  if (!type.value || content.value.length < 100 || !isLogIn || !coverFile.value) {
    if (!isLogIn) {
      $q.notify({
        type: 'warning',
        message: '请先登录',
      })
      return
    }

    if (!coverFile.value) {
      $q.notify({
        type: 'warning',
        message: '请上传封面图片',
      })
      return
    }

    $q.notify({
      type: 'warning',
      message: !type.value ? '请选择文章类型' : '内容不能少于100字',
    })
    return
  }

  try {
    const linkToSend = link.value && link.value.trim() !== '' ? link.value : ''

    // 使用 FormData 一次性上传所有数据（包括封面文件）
    const formData = new FormData()
    formData.append('file', coverFile.value) // 封面文件
    formData.append('userId', String(userId))
    formData.append('title', title.value)
    formData.append('content', content.value)
    formData.append('type', type.value)
    formData.append('abstract', abstract.value)
    formData.append('link', linkToSend)

    console.log('发送的完整数据包含封面文件:', {
      hasFile: !!coverFile.value,
      fileName: coverFile.value?.name,
      title: title.value,
      contentLength: content.value.length,
      userId: userId,
    })

    // 直接将所有数据（包括封面）一起发送到 /article 路由
    const response = await api.post('/article/setArticle', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    $q.notify({
      type: 'positive',
      message: response.data.message ? response.data.message : '发布成功',
    })

    // 清空表单数据
    title.value = ''
    content.value = ''
    abstract.value = ''
    type.value = ''
    link.value = ''
    coverFile.value = null
    coverUploaded.value = false

    router.push({ name: 'HomeM' })
  } catch (error: unknown) {
    console.error('发布文章失败:', error)
    const errorMsg =
      (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
      '发布失败,请重试'
    $q.notify({
      type: 'negative',
      message: errorMsg,
    })
  }
}
</script>
