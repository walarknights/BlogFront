<template>
  <q-layout view="hHh Lpr lFr" style="border: none" class="full-height">
    <q-header style="width: 100%">
      <HeadLead />
    </q-header>

    <q-page-container style="width: 100vw">
      <router-view></router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import HeadLead from 'src/components/HeadLead.vue'
</script>
