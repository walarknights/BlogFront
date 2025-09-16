<template>
  <q-btn flat round dense icon="sym_o_menu">
    <q-menu>
      <q-list style="min-width: 100px">
        <q-item clickable v-close-popup @click="toFavorite">
          <q-item-section>收藏</q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="toHistory">
          <q-item-section>历史</q-item-section>
        </q-item>
        <q-item clickable v-close-popup>
          <q-item-section>创作中心</q-item-section>
        </q-item>
        <q-separator />
      </q-list>
    </q-menu>
  </q-btn>
</template>
<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from 'src/stores/useStore'
const userStore = useUserStore()
const router = useRouter()
const toFavorite = () => {
  router
    .push({
      name: 'Favorite',
      params: {
        userId: userStore.userId,
      },
    })
    .then(() => {
      window.location.reload()
    })
}
const toHistory = () => {
  router
    .push({
      name: 'History',
      params: {
        userId: userStore.userId,
      },
    })
    .then(() => {
      window.location.reload()
    })
}
</script>
