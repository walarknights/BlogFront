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
        v-if="!isFollow"
        @click="addFocus(article.userId)"
        icon="sym_o_add"
        class="bg-focus text-white"
        style="background-color: cornflowerblue; margin-left: 2%"
        >关注
      </q-btn>
      <q-btn
        v-else
        @click="removeFocus(article.userId)"
        icon="sym_o_remove"
        class="bg-grey-5 text-black"
        style="background-color: cornflowerblue; margin-left: 2%"
        >取消关注
      </q-btn>
    </div>
    <div class="article-title text-h3 q-mb-sm" style="margin-bottom: 5%">{{ article.title }}</div>
    <div class="article-abstract text-subtitle1 text-grey q-mb-md" style="margin-bottom: 10%">
      {{ article.abstract }}
    </div>
    <q-markdown
      class="article-content"
      :src="article.content"
      style="font-size: 18px; line-height: 1.8; color: #222; word-break: break-all"
    />
    <div v-if="article.link" class="q-mt-md">
      <q-icon name="sym_o_link" color="primary" class="q-mr-xs" />
      <a :href="article.link" target="_blank" rel="noopener" style="color: #1976d2">原文链接</a>
    </div>
    <div class="row" style="justify-content: space-between; margin-top: 10%">
      <q-btn
        v-if="!islike"
        @click="likeArticle"
        class="materialOUT"
        :label="article.likes"
        color="primary"
        icon="sym_o_thumb_up"
      />
      <q-btn
        v-else
        @click="removeLikeArticle"
        class="materialIN"
        :label="article.likes"
        color="primary"
        icon="sym_o_thumb_up_off_alt"
      />
      <p v-if="errorMsg" style="color: red; font-size: medium">{{ errorMsg }}</p>
      <q-btn
        v-if="!isFavorite"
        @click="favoriteArticle"
        class="materialOUT"
        :label="article.favorites"
        color="secondary"
        icon="sym_o_star_rate"
      />
      <q-btn
        v-else
        @click="removeFavoriteArticle"
        class="materialIN"
        :label="article.favorites"
        color="secondary"
        icon="sym_o_star_rate"
      />
    </div>
    <CommentSection />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from 'src/utils/axios'
import { useUserStore } from 'src/stores/useStore'
import { useQuasar } from 'quasar'
import CommentSection from 'src/components/CommentSection.vue'

const q = useQuasar()

const useStore = useUserStore()

// const isLogIn = useStore.isLogIn // 修正此处：移除此行，直接使用 useStore.isLogIn 以保持响应性
const route = useRoute()
const userId = computed(() => useStore.userId)
const articleId = parseInt(String(route.params.id), 10)

