<template>
  <div class="comment-form">
    <h4>
      {{ formTitle }}
      <span v-if="replyingToUser" class="replying-to-user">@{{ replyingToUser }}</span>
    </h4>
    <textarea v-model="content" placeholder="输入评论内容..." rows="3"></textarea>
    <div class="form-actions">
      <button @click="submitComment" :disabled="!content.trim()">提交评论</button>
      <button v-if="parentId" @click="cancelReply" class="cancel-btn">取消回复</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

import { storeToRefs } from 'pinia'
import { useUserStore } from 'src/stores/useStore'

import api from 'src/utils/axios'
import { useQuasar } from 'quasar'
const q = useQuasar()
const props = defineProps({
  articleId: {
    type: Number,
    required: true,
  },
  replyingToUser: {
    // 被回复的用户名，用于显示
    type: String,
    default: '',
  },
  parentId: {
    // 如果是回复评论，则传入被回复评论的ID
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['comment-posted', 'cancel-reply'])

const content = ref('')
// 模拟当前登录用户，实际项目中应从状态管理或认证中获取
const userStore = useUserStore()
const currentUser = storeToRefs(userStore)

const formTitle = computed(() => {
  return props.parentId ? `回复 ${props.replyingToUser || '评论'}` : '发表评论'
})

const submitComment = async () => {
  if (!content.value.trim()) return
  if (!currentUser.isLogIn.value) {
    q.notify({
      type: 'warn',
      message: '请先登录',
    })
    return true
  }
  const commentData = {
    articleId: Number(props.articleId),
    userId: currentUser.userId.value,
    userName: currentUser.username.value,
    userAvatar: currentUser.avatar.value,
    content: content.value.trim(),
    parentId: null,
  }

  try {
    await api.post(`/article/addComment/${commentData.articleId}`, commentData)
    content.value = ''
    emit('comment-posted')
  } catch (error) {
    console.error('Failed to post comment:', error)
    alert('评论失败，请稍后再试。')
  }
}

const cancelReply = () => {
  emit('cancel-reply')
  content.value = '' // 清空输入框
}

// 当 parentId 变化时 (例如从回复主楼切换到回复子楼，或取消回复)，可以聚焦输入框
watch(
  () => props.parentId,
  () => {
    // 可以添加 textarea.focus() 逻辑，如果需要的话
  },
)
</script>

<style scoped>
.comment-form {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f8f9fa;
  margin-bottom: 20px;
}
.comment-form h4 {
  margin-top: 0;
  margin-bottom: 10px;
}
.replying-to-user {
  color: #007bff;
  font-weight: normal;
}
.comment-form textarea {
  width: calc(100% - 20px); /* 减去padding */
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 3px;
  resize: vertical;
}
.form-actions {
  display: flex;
  gap: 10px;
}
.comment-form button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 3px;
  cursor: pointer;
}
.comment-form button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.comment-form button.cancel-btn {
  background-color: #6c757d;
}
.comment-form button.cancel-btn:hover {
  background-color: #5a6268;
}
.comment-form button:hover:not(:disabled) {
  background-color: #218838;
}
</style>
