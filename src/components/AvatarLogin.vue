<template>
  <div class="avatar-container">
    <img
      :src="'http://localhost:8010' + userStore.avatar"
      alt="用户头像"
      class="avatar-image"
      @click="toggleLoginDialog"
      style="object-fit: cover"
    />
    <LoginDialog :show="showLoginDialog" @close="showLoginDialog = false" @transData="setinfor" />

    <!-- 用户卡片 -->
    <div class="user-card">
      <!-- 用户卡片头部 -->
      <div class="user-card-header">
        <q-avatar size="60px">
          <img :src="'http://localhost:8010' + userStore.avatar" />
        </q-avatar>
        <div class="user-name">{{ username || '未登录' }}</div>
        <!-- 添加未登录提示 -->
      </div>

      <!-- 用户数据统计 -->
      <div class="user-stats">
        <div class="stat-item">
          <div class="stat-number">{{ following }}</div>
          <div class="stat-label">关注</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ followers }}</div>
          <div class="stat-label">粉丝</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ dynamicNum }}</div>
          <div class="stat-label">博客数</div>
        </div>
      </div>

      <!-- 用户操作按钮 -->
      <div class="user-actions" v-if="userStore.isLoggedIn">
        <!-- 只在登录后显示操作按钮 -->
        <q-btn
          flat
          dense
          color="primary"
          class="full-width q-mb-xs text-left action-btn"
          align="left"
          icon="sym_o_background_replace"
          @click="toPersonal"
          >个人主页</q-btn
        >
        <q-btn
          flat
          dense
          color="accent"
          class="full-width q-mb-xs text-left action-btn"
          align="left"
          icon="sym_o_graph_6"
          >博客</q-btn
        >
        <q-btn
          flat
          dense
          color="accent"
          class="full-width q-mb-xs text-left action-btn"
          align="left"
          icon="sym_o_settings"
          @click="toSetting"
          >设置</q-btn
        >
        <q-separator class="q-my-sm" />
        <q-btn
          flat
          dense
          color="negative"
          class="full-width text-left action-btn"
          align="left"
          @click="logout"
          icon="sym_o_logout"
          >退出登录</q-btn
        >
      </div>
      <div class="user-actions" v-else>
        <!-- 未登录时提示 -->
        <q-btn color="primary" class="full-width" @click="toggleLoginDialog">请先登录</q-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from 'src/stores/useStore'
import LoginDialog from './LoginDialog.vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
const router = useRouter()
const userStore = useUserStore()
const q = useQuasar()
const showLoginDialog = ref(false)
const toPersonal = () => {
  router
    .push({
      name: 'Personal',
      params: {
        userId: userStore.userId,
      },
    })
    .then(() => {
      // 跳转后刷新页面
      window.location.reload()
    })
}

const toSetting = () => {
  if (!userStore.isLoggedIn) {
    q.notify({
      type: 'warning',
      color: 'red',
      message: '请先登录',
    })
  }
  router.push({
    name: 'Setting',
    params: {
      userId: userStore.userId,
    },
  })
}

// 使用 computed 属性，直接从 userStore 获取信息
const username = computed(() => (userStore.isLoggedIn ? userStore.username || '用户名' : '未登录'))
const followers = computed(() => (userStore.isLoggedIn ? userStore.followers || 0 : 0))
const following = computed(() => (userStore.isLoggedIn ? userStore.following || 0 : 0))
const dynamicNum = computed(() => (userStore.isLoggedIn ? userStore.dynamic || 0 : 0))

const toggleLoginDialog = () => {
  // 点击头像时，如果未登录则弹出登录框，如果已登录可以考虑跳转个人主页或不操作
  if (!userStore.isLoggedIn) {
    showLoginDialog.value = true
  } else {
    // 可选：已登录时点击头像的行为，例如跳转到个人主页
    // router.push('/user-profile');
    console.log('已登录，点击头像')
  }
}

const logout = async () => {
  try {
    // 清除本地存储的 token
    localStorage.removeItem('authToken')
    // 重置用户状态
    userStore.logout()
    // 显示成功提示
    console.log('退出成功')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}
</script>

<style scoped>
.avatar-container {
  position: relative; /* 父容器相对定位，为子元素的绝对定位提供基准 */
  display: inline-block; /* 让容器只包裹内容大小 */
}

.avatar-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  object-fit: cover; /* 确保图片完整显示 */
  display: block; /* 避免图片下方有空隙 */
}

.user-card {
  position: absolute;
  top: 100%;
  left: 50%;

  margin-top: 4px;
  width: 300px;
  z-index: 100;

  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 16px;
  box-sizing: border-box;

  /* --- 默认隐藏和过渡效果 --- */
  opacity: 0;
  visibility: hidden; /* 使用 visibility 配合 opacity 实现动画和可访问性 */
  transform: translateX(-50%) translateY(-10px); /* 初始向上移一点 */
  transition:
    opacity 0.2s ease-in-out,
    visibility 0.2s ease-in-out,
    transform 0.2s ease-in-out;
  pointer-events: none; /* 隐藏时不可交互 */
}

/* --- 悬停显示 --- */
.avatar-container:hover .user-card {
  opacity: 1;
  visibility: visible;
  transform: translateX(-80%) translateY(0); /* 恢复正常位置 */
  pointer-events: auto; /* 显示时可交互 */
}

/* --- 卡片内部样式 (根据需要调整) --- */
.user-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.user-name {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
  margin-bottom: 16px;
}

.stat-item {
  padding: 0 10px;
}

.stat-number {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.user-actions {
  margin-top: 10px;
}

/* 调整按钮样式，使其更像菜单项 */
.action-btn {
  justify-content: flex-start; /* 图标和文字靠左 */
  padding: 8px 12px; /* 调整内边距 */
  text-transform: none; /* 取消大写转换 */
  font-weight: normal; /* 正常字重 */
  font-size: 14px; /* 调整字体大小 */
}
.action-btn:hover {
  background-color: #f5f5f5; /* 添加悬停背景色 */
}
</style>
