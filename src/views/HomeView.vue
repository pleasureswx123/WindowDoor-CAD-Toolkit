<template>
  <div class="home-container">
    <!-- 视频展示区域 -->
    <div class="video-showcase">
      <div class="video-container">
        <div class="video-aspect-ratio">
          <video ref="videoElement" class="demo-video" controls preload="metadata"
            poster="https://static-origin.yanlingxinrui.com/window-door-assets/video-poster.png"
            @play="isVideoPlaying = true" @pause="isVideoPlaying = false" @ended="isVideoPlaying = false">
            <source src="https://static-origin.yanlingxinrui.com/window-door-assets/Google%20Chrome.mp4"
              type="video/mp4">
            您的浏览器不支持视频播放
          </video>
          <div class="video-overlay" :class="{ 'hidden': isVideoPlaying }">
            <div class="play-button" @click="playVideo">
              <el-icon><icon-play /></el-icon>
            </div>
          </div>
        </div>
      </div>
      <div class="video-description">
        <h2>专业门窗设计工具演示</h2>
        <p>观看演示视频，了解如何使用我们的门窗设计工具进行高效设计与优化</p>
      </div>
    </div>

    <!-- 在这个地方增加演示视频区域 https://static-origin.yanlingxinrui.com/window-door-assets/Google%20Chrome.mp4 16:9 -->

    <!-- Token状态悬浮组件 -->
    <!-- <div v-if="userStore.isLoggedIn" class="token-status-card">
      <h3>登录状态</h3>
      <div class="token-info">
        <p>
          <strong>用户名:</strong> {{ userStore.username }}
        </p>
        <p>
          <strong>状态:</strong> 
          <el-tag type="success" v-if="userStore.isLoggedIn">已登录</el-tag>
          <el-tag type="danger" v-else>未登录</el-tag>
        </p>
        <p>
          <strong>过期时间:</strong> {{ tokenExpireTimeFormatted }}
        </p>
        <p>
          <strong>剩余时间:</strong> {{ remainingTimeFormatted }}
        </p>
        
        <el-button type="warning" size="small" @click="testExpiration">
          测试: 10秒后过期
        </el-button>
      </div>
    </div> -->

    <!-- 几何形状背景的顶部横幅 -->
    <div class="hero-section">
      <div class="hero-geometric-shapes">
        <!-- 几何形状元素 -->
        <div class="elegant-shape large-shape shape-1"></div>
        <div class="elegant-shape medium-shape shape-2"></div>
        <div class="elegant-shape small-shape shape-3"></div>
        <div class="elegant-shape tiny-shape shape-4"></div>
        <div class="elegant-shape medium-shape shape-5"></div>
      </div>

      <div class="hero-content">
        <div class="badge animate-fade-in">
          <div class="badge-circle"></div>
          <span>优质门窗解决方案</span>
        </div>

        <h1 class="animate-fade-in">
          <span class="title-gradient">门窗设计与优化</span>
          <br />
          <span class="title-highlight">解决方案</span>
        </h1>

        <p class="animate-fade-in">一站式门窗设计、玻璃切割和型材优化工具，提升效率，降低成本</p>

        <div class="hero-buttons animate-fade-in">
          <el-button type="primary" size="large" class="primary-btn" @click="navigateTo('/design')">
            <el-icon>
              <IconWindow />
            </el-icon>开始设计
          </el-button>
          <el-button size="large" class="secondary-btn" @click="scrollToFeatures">
            <el-icon>
              <IconArrowDown />
            </el-icon>了解更多
          </el-button>
        </div>
      </div>

      <!-- 渐变叠加层 -->
      <div class="gradient-overlay"></div>
    </div>

    <!-- 功能区域 -->
    <div class="features-section" ref="featuresSection">
      <h2 class="section-title animate-on-scroll">主要功能</h2>
      <div class="features-grid">
        <div class="feature-card animate-on-scroll" @click="navigateTo('/design')">
          <div class="feature-icon">
            <IconWindow />
          </div>
          <h3>门窗设计</h3>
          <p>可视化设计门窗结构，支持各种类型的窗户样式和开启方式</p>
          <el-button type="primary" class="feature-btn">立即设计</el-button>
        </div>

        <div class="feature-card animate-on-scroll" @click="navigateTo('/glass')">
          <div class="feature-icon">
            <IconGlass />
          </div>
          <h3>玻璃切割优化</h3>
          <p>智能计算最佳玻璃切割方案，提高材料利用率，降低成本</p>
          <el-button type="primary" class="feature-btn">开始优化</el-button>
        </div>

        <div class="feature-card animate-on-scroll" @click="navigateTo('/plastic-steel')">
          <div class="feature-icon">
            <IconRuler />
          </div>
          <h3>型材切割优化</h3>
          <p>塑钢型材智能切割方案，减少废料，提高效率</p>
          <el-button type="primary" class="feature-btn">开始计算</el-button>
        </div>
      </div>
    </div>

    <!-- 优势介绍 -->
    <div class="advantages-section">
      <h2 class="section-title animate-on-scroll">我们的优势</h2>
      <div class="advantages-grid">
        <div class="advantage-item animate-on-scroll">
          <div class="advantage-icon">
            <el-icon>
              <IconPrecision />
            </el-icon>
          </div>
          <div class="advantage-content">
            <h3>高精度计算</h3>
            <p>精确计算材料用量和切割方案，误差控制在毫米级</p>
          </div>
        </div>

        <div class="advantage-item animate-on-scroll">
          <div class="advantage-icon">
            <el-icon>
              <IconVisualization />
            </el-icon>
          </div>
          <div class="advantage-content">
            <h3>可视化设计</h3>
            <p>所见即所得的设计界面，直观呈现设计效果</p>
          </div>
        </div>

        <div class="advantage-item animate-on-scroll">
          <div class="advantage-icon">
            <el-icon>
              <Icon3D />
            </el-icon>
          </div>
          <div class="advantage-content">
            <h3>3D预览</h3>
            <p>支持3D模式预览窗户效果，更直观理解设计</p>
          </div>
        </div>

        <div class="advantage-item animate-on-scroll">
          <div class="advantage-icon">
            <el-icon>
              <IconOptimization />
            </el-icon>
          </div>
          <div class="advantage-content">
            <h3>智能优化</h3>
            <p>自动优化切割方案，最大化材料利用率</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速开始 -->
    <div class="quick-start-section">
      <h2 class="section-title animate-on-scroll">快速开始</h2>
      <div class="steps-container">
        <div class="step-item animate-on-scroll">
          <div class="step-number">1</div>
          <h3>选择功能</h3>
          <p>根据您的需要选择门窗设计、玻璃切割或型材优化功能</p>
        </div>
        <div class="step-connector"></div>
        <div class="step-item animate-on-scroll" style="animation-delay: 100ms">
          <div class="step-number">2</div>
          <h3>输入参数</h3>
          <p>输入窗户尺寸、材料规格等必要参数</p>
        </div>
        <div class="step-connector"></div>
        <div class="step-item animate-on-scroll" style="animation-delay: 200ms">
          <div class="step-number">3</div>
          <h3>获取结果</h3>
          <p>系统自动计算并生成设计图纸或切割方案</p>
        </div>
      </div>
      <div class="start-now animate-on-scroll">
        <el-button type="primary" size="large" class="primary-btn" @click="navigateTo('/design')">
          立即开始
        </el-button>
      </div>
    </div>

    <!-- 页脚 -->
    <footer class="app-footer">
      <p>© 2025 门窗设计工具 | 高效、精准的门窗设计与材料优化解决方案</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { checkLoginAndRedirect } from '../utils/auth';
