<template>
  <div class="feedback-container">
    <el-card class="feedback-form-card">
      <template #header>
        <div class="card-header">
          <h2>问题反馈</h2>
        </div>
      </template>
      
      <el-form ref="feedbackFormRef" :model="feedbackForm" :rules="formRules" label-width="100px">
        <el-form-item label="反馈类型" prop="feedbackType">
          <el-select v-model="feedbackForm.feedbackType" placeholder="请选择反馈类型">
            <el-option label="功能问题" value="1" />
            <el-option label="设计建议" value="2" />
            <el-option label="性能问题" value="3" />
            <el-option label="其他问题" value="0" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="feedbackForm.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述您遇到的问题"
          />
        </el-form-item>
        
        <el-form-item label="紧急程度" prop="priority">
          <el-select v-model="feedbackForm.priority" placeholder="请选择紧急程度">
            <el-option label="高" value="1" />
            <el-option label="中" value="2" />
            <el-option label="低" value="3" />
          </el-select>
        </el-form-item>
        
        <!-- <el-form-item label="问题截图">
          <el-upload
            class="feedback-upload"
            action="#"
            :http-request="uploadImageRequest"
            :on-remove="handleRemove"
            :on-preview="handlePreview"
            :on-exceed="handleExceed"
            :before-upload="beforeUpload"
            :limit="1"
            list-type="picture"
            accept=".jpg,.jpeg,.png,.gif"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传JPG/PNG文件，且不超过5MB
              </div>
            </template>
          </el-upload>
        </el-form-item> -->
        
        <el-form-item label="联系方式" prop="contact">
          <el-input
            v-model="feedbackForm.contact"
            placeholder="请留下您的联系方式，方便我们联系您"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">提交反馈</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="feedback-history-card">
      <template #header>
        <div class="card-header">
          <h2>历史反馈</h2>
          <el-button type="primary" size="small" @click="refreshList">刷新</el-button>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="feedbackList"
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="编号" width="80" />
        <el-table-column prop="feedbackType" label="反馈类型" width="100">
          <template #default="scope">
            <el-tag>
              {{ getFeedbackTypeName(scope.row.feedbackType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="问题描述" show-overflow-tooltip />
        <el-table-column prop="priority" label="紧急程度" width="100">
          <template #default="scope">
            <el-tag :type="getPriorityTagType(scope.row.priority)">
              {{ getPriorityName(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contact" label="联系方式" width="150" show-overflow-tooltip />
        <el-table-column prop="createTime" label="提交时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '0' ? 'warning' : 'success'">
              {{ scope.row.status === '0' ? '待处理' : '已处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button
              type="text"
              size="small"
              @click="viewFeedbackDetail(scope.row)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-if="total > 0"
        class="pagination"
        :current-page="queryParams.pageNum"
        :page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>
    
    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="反馈详情"
      width="600px"
      append-to-body
    >
      <div class="feedback-detail" v-if="currentFeedback">
        <div class="detail-item">
          <span class="label">反馈类型：</span>
          <div class="content">{{ getFeedbackTypeName(currentFeedback.feedbackType) }}</div>
        </div>
        <div class="detail-item">
          <span class="label">问题描述：</span>
          <div class="content">{{ currentFeedback.description }}</div>
        </div>
        <div class="detail-item">
          <span class="label">紧急程度：</span>
          <div class="content">{{ getPriorityName(currentFeedback.priority) }}</div>
        </div>
        <div class="detail-item" v-if="currentFeedback.imageUrl">
          <span class="label">问题截图：</span>
          <div class="content">
            <el-image
              :src="currentFeedback.imageUrl"
              :preview-src-list="[currentFeedback.imageUrl]"
              fit="contain"
              style="max-width: 100%; max-height: 300px;"
            />
          </div>
        </div>
        <div class="detail-item">
          <span class="label">联系方式：</span>
          <div class="content">{{ currentFeedback.contact }}</div>
        </div>
        <div class="detail-item">
          <span class="label">提交时间：</span>
          <div class="content">{{ currentFeedback.createTime }}</div>
        </div>
        <div class="detail-item" v-if="currentFeedback.replyContent">
          <span class="label">回复内容：</span>
          <div class="content">{{ currentFeedback.replyContent }}</div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listFeedback, addFeedback, getFeedback, uploadImage } from '@/api/feedback'

// 表单引用
const feedbackFormRef = ref()

// 表单数据
const feedbackForm = reactive({
  description: '',
  feedbackType: '1', // 默认为功能问题
  priority: '2', // 默认为中等紧急程度
  contact: '',
  imageUrl: '',
  file: null as File | null
})

// 表单校验规则
const formRules = {
  feedbackType: [
    { required: true, message: '请选择反馈类型', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请填写问题描述', trigger: 'blur' },
    { min: 5, max: 500, message: '问题描述长度在5到500个字符之间', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择紧急程度', trigger: 'change' }
  ],
  contact: [
    { required: true, message: '请填写联系方式', trigger: 'blur' },
    { max: 50, message: '联系方式长度不能超过50个字符', trigger: 'blur' }
  ]
}

// 获取反馈类型名称
const getFeedbackTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    '0': '其他问题',
    '1': '功能问题',
    '2': '设计建议',
    '3': '性能问题'
  }
  return typeMap[type] || '未知类型'
}

// 获取紧急程度名称
const getPriorityName = (priority: string) => {
  const priorityMap: Record<string, string> = {
    '1': '高',
    '2': '中',
    '3': '低'
  }
  return priorityMap[priority] || '未知'
}

// 获取紧急程度标签类型
const getPriorityTagType = (priority: string) => {
  const typeMap: Record<string, string> = {
    '1': 'danger',
    '2': 'warning',
    '3': 'info'
  }
  return typeMap[priority] || ''
}

// 上传图片请求
const uploadImageRequest = async (options: any) => {
  try {
    const res = await uploadImage(options.file)
    if (res.code === 200) {
      feedbackForm.imageUrl = res.data || res.url
      feedbackForm.file = options.file
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(res.msg || '图片上传失败')
    }
  } catch (error: any) {
    console.error('上传图片出错', error)
    ElMessage.error(error.message || '图片上传失败')
  }
}

// 删除图片
const handleRemove = () => {
  feedbackForm.imageUrl = ''
  feedbackForm.file = null
}

// 预览图片
const handlePreview = (file: any) => {
  const imageUrl = file.url || feedbackForm.imageUrl
  window.open(imageUrl)
}

// 超出上传限制
const handleExceed = () => {
  ElMessage.warning('最多只能上传1张图片')
}

// 上传前校验
const beforeUpload = (file: File) => {
  const isImage = /\.(jpg|jpeg|png|gif)$/.test(file.name.toLowerCase())
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传JPG/PNG/GIF格式的图片!')
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB!')
  }
  return isImage && isLt5M
}

// 提交表单
const submitForm = () => {
  feedbackFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const res = await addFeedback({
          feedbackType: feedbackForm.feedbackType,
          description: feedbackForm.description,
          priority: feedbackForm.priority,
          contact: feedbackForm.contact,
          imageUrl: feedbackForm.imageUrl,
          status: '0' // 默认状态为待处理
        })
        
        if (res.code === 200) {
          ElMessage.success('反馈提交成功，感谢您的反馈！')
          resetForm()
          getList() // 刷新列表
        } else {
          ElMessage.error(res.msg || '提交失败，请稍后重试')
        }
      } catch (error: any) {
        console.error('提交反馈出错', error)
        ElMessage.error(error.message || '提交失败，请稍后重试')
      }
    } else {
      return false
    }
  })
}

// 重置表单
const resetForm = () => {
  feedbackFormRef.value.resetFields()
  feedbackForm.imageUrl = ''
  feedbackForm.file = null
}

// 列表数据
const loading = ref(false)
const feedbackList = ref([])
const total = ref(0)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  description: '',
  status: ''
})

