<template>
  <div class="q-pa-md" style="padding: 0%; width: 100%">
    <q-toolbar
      class="row no-wrap"
      style="justify-content: space-around; height: 100%; padding: 0%; width: 100%"
    >
      <q-avatar @click="toHome">
        <img src="https://cdn.quasar.dev/logo-v2/svg/logo.svg" />
      </q-avatar>

      <q-tabs style="margin-left: 0px; margin-right: 20% !important">
        <q-tab name="images" label="首页" @click="toHome" />
        >
      </q-tabs>
      <q-input
        outlined
        v-model="text"
        style="flex-grow: 1; width: 40% !important"
        @keyup.enter="onSearch"
      >
        <q-icon
          name="sym_o_search"
          color="white"
          style="height: 100%"
          size="40px"
          class="cursor-pointer"
        />
      </q-input>
      <q-btn icon="sym_o_search" @click="onSearch" color="primary" flat />

      <q-tabs v-model="tab" style="margin-left: 20%">
        <q-tab name="images" label="创作中心" @click="toCreateCenter" />
      </q-tabs>

      <div class="avatar-container">
        <AvatarLogin style="margin-right: 50%" />
      </div>
      <Menu_avatar />
    </q-toolbar>
  </div>
</template>

<script setup lang="ts">
import Menu_avatar from './MenuAvatar.vue'
import AvatarLogin from './AvatarLogin.vue'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const tab = ref<string>('images')

const toHome = () => {
  router.push({ name: 'HomeM' })
}

const toCreateCenter = () => {
  router.push({ name: 'Create' })
}

const text = ref('')

const onSearch = () => {
  if (text.value && text.value.trim() !== '') {
    router.push({ name: 'SearchPage', query: { q: text.value.trim() } })
  }
}
</script>