import { useUserStore } from '../stores/userStore'
import { computed } from 'vue'
import { ElMessage } from 'element-plus'

const router = useRouter();
const featuresSection = ref<HTMLElement | null>(null);
const userStore = useUserStore()
const videoElement = ref<HTMLVideoElement | null>(null);
const isVideoPlaying = ref(false);

// 图标组件
const IconWindow = () => h(Icon, { icon: 'tabler:window', width: '24', height: '24' });
const IconGlass = () => h(Icon, { icon: 'tabler:glass-full', width: '24', height: '24' });
const IconRuler = () => h(Icon, { icon: 'tabler:ruler', width: '24', height: '24' });
const IconArrowDown = () => h(Icon, { icon: 'tabler:arrow-down', width: '24', height: '24' });
const IconPrecision = () => h(Icon, { icon: 'tabler:ruler-measure', width: '28', height: '28' });
const IconVisualization = () => h(Icon, { icon: 'tabler:eye', width: '28', height: '28' });
const Icon3D = () => h(Icon, { icon: 'tabler:cube', width: '28', height: '28' });
const IconOptimization = () => h(Icon, { icon: 'tabler:chart-pie', width: '28', height: '28' });
const IconPlay = () => h(Icon, { icon: 'tabler:player-play-filled', width: '48', height: '48' });

// 播放视频
const playVideo = () => {
  if (videoElement.value) {
    videoElement.value.play();
  }
};

// 监听视频播放状态
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
});

// 导航到指定路由（添加登录检查）
const navigateTo = (path: string) => {
  if (userStore.isLoggedIn || path === '/login') {
    router.push(path)
  } else {
    ElMessage.warning('请先登录')
    router.push('/login')
  }
};

