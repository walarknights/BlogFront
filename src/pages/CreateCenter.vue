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
    <TextEdit v-model:title="title" v-model:content="content" style="width: 40%; padding: 0%" />
    <TagAdd
      v-model:abstract="abstract"
      v-model:tags="tags"
      v-model:type="type"
      v-model:link="link"
      style="width: 40%; margin-top: 2%"
      @cover-uploaded="onCoverUploaded"
    />
  </div>
  <q-footer elevated>
    <q-toolbar class="row flex-center">
      <q-btn
        label="发布博客"
        @click="addarticle"
        icon="sym_o_add"
        :disable="!coverUploaded"
      ></q-btn>
    </q-toolbar>
  </q-footer>
</template>

<script setup>
import { ref } from 'vue'
import TextEdit from 'src/components/TextEdit.vue'
import TagAdd from 'src/components/TagAdd.vue'
import api from 'src/utils/axios'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/useStore'
import { useRouter } from 'vue-router'
const router = useRouter()
const title = ref('')
const content = ref('')
const tags = ref([])
const type = ref('')
const link = ref('')
const abstract = ref('')
const coverUploaded = ref(false)
const $q = useQuasar()

const typeNum = ref(false)

const userStore = useUserStore()
const userId = userStore.userId
const isLoggedIn = userStore.isLoggedIn // 修正此处

const onCoverUploaded = (uploaded) => {
  coverUploaded.value = uploaded
}

const addarticle = async () => {
  if (!type.value || content.value.length < 100 || !isLoggedIn) {
    if (!isLoggedIn) {
      $q.notify({
        // 增加判断，防止notify不存在
        type: 'warning',
        message: '请先登录',
      })
      return
    }

    $q.notify({
      type: 'warning',
      message: !type.value ? '请选择文章类型' : '内容不能少于100字',
    })
    return
  } else {
    // 修正 typeNum 逻辑
    if (type.value === 'op2') {
      typeNum.value = false
    } else if (type.value === 'op1') {
      typeNum.value = true
    }
    // link 为空字符串时传 null
    const linkToSend = link.value && link.value.trim() !== '' ? link.value : null
    console.log('发送的完整数据:', {
      content: content.value,
      title: title.value,
      articleType: typeNum.value,
      tags: tags.value,
      userId: userId,
      link: linkToSend,
    })
    const response = await api.post(`/article/setup`, {
      content: content.value,
      title: title.value,
      articleType: typeNum.value,

      abstract: abstract.value,
      userId: userId,
      link: linkToSend,
    })

    $q.notify({
      type: 'info',
      message: response.data.message,
    })
    router.push({ name: 'HomeM' })
  }
}
</script>
