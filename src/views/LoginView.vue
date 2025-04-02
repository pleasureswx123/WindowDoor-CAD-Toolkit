<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">
        <h2>登录</h2>
        <div class="toggle-link">
          还没有账号？ <router-link to="/register">立即注册</router-link>
        </div>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        label-position="top"
      >
        <el-form-item prop="username" label="用户名">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item prop="password" label="密码">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item prop="code" label="验证码">
          <div class="captcha-container">
            <el-input
              v-model="loginForm.code"
              placeholder="请输入验证码"
              prefix-icon="Key"
              clearable
              @keyup.enter="handleLogin"
            />
            <div class="captcha-img" @click="refreshCaptcha">
              <img :src="captcha.captchaUrl" alt="验证码" v-if="captcha.captchaUrl">
              <div class="captcha-loading" v-else>
                <el-icon><Loading /></el-icon>
              </div>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <div class="other-login">
          <span>其他登录方式：</span>
          <div class="social-icons">
            <el-tooltip content="微信登录" placement="top">
              <Icon icon="ri:wechat-fill" class="social-icon" />
            </el-tooltip>
            <el-tooltip content="QQ登录" placement="top">
              <Icon icon="ri:qq-fill" class="social-icon" />
            </el-tooltip>
            <el-tooltip content="钉钉登录" placement="top">
              <Icon icon="ri:dingding-fill" class="social-icon" />
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores/userStore';
import { User, Lock, Key, Loading } from '@element-plus/icons-vue';
import { Icon } from '@iconify/vue';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

// 登录表单
const loginFormRef = ref();
const loginForm = reactive({
  username: '',
  password: '',
  code: '',
  uuid: ''
});

// 验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3到20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6到20个字符之间', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码长度在4到6个字符之间', trigger: 'blur' }
  ]
};

// 记住我
const rememberMe = ref(false);

// 加载状态
const loading = ref(false);

// 验证码
const captcha = reactive({
  captchaUrl: '',
  uuid: ''
});

// 获取验证码
async function getCaptcha() {
  try {
    const res = await userStore.getCaptcha();
    captcha.captchaUrl = res.captchaUrl;
    captcha.uuid = res.uuid;
    loginForm.uuid = res.uuid;
  } catch (error) {
    ElMessage.error('获取验证码失败');
  }
}

// 刷新验证码
function refreshCaptcha() {
  captcha.captchaUrl = '';
  getCaptcha();
}

// 处理登录
async function handleLogin() {
  try {
    await loginFormRef.value.validate();
    
    loading.value = true;
    
    try {
      await userStore.login(loginForm);
      ElMessage.success('登录成功');
      
      // 如果有重定向地址，跳转到重定向地址
      const redirect = route.query.redirect as string;
      router.replace(redirect || '/');
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败');
      refreshCaptcha();
    } finally {
      loading.value = false;
    }
  } catch (error) {
    console.log('登录表单验证失败', error);
  }
}

// 页面加载时获取验证码
onMounted(() => {
  getCaptcha();
});
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #24243e, #302b63, #0f0c29);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 450px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  padding: 40px;
  transition: all 0.3s ease;
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
}

.login-title h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.toggle-link {
  font-size: 14px;
  color: #666;
}

.toggle-link a {
  color: #4facfe;
  text-decoration: none;
  font-weight: 500;
}

.toggle-link a:hover {
  text-decoration: underline;
}

.login-form {
  margin-bottom: 20px;
}

.captcha-container {
  display: flex;
  gap: 10px;
}

.captcha-img {
  width: 120px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  overflow: hidden;
}

.captcha-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 20px;
  color: #999;
}

.login-button {
  width: 100%;
  padding: 12px 0;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.other-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #666;
  font-size: 14px;
}

.social-icons {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.social-icon {
  font-size: 24px;
  color: #555;
  cursor: pointer;
  transition: color 0.3s;
}

.social-icon:hover {
  color: #4facfe;
}

@media (max-width: 480px) {
  .login-box {
    padding: 25px;
  }
  
  .login-title h2 {
    font-size: 24px;
  }
  
  .captcha-container {
    flex-direction: column;
  }
  
  .captcha-img {
    width: 100%;
  }
}
</style> 