// 获取列表数据
const getList = async () => {
  loading.value = true
  try {
    const res = await listFeedback(queryParams)
    if (res.code === 200) {
      feedbackList.value = res.rows
      total.value = res.total
    } else {
      ElMessage.error(res.msg || '获取反馈列表失败')
    }
  } catch (error: any) {
    console.error('获取反馈列表出错', error)
    ElMessage.error(error.message || '获取反馈列表失败')
  } finally {
    loading.value = false
  }
}

// 刷新列表
const refreshList = () => {
  getList()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  getList()
}

// 页码变化
const handleCurrentChange = (page: number) => {
  queryParams.pageNum = page
  getList()
}

// 查看详情数据
const dialogVisible = ref(false)
const currentFeedback = ref(null)

// 查看详情
const viewFeedbackDetail = async (row: any) => {
  try {
    const res = await getFeedback(row.id)
    if (res.code === 200) {
      currentFeedback.value = res.data
      dialogVisible.value = true
    } else {
      ElMessage.error(res.msg || '获取反馈详情失败')
    }
  } catch (error: any) {
    console.error('获取反馈详情出错', error)
    ElMessage.error(error.message || '获取反馈详情失败')
  }
}

// 页面加载时获取数据
onMounted(() => {
  getList()
})
</script>

<style scoped>
.feedback-container {
  padding: 20px;
}

.feedback-form-card,
.feedback-history-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.feedback-upload {
  width: 100%;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.feedback-detail .detail-item {
  margin-bottom: 16px;
}

.feedback-detail .label {
  font-weight: bold;
  margin-right: 8px;
  vertical-align: top;
}

.feedback-detail .content {
  margin-top: 8px;
}
</style>