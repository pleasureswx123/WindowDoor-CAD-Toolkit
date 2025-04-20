<template>
  <div class="material-stats-container">
    <h3 class="stats-title">窗户材料用量统计</h3>
    
    <!-- 过滤器和操作区域 -->
    <div class="filter-area">
      <el-select v-model="filter" placeholder="按类别筛选" clearable>
        <el-option
          v-for="item in categoryOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button type="primary" @click="calculateMaterials">刷新统计</el-button>
      <el-button @click="exportToExcel">导出所有数据</el-button>
    </div>
    
    <!-- 统计表格 -->
    <el-table
      :data="filteredMaterialStats"
      border
      stripe
      style="width: 100%"
      max-height="400px"
      :summary-method="getSummaries"
      show-summary
    >
      <el-table-column prop="category" label="类别" width="150" />
      <el-table-column prop="size" label="尺寸" />
      <el-table-column prop="quantity" label="数量" width="100" />
      <el-table-column prop="length" label="总长度(mm)" width="120" v-if="showLength" />
      <el-table-column prop="area" label="面积(m²)" width="120" v-if="showArea" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRootWindowStore } from '@/stores/rootWindowStore';
import { WindowStructure, WindowFrame, WindowEmptyArea, WindowMuntin, WindowSash, WindowSashFrame, WindowSashGlass } from '@/utils/RootWindow';
import * as ExcelJS from 'exceljs';
import { ElMessage } from 'element-plus';

// 定义材料统计项数据结构
interface MaterialItem {
  id: string;
  category: string;
  size: string;
  quantity: number;
  length?: number;
  area?: number;
}

// 过滤选项
const filter = ref('');
const categoryOptions = [
  { value: '窗户外框', label: '窗户外框' },
  { value: '中挺', label: '中挺' },
  { value: '窗扇窗框', label: '窗扇窗框' },
  { value: '窗扇玻璃', label: '窗扇玻璃' }
];

// 材料统计数据
const materialStats = ref<MaterialItem[]>([]);
const showLength = ref(true);
const showArea = ref(true);

// 过滤后的材料统计数据
const filteredMaterialStats = computed(() => {
  if (!filter.value) {
    return materialStats.value;
  }
  return materialStats.value.filter(item => item.category === filter.value);
});

// 获取store实例
const windowStore = useRootWindowStore();

