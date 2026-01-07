<template>
  <div class="q-pa-md q-gutter-sm column" style="width: 100%; align-items: center">
    <p class="text-h3">创作博客</p>
    <q-input
      v-model="title"
      label="请输入标题"
      outlined
      style="font-family: '微软雅黑', Arial, sans-serif; font-size: 24px; font-weight: bold"
      :rules="[
        (val) => (val && val.length >= 4) || '标题不能少于4个字',
        (val) => (val && val.length <= 100) || '标题不能超过100个字',
      ]"
    />
    <q-editor
      style="height: 55vh; width: 100%"
      content-style="height: 90%; overflow-y: auto;"
      v-model="qeditor"
      label="内容"
      :dense="$q.screen.lt.md"
      :toolbar="[
        [
          {
            label: $q.lang.editor.align,
            icon: $q.iconSet.editor.align,
            fixedLabel: true,
            list: 'only-icons',
            options: ['left', 'center', 'right', 'justify'],
          },
        ],
        ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
        ['token', 'hr', 'link', 'custom_btn'],
        ['print', 'fullscreen'],
        [
          {
            label: $q.lang.editor.formatting,
            icon: $q.iconSet.editor.formatting,
            list: 'no-icons',
            options: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code'],
          },
          {
            label: $q.lang.editor.fontSize,
            icon: $q.iconSet.editor.fontSize,
            fixedLabel: true,
            fixedIcon: true,
            list: 'no-icons',
            options: ['size-1', 'size-2', 'size-3', 'size-4', 'size-5', 'size-6', 'size-7'],
          },
          {
            label: $q.lang.editor.defaultFont,
            icon: $q.iconSet.editor.font,
            fixedIcon: true,
            list: 'no-icons',
            options: [
              'default_font',
              'arial',
              'arial_black',
              'comic_sans',
              'courier_new',
              'impact',
              'lucida_grande',
              'times_new_roman',
              'verdana',
              '黑体',
              'microsoft_yahei',
              'fangsong',
              'kaiti',
              'lishu',
              'hwxh',
              'hwzs',
              'hwkt',
              'stsong',
              'stheiti',
              'stfangsong',
            ],
          },
          'removeFormat',
        ],
        ['quote', 'unordered', 'ordered', 'outdent', 'indent'],

        ['undo', 'redo'],
        ['viewsource'],
      ]"
      :fonts="{
        default_font: '默认字体',
        arial: 'Arial',
        arial_black: 'Arial Black',
        comic_sans: 'Comic Sans MS',
        courier_new: 'Courier New',
        impact: 'Impact',
        lucida_grande: 'Lucida Grande',
        times_new_roman: 'Times New Roman',
        verdana: 'Verdana',
        黑体: '黑体',
        microsoft_yahei: '微软雅黑',
        fangsong: '仿宋',
        kaiti: '楷体',
        lishu: '隶书',
        hwxh: '华文细黑',
        hwzs: '华文中宋',
        hwkt: '华文楷体',
        stsong: '华文宋体',
        stheiti: '华文黑体',
        stfangsong: '华文仿宋',
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps({
  modelValueTitle: String,
  modelValueContent: String,
})
const emit = defineEmits(['update:title', 'update:content'])

const title = ref(props.modelValueTitle || '')
const qeditor = ref(props.modelValueContent || '')

watch(title, (val) => emit('update:title', val))
watch(qeditor, (val) => emit('update:content', val))
</script>

<style scoped></style>
