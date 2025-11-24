<template>
  <p class="text-h3">处理成功</p>
  <q-btn icon="sym_o_home" label="返回首页" @click="toHome"></q-btn>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
const toHome = () => {
  router.push({ name: 'HomeM' })
}
</script>