// 计算材料用量
function calculateMaterials() {
  const stats: MaterialItem[] = [];
  const materialsMap = new Map<string, MaterialItem>();
  
  if (!windowStore.windowStructure) {
    return;
  }
  
  const windowStructure = windowStore.windowStructure;
  
  // 统计窗户外框 - 分别统计上下和左右
  const frameThickness = windowStructure.frameSize;
  
  // 左右框 - 检查宽度是否为0
  if (windowStructure.width > 0 && frameThickness > 0) {
    const frameWidthKey = `窗户外框-${frameThickness}mm × ${windowStructure.width}mm`;
    materialsMap.set(frameWidthKey, {
      id: frameWidthKey,
      category: '窗户外框',
      size: `${frameThickness}mm × ${windowStructure.width}mm`,
      quantity: 2, // 左右两条
      length: windowStructure.width * 2,
      area: 0
    });
  }
  
  // 上下框 - 检查高度是否为0
  if (windowStructure.height > 0 && frameThickness > 0) {
    const frameHeightKey = `窗户外框-${frameThickness}mm × ${windowStructure.height}mm`;
    materialsMap.set(frameHeightKey, {
      id: frameHeightKey,
      category: '窗户外框',
      size: `${frameThickness}mm × ${windowStructure.height}mm`,
      quantity: 2, // 上下两条
      length: windowStructure.height * 2,
      area: 0
    });
  }
  
  // 递归统计所有空白区域中的中挺和窗扇
  function traverseArea(area: WindowEmptyArea, depth: number = 0) {
    // 如果有窗扇，统计窗扇框和玻璃
    if (area.sash) {
      const sash = area.sash;
      
      // 窗扇框架 - 分别统计上下和左右
      if (sash.frame) {
        const frameThickness = sash.frameSize;
        
        // 左右窗扇框 - 检查宽度是否为0
        if (sash.width > 0 && frameThickness > 0) {
          const sashFrameWidthKey = `窗扇窗框-${frameThickness}mm × ${sash.width}mm`;
          if (materialsMap.has(sashFrameWidthKey)) {
            const item = materialsMap.get(sashFrameWidthKey)!;
            item.quantity += 2; // 增加2条
            item.length! += sash.width * 2;
          } else {
            materialsMap.set(sashFrameWidthKey, {
              id: sashFrameWidthKey,
              category: '窗扇窗框',
              size: `${frameThickness}mm × ${sash.width}mm`,
              quantity: 2, // 左右两条
              length: sash.width * 2,
              area: 0
            });
          }
        }
        
        // 上下窗扇框 - 检查高度是否为0
        if (sash.height > 0 && frameThickness > 0) {
          const sashFrameHeightKey = `窗扇窗框-${frameThickness}mm × ${sash.height}mm`;
          if (materialsMap.has(sashFrameHeightKey)) {
            const item = materialsMap.get(sashFrameHeightKey)!;
            item.quantity += 2; // 增加2条
            item.length! += sash.height * 2;
          } else {
            materialsMap.set(sashFrameHeightKey, {
              id: sashFrameHeightKey,
              category: '窗扇窗框',
              size: `${frameThickness}mm × ${sash.height}mm`,
              quantity: 2, // 上下两条
              length: sash.height * 2,
              area: 0
            });
          }
        }
      }
      
      // 窗扇玻璃 - 检查宽度和高度是否为0
      if (sash.glass && sash.glass.width > 0 && sash.glass.height > 0) {
        const glass = sash.glass;
        const glassSize = `${glass.width}mm × ${glass.height}mm`;
        const key = `窗扇玻璃-${glassSize}`;
        
        if (materialsMap.has(key)) {
          const item = materialsMap.get(key)!;
          item.quantity += 1;
          item.area! += (glass.width * glass.height) / 1000000; // 转换为平方米
        } else {
          materialsMap.set(key, {
            id: key,
            category: '窗扇玻璃',
            size: glassSize,
            quantity: 1,
            length: 0,
            area: (glass.width * glass.height) / 1000000 // 转换为平方米
          });
        }
      }
    }
    
    // 如果有子元素，递归统计
    if (area.children && area.children.length > 0) {
      for (const child of area.children) {
        if (child instanceof WindowMuntin) {
          // 统计中挺 - 检查长度是否为0
          const direction = child.direction;
          const thickness = child.thickness;
          const length = direction === 'horizontal' ? child.width : child.height;
          
          if (length > 0 && thickness > 0) {
            const muntinSize = `${thickness}mm × ${length}mm (${direction === 'horizontal' ? '水平' : '垂直'})`;
            const key = `中挺-${muntinSize}`;
            
            if (materialsMap.has(key)) {
              const item = materialsMap.get(key)!;
              item.quantity += 1;
              item.length! += length;
            } else {
              materialsMap.set(key, {
                id: key,
                category: '中挺',
                size: muntinSize,
                quantity: 1,
                length: length,
                area: 0
              });
            }
          }
        } else if (child instanceof WindowEmptyArea) {
          // 递归统计子区域
          traverseArea(child, depth + 1);
        }
      }
    }
  }
  
  // 从主空白区域开始递归统计
  traverseArea(windowStructure.mainArea);
  
  // 转换Map为数组并过滤掉厚度为0的项
  materialStats.value = Array.from(materialsMap.values()).filter(item => {
    // 从尺寸中提取厚度值
    const thicknessMatch = item.size.match(/^(\d+)mm/);
    const thickness = thicknessMatch ? parseInt(thicknessMatch[1]) : 0;
    
    // 过滤条件：厚度大于0
    return thickness > 0;
  });
}

// 计算表格汇总行
function getSummaries(param: any) {
  const { columns, data } = param;
  const sums: any[] = [];
  
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = '合计';
      return;
    }
    
    const values = data.map((item: any) => Number(item[column.property]));
    
    if (!values.every((value: any) => isNaN(value))) {
      const sum = values.reduce((prev: number, curr: number) => {
        const value = Number(curr);
        if (!isNaN(value)) {
          return prev + value;
        } else {
          return prev;
        }
      }, 0);
      
      if (column.property === 'quantity') {
        sums[index] = sum;
      } else if (column.property === 'length') {
        sums[index] = `${sum.toFixed(0)}mm`;
      } else if (column.property === 'area') {
        sums[index] = `${sum.toFixed(2)}m²`;
      } else {
        sums[index] = '-';
      }
    } else {
      sums[index] = '-';
    }
  });
  
  return sums;
}

