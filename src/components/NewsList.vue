<template>
  <div class="list-container" style="width: 56%; margin-top: 2%">
    <div class="list-row" v-for="(row, rowIndex) in rows" :key="rowIndex">
      <div
        class="list-item"
        v-for="(item, colIndex) in row"
        :key="colIndex"
        @click="toSearch(colIndex)"
        style="cursor: pointer"
      >
        <q-icon :name="item.icon" size="32px" color="primary" style="margin-right: 2%" />
        <div class="item-label" style="margin: 0%">{{ item.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const items = [
  { icon: 'sym_o_layers', label: '宇树王兴兴的“硬核”志愿填报建议火了' },
  { icon: 'sym_o_layers', label: '等了30年，微软MS-DOS神器重生' },
  { icon: 'sym_o_layers', label: 'Python 现在可以运行 Mojo 了' },
  { icon: 'sym_o_layers', label: '如何高效训练通义万相2.1的LoRA：从原理到实战指南' },
  // 可继续添加
]

// 每行2个
const rows = []
for (let i = 0; i < items.length; i += 2) {
  rows.push(items.slice(i, i + 2))
}

// 新增跳转方法
function toSearch(index) {
  router.push({
    name: 'ArticlePage',
    params: {
      id: index + 4,
    },
  })
}
</script>

<style scoped>
.list-container {
  width: 100%;
}
.list-row {
  display: flex;
  margin-bottom: 16px;
}
.list-item {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 0;
  background: #f5f5f7;
  border-radius: 8px;
  margin-right: 12px;
}
.list-item:last-child {
  margin-right: 0;
}
.item-label {
  margin-top: 8px;
  font-size: 16px;
  color: #333;
}
</style>
