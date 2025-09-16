<template>
  <div class="q-pa-md row justify-center" style="margin-top: 100px; width: 70%">
    <div style="width: 80%; height: 80%" class="row justify-between">
      <div
        v-for="article in articles"
        :key="article.id"
        class="article-card"
        style="height: 35%; width: 35%; align-items: self-end; margin-bottom: 2%"
      >
        <div class="q-ma-sm col-4 card-inner" style="height: 80%">
          <img
            :src="
              article.cover
                ? article.cover.startsWith('http')
                  ? article.cover
                  : 'http://localhost:8010' + article.cover
                : 'https://cdn.quasar.dev/img/mountains.jpg'
            "
            class="card-img"
            style="width: 100%; height: 80%; max-height: 180px"
            @click="toArticle(article.id)"
          />
          <div style="height: 20%; margin-bottom: 2%">
            <div class="text-h6">{{ article.author?.username || '未知用户' }}</div>
            <div class="text-subtitle2">{{ article.abstract }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from 'src/utils/axios'

const router = useRouter()
const articles = ref([])

const toArticle = (id) => {
  router.push({ name: 'ArticlePage', params: { id } })
}

onMounted(async () => {
  // 直接使用后端返回的结构
  const res = await api.get('/article/list')
  if (res.data) {
    articles.value = res.data
    console.log(articles.value)
  }
})
</script>

<style scoped>
.article-card {
  background: #fff;
  border-radius: 18px;
  box-shadow:
    0 4px 24px 0 rgba(0, 0, 0, 0.1),
    0 1.5px 6px 0 rgba(0, 0, 0, 0.08);
  transition:
    transform 0.25s cubic-bezier(0.4, 2, 0.6, 1),
    box-shadow 0.25s;
  cursor: pointer;

  /* 立体感 */
  position: relative;
  overflow: hidden;
}
.article-card:hover {
  transform: translateY(-8px) scale(1.03);
  box-shadow:
    0 12px 32px 0 rgba(0, 0, 0, 0.18),
    0 4px 16px 0 rgba(0, 0, 0, 0.12);
  z-index: 2;
}

.card-inner {
  overflow: hidden;
  background: transparent;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.card-img {
  border-radius: 18px 18px 0 0;
  object-fit: cover;
  transition: transform 0.3s cubic-bezier(0.4, 2, 0.6, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.article-card:hover .card-img {
  transform: scale(1.04) rotate(-1deg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}
</style>