// 滚动到功能区域
const scrollToFeatures = () => {
  featuresSection.value?.scrollIntoView({ behavior: 'smooth' });
};

// 格式化过期时间
const tokenExpireTimeFormatted = computed(() => {
  const expireTime = localStorage.getItem('tokenExpireTime')
  if (!expireTime) return '无'
  
  return new Date(parseInt(expireTime)).toLocaleString()
})

// 计算剩余有效时间
const remainingTimeFormatted = computed(() => {
  const expireTime = localStorage.getItem('tokenExpireTime')
  if (!expireTime) return '无'
  
  const remaining = parseInt(expireTime) - Date.now()
  if (remaining <= 0) return '已过期'
  
  // 转换为小时和分钟
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
  
  return `${hours}小时${minutes}分钟${seconds}秒`
})

// 测试token过期功能
const testExpiration = () => {
  if (userStore.setTokenToExpireSoon()) {
    ElMessage.success('Token将在10秒后过期，请留意登录状态变化')
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: #e0e0e0;
  overflow-x: hidden;
}

/* 视频展示区域 */
.video-showcase {
  max-width: 1200px;
  margin: 3rem auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.video-container {
  width: 100%;
  max-width: 1000px;
  background-color: #252525;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.video-container:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(79, 172, 254, 0.2);
}

.video-aspect-ratio {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 比例 */
  overflow: hidden;
}

.demo-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #000;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 1;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

/* 使用v-show根据isVideoPlaying状态控制覆盖层显示 */
.video-overlay.hidden {
  opacity: 0;
}

.play-button {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(3px);
  transition: all 0.3s ease;
  pointer-events: auto;
}

.play-button:hover {
  transform: scale(1.1);
  background: rgba(79, 172, 254, 0.8);
}

.video-description {
  text-align: center;
  max-width: 700px;
}

.video-description h2 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  background: linear-gradient(to right, #ffffff, #b3f0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.video-description p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-showcase {
    margin: 2rem auto;
    padding: 0 1rem;
  }
  
  .video-description h2 {
    font-size: 1.5rem;
  }
  
  .video-description p {
    font-size: 1rem;
  }
  
  .play-button {
    width: 60px;
    height: 60px;
  }
}

/* 几何形状的Hero部分 */
.hero-section {
  position: relative;
  height: 90vh;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  background-color: #030303;
  padding: 0 20px;
}

.hero-geometric-shapes {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.elegant-shape {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, hsla(217, 100%, 50%, 0.15) 10%, hsla(217, 100%, 50%, 0) 70%);
  backdrop-filter: blur(2px);
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px 0 rgba(255, 255, 255, 0.1);
  animation: float 12s infinite ease-in-out;
}

.elegant-shape::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.2), transparent 70%);
}

.large-shape {
  width: 600px;
  height: 140px;
  left: -10%;
  top: 15%;
  transform: rotate(12deg);
  animation-delay: 0.3s;
  background: radial-gradient(ellipse at center, hsla(228, 100%, 50%, 0.15) 10%, hsla(228, 100%, 50%, 0) 70%);
}

.medium-shape {
  width: 500px;
  height: 120px;
  right: -5%;
  top: 70%;
  transform: rotate(-15deg);
  animation-delay: 0.5s;
  background: radial-gradient(ellipse at center, hsla(340, 100%, 50%, 0.15) 10%, hsla(340, 100%, 50%, 0) 70%);
}

.small-shape {
  width: 300px;
  height: 80px;
  left: 5%;
  bottom: 5%;
  transform: rotate(-8deg);
  animation-delay: 0.4s;
  background: radial-gradient(ellipse at center, hsla(280, 100%, 50%, 0.15) 10%, hsla(280, 100%, 50%, 0) 70%);
}

.tiny-shape {
  width: 200px;
  height: 60px;
  right: 15%;
  top: 10%;
  transform: rotate(20deg);
  animation-delay: 0.6s;
  background: radial-gradient(ellipse at center, hsla(45, 100%, 50%, 0.15) 10%, hsla(45, 100%, 50%, 0) 70%);
}

.shape-5 {
  width: 150px;
  height: 40px;
  left: 20%;
  top: 5%;
  transform: rotate(-25deg);
  animation-delay: 0.7s;
  background: radial-gradient(ellipse at center, hsla(185, 100%, 50%, 0.15) 10%, hsla(185, 100%, 50%, 0) 70%);
}

@keyframes float {
  0% { transform: translateY(0) rotate(var(--rotate, 0deg)); }
  50% { transform: translateY(15px) rotate(var(--rotate, 0deg)); }
  100% { transform: translateY(0) rotate(var(--rotate, 0deg)); }
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, #030303, transparent 40%, #03030380);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 10;
  max-width: 800px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 9999px;
  margin-bottom: 32px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.badge-circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(240, 82, 82, 0.8);
}

