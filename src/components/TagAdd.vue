<template>
  <div
    class="column"
    style="background-color: white; width: 60%; padding-top: 1%; padding-bottom: 1%"
  >
    <div class="row flex-center" style="width: 100%; margin-bottom: 2%">
      <p style="padding-left: 1%; margin-right: 2%">文章标签</p>
      <q-select
        filled
        v-model="model"
        multiple
        use-input
        :options="options"
        @new-value="addOption"
        new-value-mode="add"
        counter
        max-values="7"
        hint="最多可以选择7个标签（可直接在对话框内输入标签，按下enter完成录入）"
        style="width: 60%; padding-left: 1%"
      />
    </div>

    <div class="row flex-center" style="width: 100%; margin-bottom: 2%">
      <p style="margin-right: 10%">封面上传</p>
      <q-uploader
        ref="coverUploader"
        field-name="file"
        style="max-width: 300px"
        :label="uploaderLabel"
        multiple
        accept=".jpg, image/*"
        max-file-size="20971520"
        max-files="1"
        :auto-upload="false"
        :hide-upload-btn="true"
        @added="onCoverAdded"
        @removed="onCoverRemoved"
      />
    </div>
    <div class="row flex-center" style="width: 100%; margin-bottom: 2%">
      <p style="margin-right: 4%">文章摘要</p>
      <q-input
        filled
        v-model="abstract"
        label="摘要"
        :dense="true"
        style="width: 56%"
        :rules="[
          (val) => (val && val.length >= 4) || '摘要不能少于4个字',
          (val) => (val && val.length <= 150) || '摘要不能超过150个字',
        ]"
      />
    </div>
    <div class="q-pa-lg row flex-center" style="width: 100">
      <p style="margin: 0%; margin-right: 10%">文章类型</p>
      <q-option-group v-model="group" :options="articleType" color="primary" :inline="false" />
    </div>
    <div v-if="group === 'op2'" class="row flex-center" style="width: 100%; margin-bottom: 2%">
      <p style="margin-right: 4%">转载链接</p>
      <q-input filled v-model="link" label="转载链接" :dense="true" style="width: 56%" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const props = defineProps({
  modelValueTags: Array,
  modelValueType: String,
  modelValueAbstract: String,
})
const emit = defineEmits([
  'update:tags',
  'update:type',
  'update:abstract',
  'update:link',
  'cover-uploaded',
])

const uploaderLabel = computed(() => {
  return $q.screen.width < 600 ? '上传封面' : '必须上传封面(图片不能超过20MB)'
})

const model = ref(props.modelValueTags || [])
const group = ref(props.modelValueType || '')
const abstract = ref(props.modelValueAbstract || '')
const link = ref('') // 新增：用于绑定转载链接输入框
const coverUploader = ref(null)

// 让 options 响应式
const options = ref([
  {
    label: 'python',
    value: 'python',
  },
  {
    label: 'javascript',
    value: 'javascript',
  },
  {
    label: 'java',
    value: 'java',
  },
  {
    label: 'c++',
    value: 'c++',
  },
  {
    label: 'c#',
    value: 'c#',
  },
  {
    label: '开发工具',
    value: '开发工具',
  },
  {
    label: '数据结构与算法',
    value: '数据结构与算法',
  },
  {
    label: '大数据',
    value: '大数据',
  },
  {
    label: '前端',
    value: '前端',
  },
  {
    label: '后端',
    value: '后端',
  },
])

// 添加自定义选项的方法
function addOption(val, done) {
  if (val && !options.value.some((opt) => opt.value === val)) {
    options.value.push({ label: val, value: val })
  }
  done(val)
}

const articleType = ref([
  {
    label: '原创',
    value: 'op1',
  },
  {
    label: '转载',
    value: 'op2',
  },
])

watch(model, (val) => emit('update:tags', val))
watch(group, (val) => emit('update:type', val))
watch(abstract, (val) => emit('update:abstract', val))
watch(link, (val) => emit('update:link', val))

function onCoverAdded(files) {
  if (files.length > 0) {
    // 修改：传递 true 和文件对象
    emit('cover-uploaded', true, files[0])
  }
}

function onCoverRemoved() {
  // 新增：移除文件时通知父组件
  emit('cover-uploaded', false, null)
}

// 页面初始化时也判断一次
onMounted(() => {
  if (coverUploader.value) {
    emit('cover-uploaded', coverUploader.value.files && coverUploader.value.files.length > 0)
  }
})
</script>
<style>
.q-uploader {
  width: 15rem;
}

@media screen and (max-width: 600px) {
  .q-uploader {
    width: 5rem;
  }
}
</style>