const errorMsg = ref('')
const isFavorite = ref<boolean>(false)
const islike = ref<boolean>(false)
const isFollow = ref<boolean>(false)
const article = ref({
  id: null,
  userId: null,
  content: '',
  title: '',
  type: null,
  abstract: '',
  likes: 0,
  favorites: 0,
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
  article.value.author.avatar ? article.value.author.avatar : '/img/default-avatar.png',
)

const addFocus = async (focusedUserId) => {
  if (!useStore.isLogIn) {
    q.notify({
      message: '请先登录',
      color: 'red',
    })
    return
  }
  try {
    if (useStore.isLogIn) {
      const response = await api.post(`/personal/${userId.value}/addFocus`, {
        FocusId: useStore.userId,
        FocusedId: focusedUserId,
      })
      if (response) {
        isFollow.value = response.data.isFocus
        const message = response.data.message
        if (isFollow.value == true) {
          if (message === '关注成功') {
            useStore.incrementFollowing()
          }
          q.notify({
            message: message,
            color: 'blue-4',
          })
        } else {
          q.notify({
            message: message,
            color: 'green-10',
          })
        }
      }
    }
  } catch (error) {
    console.log('关注失败', error)
  }
}

const removeFocus = async (focusedUserId) => {
  try {
    if (useStore.isLogIn) {
      const response = await api.post(`/personal/removeFollow/${userId.value}`, {
        FocusId: useStore.userId,
        FocusedId: focusedUserId,
      })
      if (response) {
        isFollow.value = response.data.isFocus
        const message = response.data.message
        if (isFollow.value == false) {
          if (message === '取消关注成功') {
            useStore.decrementFollowing()
          }
          q.notify({
            message: message,
            color: 'green-10',
          })
        } else {
          q.notify({
            message: message,
            color: 'blue-4',
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
    console.log('取消关注失败', error)
  }
}

const likeArticle = async () => {
  if (!useStore.isLogIn) {
    errorMsg.value = '请先登录'
    console.log(useStore.isLogIn)

    return
  } else errorMsg.value = ''

  try {
    const response = await api.post(`/article/like/${articleId}`, {
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

const removeLikeArticle = async () => {
  if (!useStore.isLogIn) {
    errorMsg.value = '请先登录'
    console.log(useStore.isLogIn)

    return
  } else errorMsg.value = ''

  try {
    const response = await api.post(`/article/removeLike/${articleId}`, {
      userId: parseInt(userId.value, 10), // 转换为整数
    })

    if (response.data) {
      // 更新视频点赞数
      console.log(response.data.message)

      if (response.data.isLike == 0) {
        article.value.likes -= 1
        islike.value = false
        q.notify({
          message: '取消点赞成功',
          color: 'grey',
        })
      } else {
        islike.value = true
      }
    }
  } catch (error) {
    console.error('取消点赞失败', error)
    errorMsg.value = '取消点赞失败，请稍后重试'
  }
}

const favoriteArticle = async () => {
  if (!useStore.isLogIn) {
    errorMsg.value = '请先登录'
    return
  } else errorMsg.value = ''

  try {
    const response = await api.post(`/article/favorite/${articleId}`, {
      userId: parseInt(userId.value, 10), // 转换为整数
    })
    if (response.data.isFavorite == 1) {
      // 更新视频收藏数
      article.value.favorites += 1
      isFavorite.value = true
      q.notify({
        message: '收藏成功',
        color: 'favorite',
      })
    } else {
      isFavorite.value = false
    }
  } catch (error) {
    console.error('收藏失败', error)
    errorMsg.value = '收藏失败，请稍后重试'
  }
}

const removeFavoriteArticle = async () => {
  if (!useStore.isLogIn) {
    errorMsg.value = '请先登录'
    return
  } else errorMsg.value = ''

  try {
    const response = await api.post(`/article/removeFavorite/${articleId}`, {
      userId: parseInt(userId.value, 10), // 转换为整数
    })
    if (response.data.isFavorite == 0) {
      // 更新视频收藏数
      article.value.favorites -= 1
      isFavorite.value = false
      q.notify({
        message: '取消收藏成功',
        color: 'grey',
      })
    } else {
      article.value.favorites += 1
      isFavorite.value = true
    }
  } catch (error) {
    console.error('取消收藏失败', error)
    errorMsg.value = '取消收藏失败，请稍后重试'
  }
}

onMounted(async () => {
  try {
    const id = route.params.id as string
    const res = await api.get(`/article/specific/${id}`)
    if (res.data) {
      article.value = res.data
    }

    if (userId.value) {
      await api.post(`/personal/addHistory`, {
        userId: parseInt(userId.value, 10),
        articleId: articleId,
        viewTime: new Date().toISOString(),
      })

      const res2 = await api.post(`/article/isLike/${articleId}`, {
        userId: parseInt(userId.value, 10),
      })
      if (res2.data.likes == 1) {
        islike.value = true
      } else {
        islike.value = false
      }

      const res3 = await api.post(`/article/isFavorite/${articleId}`, {
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

.materialOUT {
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
