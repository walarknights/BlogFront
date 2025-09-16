<template>
  <div class="article-page q-pa-md">
    <div class="article-header row items-center q-mb-md">
      <q-avatar size="60px" class="q-mr-md">
        <img :src="authorAvatarUrl" />
      </q-avatar>
      <div>
        <div class="text-h6">{{ author.username }}</div>
        <div class="text-caption text-grey">
          粉丝: {{ author.followers }} | 关注: {{ author.followings }} | 博客数:
          {{ author.dynamicNum }}
        </div>
      </div>
      <q-btn
        @click="addFocus(article.userId)"
        icon="sym_o_add"
        class="bg-focus text-white"
        style="background-color: cornflowerblue; margin-left: 2%"
        >关注
      </q-btn>
    </div>
    <div class="article-title text-h3 q-mb-sm" style="margin-bottom: 5%">{{ article.title }}</div>
    <div class="article-abstract text-subtitle1 text-grey q-mb-md" style="margin-bottom: 10%">
      {{ article.abstract }}
    </div>

    <div class="article-content q-mb-lg" v-html="article.content"></div>
    <div v-if="article.link" class="q-mt-md">
      <q-icon name="sym_o_link" color="primary" class="q-mr-xs" />
      <a :href="article.link" target="_blank" rel="noopener" style="color: #1976d2">原文链接</a>
    </div>
    <div class="row" style="justify-content: space-between; margin-top: 10%">
      <q-btn
        @click="likeArticle"
        :class="islike ? 'materialIN' : 'materialOUT'"
        :label="article.likes"
        color="primary"
        icon="sym_o_thumb_up"
      />
      <p v-if="errorMsg" style="color: red; font-size: medium">{{ errorMsg }}</p>
      <q-btn
        @click="favoriteArticle"
        :class="isFavorite ? 'materialIN' : 'materialOUT'"
        :label="article.favorites"
        color="secondary"
        icon="sym_o_star_rate"
      />
    </div>
    <CommentSection />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from 'src/utils/axios'
import { useUserStore } from 'src/stores/useStore'
import { useQuasar } from 'quasar'
import CommentSection from 'src/components/CommentSection.vue'

const q = useQuasar()

const useStore = useUserStore()

const isLoggedIn = useStore.isLoggedIn // 修正此处
const route = useRoute()
const userId = computed(() => useStore.userId)
const articleId = parseInt(route.params.id, 10)
const albFocus = ref()
const errorMsg = ref('')
const isFavorite = ref(false)
const islike = ref(false)
const article = ref({
  id: null,
  userId: null,
  content: '',
  title: '',
  type: null,
  abstract: '',
  likes: '',
  favorites: '',
  link: '',
  cover: '',
  author: {
    username: '',
    followers: 0,
    followings: 0,
    avatar: '',
    dynamicNum: 0,
  },
})

const author = computed(() => article.value.author)

const authorAvatarUrl = computed(() =>
  article.value.author.avatar
    ? 'http://localhost:8010' + article.value.author.avatar
    : '/img/default-avatar.png',
)

const addFocus = async (focusedUserId) => {
  try {
    if (useStore.isLoggedIn) {
      const response = await api.post(`/personal/${userId.value}/addFocus`, {
        FocusId: useStore.userId,
        FocusedId: focusedUserId,
      })
      if (response) {
        albFocus.value = response.data.isFocus
        if (albFocus.value == 0) {
          q.notify({
            message: '不能关注自己',
            color: 'red',
          })
        } else if (albFocus.value == 1) {
          q.notify({
            message: '已经关注过了',
            color: 'blue-4',
          })
        } else {
          useStore.incrementFollowing()
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

onMounted(async () => {
  try {
    const id = route.params.id
    const res = await api.get(`/article/${id}`)
    if (res.data) {
      article.value = res.data
    }

    if (userId.value) {
      await api.post(`/personal/history/view`, {
        userId: parseInt(userId.value, 10),
        articleId: articleId,
        viewTime: new Date().toISOString(),
      })

      const res2 = await api.post(`/article/${articleId}/islike`, {
        userId: parseInt(userId.value, 10),
      })
      if (res2.data.likes == 1) {
        islike.value = true
      } else {
        islike.value = false
      }

      const res3 = await api.post(`/article/${articleId}/isfavorite`, {
        userId: parseInt(userId.value, 10),
      })
      if (res3.data.favorites == 1) {
        isFavorite.value = true
      } else {
        isFavorite.value = false
      }
    }

    console.log('文章数据:', article.value) // 添加日志方便调试
  } catch (error) {
    console.error('获取文章失败:', error)
  }
})

const likeArticle = async () => {
  if (!isLoggedIn) {
    errorMsg.value = '请先登录'
    return
  } else errorMsg.value = ''

  try {
    const response = await api.post(`/article/${articleId}/like`, {
      userId: parseInt(userId.value, 10), // 转换为整数
    })

    if (response.data) {
      // 更新视频点赞数
      console.log(response.data.message)

      if (response.data.islike == 1) {
        article.value.likes += 1
        islike.value = true
        q.notify({
          message: '点赞成功',
          color: 'brand',
        })
      } else {
        article.value.likes -= 1
        islike.value = false
      }
    }
  } catch (error) {
    console.error('点赞失败', error)
    errorMsg.value = '点赞失败，请稍后重试'
  }
}

const favoriteArticle = async () => {
  if (!isLoggedIn) {
    errorMsg.value = '请先登录'
    return
  } else errorMsg.value = ''

  try {
    const response = await api.post(`/article/${articleId}/favorite`, {
      userId: parseInt(userId.value, 10), // 转换为整数
    })
    if (response.data.isfavorites == 1) {
      // 更新视频收藏数
      article.value.favorites += 1
      isFavorite.value = true
      q.notify({
        message: '收藏成功',
        color: 'favorite',
      })
    } else {
      article.value.favorites -= 1
      isFavorite.value = false
    }
  } catch (error) {
    console.error('收藏失败', error)
    errorMsg.value = '收藏失败，请稍后重试'
  }
}
</script>

<style scoped>
.article-page {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 32px 24px;
}
.article-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
  margin-bottom: 24px;
}
.article-title {
  font-weight: bold;
}
.article-abstract {
  font-style: italic;
  color: #888;
}
.article-content {
  font-size: 18px;
  line-height: 1.8;
  color: #222;
  word-break: break-all;
}

materialOUT {
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
  border: none;
}

.materialIN {
  font-variation-settings:
    'FILL' 1,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
  border: none;
}
</style>
