<template>
  <div class="column flex-center">
    <p class="text-h3" style="margin-top: 1%">资讯头条</p>
    <CasurolAuto v-model:slide="props.slide" :autoplay="props.autoplay" />
    <NewsList />
    <ContainerM />
    
  </div>
</template>

<script setup>
import CasurolAuto from 'src/components/CasurolAuto.vue'
import { reactive } from 'vue'
import ContainerM from 'src/components/ContainerM.vue'
import NewsList from 'src/components/NewsList.vue'

const props = reactive({
  autoplay: true,
  slide: 1,
})
</script>
