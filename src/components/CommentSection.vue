<template>
  <div class="comment-section">
    <h2>评论区 ({{ totalCommentsCount }})</h2>

    <CommentForm
      :article-id
      @comment-posted="handleCommentPosted"
      @cancel-reply="clearReply"
      ref="commentFormRef"
    />

    <div v-if="loading" class="loading">加载评论中...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="!loading && !error && mainComments.length === 0" class="no-comments">
      暂无评论，快来抢沙发吧！
    </div>

    <div v-for="mainComment in mainComments" :key="mainComment.Id" class="main-comment-thread">
      <CommentItem
        :comment="mainComment"
        :reply-active-id="replyActiveId"
        :article-id="articleId"
        @reply-to="prepareReply"
        @comment-posted="handleCommentPosted"
      />

      <!-- 子楼评论区 -->
      <div
        v-if="replies[mainComment.commentId] && replies[mainComment.commentId].length > 0"
        class="sub-comment-area"
      >
        <CommentItem
          v-for="reply in replies[mainComment.commentId]"
          :key="reply.id"
          :comment="reply"
          :article-id="articleId"
          :is-reply="true"
          :reply-active-id="replyActiveId"
          @reply-to="prepareReply"
          @comment-posted="handleCommentPosted"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import CommentItem from './CommentItem.vue'
import CommentForm from './CommentForm.vue'
import api from 'src/utils/axios'
import { useRoute } from 'vue-router'
const route = useRoute()
const articleId = parseInt(route.params.id, 10)

const allComments = ref([])
const loading = ref(true)
const error = ref(null)
const commentFormRef = ref(null) // 用于引用表单组件，方便聚焦等操作

const replyingTo = ref({
  parentId: null, // 被回复的评论 ID
  userName: '', // 被回复的用户名
})

const replyActiveId = ref(null)

const fetchComments = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await api.get(`/article/${articleId}/comments`)
    allComments.value = response.data
  } catch (err) {
    console.error('Failed to fetch comments:', err)
    error.value = '加载评论失败，请稍后再试。'
    allComments.value = [] // 清空旧数据以防显示错误
  } finally {
    loading.value = false
  }
}

onMounted(fetchComments)

// 计算主楼评论
const mainComments = computed(() => {
  if (!allComments.value) return []
  return allComments.value
    .filter((comment) => comment.rootId === comment.commentId || !comment.rootId) // 主楼评论 rootId 等于自身 id 或为 null
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // 按时间倒序
})

// 计算每个主楼下的所有回复（包括回复主楼和回复子楼的）
const replies = computed(() => {
  if (!allComments.value) {
    console.log('无评论数据')
    return {}
  }

  console.log('所有评论:', allComments.value) // 调试日志

  const groupedReplies = {}
  // 修改筛选逻辑：找出所有非主楼的评论
  const subComments = allComments.value.filter((comment) => {
    const isReply = comment.rootId && comment.commentId !== comment.rootId

    return isReply
  })

  subComments.forEach((reply) => {
    if (!groupedReplies[reply.rootId]) {
      groupedReplies[reply.rootId] = []
    }
    groupedReplies[reply.rootId].push(reply)
  })

  // 对每个主楼下的回复按时间排序
  Object.keys(groupedReplies).forEach((rootId) => {
    groupedReplies[rootId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  })

  return groupedReplies
})

const totalCommentsCount = computed(() => allComments.value?.length || 0)

const prepareReply = (commentIdToReply, userNameToReply) => {
  replyingTo.value = { parentId: commentIdToReply, userName: userNameToReply }
  replyActiveId.value = commentIdToReply
  // 滚动到评论框并聚焦 (可选)
}

const clearReply = () => {
  replyingTo.value = { parentId: null, userName: '' }
  replyActiveId.value = null
}

const handleCommentPosted = () => {
  clearReply() // 清除回复状态
  fetchComments() // 重新加载评论
}
</script>

<style scoped>
.comment-section {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f0f2f5;
  border-radius: 8px;
}
.comment-section h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
  margin-bottom: 20px;
}
.loading,
.error,
.no-comments {
  text-align: center;
  padding: 20px;
  color: #777;
}
.error {
  color: red;
}
.main-comment-thread {
  margin-bottom: 20px;
}
.sub-comment-area {
  /* padding-left: 20px; */ /* CommentItem 内部已经有 margin-left for isReply */
  margin-top: 10px;
  /* border-left: 2px solid #e0e0e0; */ /* 可选的视觉分隔 */
}
</style>
