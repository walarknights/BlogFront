<template>
  <div
    class="q-pa-md"
    style="
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 0.5%;
      padding: 0%;
      position: relative;
      width: 70vw;
      height: 30vw;
    "
  >
    <q-carousel
      animated
      v-model="currentSlide"
      navigation
      navigation-icon="sym_o_flag"
      infinite
      :autoplay="isAutoplay"
      arrows
      prev-icon="sym_o_arrow_back_ios"
      next-icon="sym_o_arrow_forward_ios"
      transition-prev="slide-right"
      transition-next="slide-left"
      @mouseenter="isAutoplay = false"
      @mouseleave="isAutoplay = true"
      style="width: 80%; height: 100%"
    >
      <q-carousel-slide
        :name="1"
        img-src="/img/news1.png"
        @click="handleClick(0)"
        style="cursor: pointer"
      >
        <div class="text">
          <p class="title text-h4" style="color: #338ae0">万有引力</p>
          <p class="content">
            AI距“闭眼交付”为时尚早、程序员和产品经理天天Battle，大模型应用真实现状
          </p>
        </div>
      </q-carousel-slide>
      <q-carousel-slide
        :name="2"
        img-src="/img/news2.png"
        @click="handleClick(1)"
        style="cursor: pointer"
      >
        <div class="text">
          <p class="title text-h4" style="color: #ba59e0">Open AGI Forum</p>
          <p class="content">
            模型训练最重要的依然是 Scaling —— 对话阿里通义千问 Qwen 多语言负责人杨宝嵩
          </p>
        </div>
      </q-carousel-slide>
      <q-carousel-slide
        :name="3"
        img-src="/img/news5.png"
        @click="handleClick(2)"
        style="cursor: pointer"
      >
        <div class="text">
          <p class="title text-h4" style="color: #3218c7">论坛资讯</p>
          <p class="content">辞职后爆肝300天开发AI工具，投入2万美元，却换来0用户、0收入！</p>
        </div>
      </q-carousel-slide>
      <q-carousel-slide
        :name="4"
        img-src="/img/news4.jpg"
        @click="handleClick(3)"
        style="cursor: pointer"
      >
        <div class="text">
          <p class="title text-h4" style="color: #dd51bf">极客头条</p>
          <p class="content">
            4815亿登顶！42岁张一鸣首次问鼎中国首富；OpenAI首款硬件被指「像素级抄袭
          </p>
        </div>
      </q-carousel-slide>
    </q-carousel>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  autoplay: {
    type: Boolean,
    default: true,
  },
  slide: {
    type: Number,
    default: 1,
  },
})

const isAutoplay = ref(props.autoplay)
const currentSlide = ref(props.slide)

const links = [
  'https://blog.csdn.net/csdnnews/article/details/148882250?ops_request_misc=%257B%2522request%255Fid%2522%253A%25228d78a1b4ae7a830b1fd2604ee50f9b71%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=8d78a1b4ae7a830b1fd2604ee50f9b71&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-2-148882250-null-null.142^v102^pc_search_result_base7&utm_term=AI%E8%B7%9D%E2%80%9C%E9%97%AD%E7%9C%BC%E4%BA%A4%E4%BB%98%E2%80%9D%E4%B8%BA%E6%97%B6%E5%B0%9A%E6%97%A9%E3%80%81&spm=1018.2226.3001.4187',
  'https://blog.csdn.net/csdnnews/article/details/148882256?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522145aa5f5f2c358129f4cac252b814d81%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=145aa5f5f2c358129f4cac252b814d81&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-1-148882256-null-null.142^v102^pc_search_result_base7&utm_term=%E6%A8%A1%E5%9E%8B%E8%AE%AD%E7%BB%83%E6%9C%80%E9%87%8D%E8%A6%81%E7%9A%84%E4%BE%9D%E7%84%B6%E6%98%AF%20Scaling%20%E2%80%94%E2%80%94%20%E5%AF%B9%E8%AF%9D%E9%98%BF%E9%87%8C%E9%80%9A%E4%B9%89%E5%8D%83%E9%97%AE%20Qwen%20%E5%A4%9A%E8%AF%AD%E8%A8%80%E8%B4%9F%E8%B4%A3%E4%BA%BA%E6%9D%A8%E5%AE%9D%E5%B5%A9&spm=1018.2226.3001.4187',
  'https://blog.csdn.net/React_Community/article/details/148911482?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522e0c3be4a47ae0f670a9edb4850816fe7%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=e0c3be4a47ae0f670a9edb4850816fe7&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-1-148911482-null-null.142^v102^pc_search_result_base7&utm_term=%E8%BE%9E%E8%81%8C%E5%90%8E%E7%88%86%E8%82%9D300%E5%A4%A9%E5%BC%80%E5%8F%91AI%E5%B7%A5%E5%85%B7%EF%BC%8C%E6%8A%95%E5%85%A52%E4%B8%87%E7%BE%8E%E5%85%83%EF%BC%8C%E5%8D%B4%E6%8D%A2%E6%9D%A50%E7%94%A8%E6%88%B7%E3%80%810%E6%94%B6%E5%85%A5%EF%BC%81&spm=1018.2226.3001.4187',
  'https://blog.csdn.net/csdnnews/article/details/148909457?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522fdcaeb573e5bc8ca5d022b55570e7fc3%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fall.%2522%257D&request_id=fdcaeb573e5bc8ca5d022b55570e7fc3&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~all~first_rank_ecpm_v1~rank_v31_ecpm-1-148909457-null-null.142^v102^pc_search_result_base7&utm_term=%204815%E4%BA%BF%E7%99%BB%E9%A1%B6%EF%BC%8142%E5%B2%81%E5%BC%A0%E4%B8%80%E9%B8%A3%E9%A6%96%E6%AC%A1%E9%97%AE%E9%BC%8E%E4%B8%AD%E5%9B%BD%E9%A6%96%E5%AF%8C%EF%BC%9BOpenAI%E9%A6%96%E6%AC%BE%E7%A1%AC%E4%BB%B6%E8%A2%AB%E6%8C%87%E3%80%8C%E5%83%8F%E7%B4%A0%E7%BA%A7%E6%8A%84%E8%A2%AD&spm=1018.2226.3001.4187',
]

function handleClick(idx) {
  const url = links[idx]
  if (url) {
    window.open(url, '_blank')
  }
}
</script>
<style scoped>
.wid {
  width: 1000px;
}

.pic {
  width: 60%;
}

.text {
  position: absolute;
  bottom: 0%;
  left: 0%;
  z-index: 1;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.6); /* 半透明白色背景 */
  /* 你也可以用 rgba(0,0,0,0.4) 得到半透明黑色背景 */
  /* 可根据需要调整透明度和颜色 */
}

.content {
  margin-left: 1%;
}
.text-h4 {
  margin-left: 1%;
  margin-top: 1%;
}

/* 增大 QCarousel navigation-icon 的大小 */
.q-carousel__navigation .q-btn .q-icon {
  font-size: 32px !important;
}
</style>
