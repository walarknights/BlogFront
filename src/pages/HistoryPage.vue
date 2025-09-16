<template>
  <div class="column flex-center" style="margin-top: 3%">
    <p class="text-h3">浏览历史</p>
    <div
      v-if="data.articles && data.articles.length > 0"
      class="article-list-vertical"
      style="width: 60%"
    >
      <div
        v-for="(article, idx) in data.articles"
        :key="article.articleId || idx"
        class="article-row"
        @click="toArticle(article.articleId)"
      >
        <div class="cover-container">
          <img :src="getCoverUrl(idx)" alt="封面" class="cover-img" />
        </div>
        <div class="article-content">
          <div class="article-title ellipsis">{{ article.title }}</div>
          <div class="article-summary ellipsis-2-lines">{{ article.abstract }}</div>
          <div class="view-time text-caption text-grey">
            浏览时间: {{ formatViewTime(article.viewTime) }}
          </div>
        </div>
      </div>
    </div>
    <div v-else style="margin-top: 2%">
      <p class="text-h5">暂无浏览历史</p>
    </div>
  </div>
</template>

<script setup>
import api from 'src/utils/axios'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const userId = route.params.userId

const data = ref({
  articles: [],
  Url: [],
})

const getCoverUrl = (idx) => {
  const url = data.value.Url[idx]
  if (!url) return 'https://cdn.quasar.dev/img/mountains.jpg'
  return url.startsWith('http') ? url : 'http://localhost:8010' + url
}

const toArticle = (id) => {
  if (id) {
    router.push({ name: 'ArticlePage', params: { id } })
  }
}

const getArticleList = async () => {
  try {
    const response = await api.get(`/personal/${userId}/getHistory`)
    if (Array.isArray(response.data)) {
      data.value.articles = response.data
      data.value.Url = response.data.map((a) => a.cover || '')
    } else if (response.data) {
      data.value = response.data
    }
    console.log(data.value)
  } catch (error) {
    console.log(error)
  }
}

const formatViewTime = (viewTime) => {
  if (!viewTime) return ''
  // 兼容 ISO 字符串和时间戳
  const date = new Date(viewTime)
  if (isNaN(date.getTime())) return viewTime
  return date.toLocaleString()
}

onMounted(getArticleList)
</script>

<style scoped>
.article-list-vertical {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 12px 0;
}
.article-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 18px 24px;
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}
.article-row:hover {
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.18),
    0 4px 16px 0 rgba(0, 0, 0, 0.12);
  transform: translateY(-4px) scale(1.03);
  z-index: 2;
}
.cover-container {
  flex: 0 0 110px;
  width: 110px;
  height: 110px;
  overflow: hidden;
  border-radius: 8px;
  margin-right: 28px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.article-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0;
}
.article-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #222;
}
.article-summary {
  font-size: 15px;
  color: #666;
}
.view-time {
  margin-top: 8px;
  font-size: 14px;
  color: #999;
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ellipsis-2-lines {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
