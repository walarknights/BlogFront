<template>
  <div>
    <div class="comment-item" :class="{ 'is-reply': isReply }">
      <div class="comment-header" style="height: 60%">
        <div class="row" style="align-items: center; gap: 10px; height: 100%; margin-bottom: 10px">
          <img
            :src="comment.userAvatar"
            alt="..."
            style="border-radius: 50%; height: 3rem; width: 3rem; cursor: pointer"
            @click="toPersonal"
          />
          <strong class="user-name">{{ comment.userName }}</strong>
        </div>
        <span class="timestamp">{{ formattedTimestamp }}</span>
      </div>
      <div
        class="comment-content row"
        style="border: 2px solid aquamarine; border-radius: 2%; height: 30%; align-items: center"
      >
        <span v-if="comment.parentUser && isReply" class="reply-to">
          回复 @{{ comment.parentUser.UserName }}:
        </span>
        <div style="padding: 10px">
          {{ comment.content }}
        </div>
      </div>
      <div class="comment-actions" style="height: 10%">
        <button @click="Reply">回复</button>
      </div>
      <div
        v-if="props.replyActiveId === props.comment.commentId"
        class="row commentReply"
        style="justify-content: space-around"
      >
        <img
          :src="comment.userAvatar"
          alt="..."
          style="border-radius: 50%; height: 3rem; width: 3rem"
          @click="toPersonal"
        />
        <div class="column" style="width: 80%">
          <q-input
            v-model="content"
            placeholder="输入评论内容..."
            :autofocus="true"
            ref="replyInput"
            style="margin-bottom: 8px"
          ></q-input>
          <q-btn @click="submitComment" style="width: 20%; margin-left: 80%"> 回复 </q-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useUserStore } from 'src/stores/useStore'
import { useQuasar } from 'quasar'
import api from 'src/utils/axios'
const q = useQuasar()
const userStore = useUserStore()

const emit = defineEmits(['comment-posted', 'reply-to'])
const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  isReply: {
    type: Boolean,
    default: false,
  },
  replyActiveId: {
    type: Number,
    default: null,
  },
  articleId: {
    type: Number,
    required: true,
  },
})

const router = useRouter()
const toPersonal = () => {
  console.log(props.comment.userId)

  router.push({
    name: 'Personal',
    params: {
      userId: props.comment.userId,
    },
  })
}
const formattedTimestamp = computed(() => {
  return new Date(props.comment.createdAt).toLocaleString()
})

const content = ref('')
const replyInput = ref(null)

const Reply = () => {
  emit('reply-to', props.comment.commentId, props.comment.userName)
}

const submitComment = async () => {
  if (!content.value.trim()) {
    q.notify({
      type: 'warning',
      message: '评论不能为空',
    })
    return true
  }
  if (!userStore.isLogIn) {
    q.notify({
      type: 'warning',
      message: '请先登录',
    })
    return true
  }
  const commentData = {
    articleId: Number(props.articleId),
    userId: userStore.userId,

    content: content.value.trim(),
    parentId: props.replyActiveId ? Number(props.replyActiveId) : null,
  }
  console.log(commentData)
  try {
    await api.post(`/article/addComment/${commentData.articleId}`, commentData)

    content.value = ''
    emit('comment-posted')
  } catch (error) {
    console.error('Failed to post comment:', error)
    alert('评论失败，请稍后再试。')
  }
}

watch(
  () => props.replyActiveId,
  (val) => {
    if (val === props.comment.commentId) {
      nextTick(() => {
        if (replyInput.value) replyInput.value.focus()
      })
    }
  },
)
</script>

<style scoped>
.comment-item {
  border: 1px solid #eee;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  background-color: #fff;
}
.comment-item.is-reply {
  margin-left: 30px; /* 子楼评论缩进 */
  background-color: #f9f9f9;
  border-left: 3px solid #007bff;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}
.user-name {
  font-weight: bold;
  color: #333;
}
.timestamp {
  font-size: 0.8em;
  color: #777;
}
.comment-content {
  margin-bottom: 8px;
  word-wrap: break-word;
}
.reply-to {
  color: #007bff;
  margin-right: 5px;
}
.comment-actions button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9em;
}
.comment-actions button:hover {
  background-color: #0056b3;
}
</style>
