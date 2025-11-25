<template>
  <div v-if="data.articles && data.articles.length > 0" class="article-list-vertical">
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
      </div>
    </div>
  </div>
  <div v-else>
    <p class="text-h3">暂无文章</p>
  </div>
</template>
<script setup lang="ts">
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
    const response = await api.get(`/personal/${userId}/getFavorites`)
    if (response.data) {
      data.value = response.data
    }
  } catch (error) {
    console.log(error)
  }
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