// 导出数据到Excel
async function exportToExcel() {
  try {
    // 创建工作簿和工作表
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('窗户材料统计');
    
    // 设置列宽
    worksheet.columns = [
      { header: '类别', key: 'category', width: 15 },
      { header: '尺寸', key: 'size', width: 30 },
      { header: '数量', key: 'quantity', width: 10 },
      { header: '总长度(mm)', key: 'length', width: 15 },
      { header: '面积(m²)', key: 'area', width: 15 },
    ];
    
    // 添加大标题
    worksheet.insertRow(1, []);
    worksheet.insertRow(1, []);
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = '窗户材料用量统计表';
    titleRow.height = 30;
    worksheet.mergeCells('A1:E1');
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF92CDDC' }
    };
    
    // 添加副标题（导出时间）
    const dateRow = worksheet.getRow(2);
    dateRow.getCell(1).value = `导出时间：${new Date().toLocaleString()}`;
    worksheet.mergeCells('A2:E2');
    dateRow.font = { size: 11 };
    dateRow.alignment = { vertical: 'middle', horizontal: 'center' };
    dateRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDAEEF3' }
    };
    
    // 设置表头样式 (现在是第3行)
    const headerRow = worksheet.getRow(3);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // 按类别分组数据
    const categories = [...new Set(materialStats.value.map(item => item.category))];
    let currentRow = 4; // 从第4行开始（前3行是标题和表头）
    let totalQuantity = 0;
    let totalLength = 0;
    let totalArea = 0;
    
    // 类别颜色映射
    const categoryColors: Record<string, string> = {
      '窗户外框': 'FFF2F2F2',
      '中挺': 'FFEAF8FF',
      '窗扇窗框': 'FFFFF8E6',
      '窗扇玻璃': 'FFF5F5F5'
    };
    
    // 为每个类别添加数据
    categories.forEach((category, index) => {
      // 添加类别标题行
      const categoryHeaderRow = worksheet.addRow({
        category: `【${category}】`
      });
      currentRow++;
      
      // 设置类别标题样式
      categoryHeaderRow.font = { bold: true, size: 12 };
      categoryHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD0D0D0' }
      };
      
      // 添加类别数据
      const categoryItems = materialStats.value.filter(item => item.category === category);
      
      // 统计当前类别的小计
      const categoryQuantity = categoryItems.reduce((sum, item) => sum + item.quantity, 0);
      const categoryLength = categoryItems.reduce((sum, item) => sum + (item.length || 0), 0);
      const categoryArea = categoryItems.reduce((sum, item) => sum + (item.area || 0), 0);
      
      // 累加总计
      totalQuantity += categoryQuantity;
      totalLength += categoryLength;
      totalArea += categoryArea;
      
      // 添加每个类别的数据行
      categoryItems.forEach(item => {
        const row = worksheet.addRow({
          category: item.category,
          size: item.size,
          quantity: item.quantity,
          length: item.length || 0,
          area: item.area || 0
        });
        currentRow++;
        
        // 设置数据行背景色
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: categoryColors[category] || 'FFFFFFFF' }
        };
      });
      
      // 添加类别小计行
      const subtotalRow = worksheet.addRow({
        category: `${category}小计`,
        quantity: categoryQuantity,
        length: categoryLength,
        area: categoryArea.toFixed(2)
      });
      currentRow++;
      
      // 设置小计行样式
      subtotalRow.font = { bold: true };
      subtotalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDFEAFF' }
      };
      
      // 如果不是最后一个类别，添加空行
      if (index < categories.length - 1) {
        worksheet.addRow({});
        currentRow++;
      }
    });
    
    // 添加总计行
    const totalRow = worksheet.addRow({
      category: '总计',
      quantity: totalQuantity,
      length: totalLength,
      area: totalArea.toFixed(2)
    });
    
    // 设置总计行样式
    totalRow.font = { bold: true, size: 12 };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFB8CCE4' }
    };
    
    // 添加页脚信息
    worksheet.addRow({});
    const footerRow = worksheet.addRow(['本表格由窗户设计系统自动生成']);
    worksheet.mergeCells(`A${footerRow.number}:E${footerRow.number}`);
    footerRow.font = { italic: true, color: { argb: 'FF808080' } };
    footerRow.alignment = { horizontal: 'center' };
    
    // 设置数字格式
    worksheet.getColumn('length').numFmt = '0.00';
    worksheet.getColumn('area').numFmt = '0.00';
    
    // 添加边框
    for (let i = 1; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }
    
    // 生成二进制数据并创建Blob
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // 创建下载链接并触发下载
    const fileName = `窗户材料统计_${new Date().toISOString().split('T')[0]}.xlsx`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 显示成功提示
    ElMessage.success('导出成功');
    
  } catch (error) {
    console.error('导出Excel时发生错误:', error);
    ElMessage.error('导出失败，请稍后再试');
  }
}

// 监听窗户结构变化，自动更新统计
watch(() => windowStore.windowStructure, () => {
  calculateMaterials();
}, { deep: true });

// 初始化时计算一次
onMounted(() => {
  calculateMaterials();
});
</script>

<style scoped>
.material-stats-container {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-width: 100%;
}

.stats-title {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
  text-align: center;
}

.filter-area {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

:deep(.el-table) {
  --el-table-header-bg-color: #f0f2f5;
  --el-table-row-hover-bg-color: #f5f7fa;
}

:deep(.el-table__footer) {
  font-weight: bold;
  background-color: #edf0f5;
}
</style> 