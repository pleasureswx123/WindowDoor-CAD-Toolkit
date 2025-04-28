<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-title">
        <h2>注册</h2>
        <div class="toggle-link">
          已有账号？ <router-link to="/login">立即登录</router-link>
        </div>
      </div>

      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" class="register-form"
        label-position="left" label-width="80px">
        <el-form-item prop="username" label="手机号">
          <el-input v-model="registerForm.username" placeholder="请输入手机号" prefix-icon="User" clearable />
        </el-form-item>

        <el-form-item prop="password" label="密码">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password
            clearable />
        </el-form-item>

        <el-form-item prop="confirmPassword" label="确认密码">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" prefix-icon="Lock"
            show-password clearable />
        </el-form-item>

        <el-form-item prop="code" label="验证码">
          <div class="captcha-container">
            <el-input v-model="registerForm.code" placeholder="请输入验证码" prefix-icon="Key" clearable
              @keyup.enter="handleRegister" />
            <div class="captcha-img" @click="refreshCaptcha">
              <img :src="captcha.captchaUrl" alt="验证码" v-if="captcha.captchaUrl">
              <div class="captcha-loading" v-else>
                <el-icon>
                  <Loading />
                </el-icon>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="agreement" @change="validateAgreement">
            我已阅读并同意 <a href="javascript:void(0)" @click="showAgreement">《用户协议》</a> 和 <a href="javascript:void(0)"
              @click="showPrivacy">《隐私政策》</a>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" class="register-button" @click="handleRegister">
            注册
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../stores/userStore';
import { Icon } from '@iconify/vue';

const userStore = useUserStore();
const router = useRouter();

// 注册表单
const registerFormRef = ref();
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  code: '',
  uuid: ''
});

// 验证密码是否一致
const validatePass = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'));
  } else {
    callback();
  }
};

// 验证规则
const registerRules = {
  username: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6到20个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass, trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
};

// 同意协议
const agreement = ref(false);

// 验证协议
const validateAgreement = () => {
  if (!agreement.value) {
    ElMessage.warning('请先阅读并同意用户协议和隐私政策');
    return false;
  }
  return true;
};

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
    captcha.captchaUrl = 'data:image/png;base64,' + (res.img ?? '');
    captcha.uuid = res.uuid ?? '';
    registerForm.uuid = res.uuid ?? '';
  } catch (error) {
    ElMessage.error('获取验证码失败');
  }
}

// 刷新验证码
function refreshCaptcha() {
  captcha.captchaUrl = '';
  getCaptcha();
}

// 处理注册
async function handleRegister() {
  // 检查协议
  if (!validateAgreement()) return;
  
  try {
    await registerFormRef.value.validate();
    
    loading.value = true;
    
    try {
      await userStore.register(registerForm);
      ElMessage.success('注册成功，请登录');
      router.push('/login');
    } catch (error: any) {
      ElMessage.error(error.message || '注册失败');
      refreshCaptcha();
    } finally {
      loading.value = false;
    }
  } catch (error) {
    console.log('注册表单验证失败', error);
  }
}

// 显示用户协议
function showAgreement() {
  ElMessageBox.alert(
    '欢迎使用门窗设计系统！请仔细阅读以下协议内容，使用本系统即表示您同意遵守以下条款...',
    '用户协议',
    {
      confirmButtonText: '我已阅读',
      dangerouslyUseHTMLString: true,
      closeOnClickModal: false,
      center: true
    }
  );
}

// 显示隐私政策
function showPrivacy() {
  ElMessageBox.alert(
    '本系统重视您的个人隐私保护。我们会收集必要的信息以提供服务，但不会将您的个人信息泄露给任何未授权的第三方...',
    '隐私政策',
    {
      confirmButtonText: '我已阅读',
      dangerouslyUseHTMLString: true,
      closeOnClickModal: false,
      center: true
    }
  );
}

// 页面加载时获取验证码
onMounted(() => {
  getCaptcha();
});
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #24243e, #302b63, #0f0c29);
  padding: 20px;
}

.register-box {
  width: 100%;
  max-width: 450px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  padding: 40px;
  transition: all 0.3s ease;
}

.register-title {
  text-align: center;
  margin-bottom: 30px;
}

.register-title h2 {
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

.register-form {
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

.register-button {
  width: 100%;
  padding: 12px 0;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  border: none;
  transition: all 0.3s ease;
}

.register-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

a {
  color: #4facfe;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.register-footer {
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
  .register-box {
    padding: 25px;
  }
  
  .register-title h2 {
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