.hero-content h1 {
  font-size: 3rem;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  font-weight: bold;
}

.title-gradient {
  background: linear-gradient(to bottom, #fff, rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-highlight {
  background: linear-gradient(to right, #4facfe, #00f2fe, #b3f0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-content p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.4);
  max-width: 550px;
  margin-left: auto;
  margin-right: auto;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding-top: 1rem;
}

.primary-btn {
  background: linear-gradient(to right, #4facfe, #00f2fe);
  border: none;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
  transition: all 0.3s ease;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 172, 254, 0.6);
}

.secondary-btn {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.secondary-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.section-title {
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2rem;
  position: relative;
  padding-bottom: 1rem;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background: linear-gradient(to right, #4facfe, #00f2fe);
}

.features-section {
  padding: 5rem 2rem;
  scroll-margin-top: 60px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background-color: #252525;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.3);
}

.feature-icon {
  background: linear-gradient(145deg, #2a2a2a, #1c1c1c);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  color: #4facfe;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #fff;
}

.feature-card p {
  margin-bottom: 1.5rem;
  color: #bbb;
  flex-grow: 1;
}

.feature-btn {
  background: transparent;
  border: 1px solid #4facfe;
  color: #4facfe;
  transition: all 0.3s ease;
}

.feature-btn:hover {
  background-color: #4facfe;
  color: #fff;
}

.advantages-section {
  padding: 5rem 2rem;
  background-color: #252525;
  position: relative;
  overflow: hidden;
}

.advantages-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 10% 90%, rgba(79, 172, 254, 0.1), transparent 40%);
  z-index: 0;
}

.advantages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.advantage-item {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(5px);
}

.advantage-icon {
  background: linear-gradient(145deg, #2a2a2a, #1c1c1c);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: #4facfe;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.advantage-content h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: #fff;
}

.advantage-content p {
  color: #bbb;
}

.quick-start-section {
  padding: 5rem 2rem;
  position: relative;
  overflow: hidden;
}

.quick-start-section::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 90% 20%, rgba(79, 172, 254, 0.1), transparent 40%);
  z-index: 0;
}

.steps-container {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 1000px;
  margin: 0 auto 3rem;
  flex-wrap: wrap;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.step-item {
  flex: 1;
  min-width: 250px;
  background-color: #252525;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.step-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.3);
}

.step-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin: 0 auto 1rem;
  box-shadow: 0 4px 10px rgba(79, 172, 254, 0.4);
}

.step-connector {
  width: 50px;
  height: 2px;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  flex-shrink: 0;
}

.step-item h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: #fff;
}

.step-item p {
  color: #bbb;
}

.start-now {
  text-align: center;
  margin-top: 3rem;
  position: relative;
  z-index: 1;
}

.app-footer {
  background-color: #252525;
  padding: 2rem;
  text-align: center;
  margin-top: 3rem;
  color: #888;
  position: relative;
}

/* 动画效果 */
.animate-fade-in {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeIn 0.8s forwards ease-out;
}

.hero-content h1 {
  animation-delay: 100ms;
}

.hero-content p {
  animation-delay: 200ms;
}

.hero-buttons {
  animation-delay: 300ms;
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.animate-on-scroll.in-view {
  opacity: 1;
  transform: translateY(0);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2.2rem;
  }
  
  .hero-content p {
    font-size: 1rem;
  }
  
  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .step-connector {
    transform: rotate(90deg);
    margin: 1rem 0;
  }
  
  .advantages-grid {
    grid-template-columns: 1fr;
  }
  
  .steps-container {
    flex-direction: column;
    align-items: center;
  }
  
  .step-item {
    width: 100%;
  }

  .elegant-shape {
    transform-origin: center;
    transform: scale(0.7);
  }
}

@media (max-width: 480px) {
  .hero-content h1 {
    font-size: 1.8rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .features-section, 
  .advantages-section, 
  .quick-start-section {
    padding: 3rem 1rem;
  }
  
  .feature-card {
    padding: 1.5rem;
  }

  .elegant-shape {
    transform-origin: center;
    transform: scale(0.5);
  }
}

/* Token状态卡片样式 */
.token-status-card {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: rgba(30, 30, 30, 0.9);
  border: 1px solid #444;
  border-radius: 8px;
  padding: 15px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  width: 260px;
  color: #e0e0e0;
}

.token-status-card h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
}

.token-info p {
  margin: 8px 0;
  font-size: 14px;
}

.token-status-card .el-button {
  margin-top: 10px;
  width: 100%;
}
</style>
