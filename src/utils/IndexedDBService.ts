import { v4 as uuidv4 } from 'uuid';

// IndexedDB数据库名称和版本
const DB_NAME = 'windowDoorDesignDB';
const DB_VERSION = 1;
const WINDOW_STORE_NAME = 'windowDesigns';

// 窗户设计接口
export interface WindowDesign {
  id: string;
  name: string;
  width: number;
  height: number;
  frameSize: number;
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string; // 可选的缩略图数据URL
  data: any; // 窗户结构数据
}

// 打开IndexedDB数据库
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('打开数据库失败:', event);
      reject(new Error('无法打开数据库'));
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 创建存储窗户设计的对象存储
      if (!db.objectStoreNames.contains(WINDOW_STORE_NAME)) {
        const store = db.createObjectStore(WINDOW_STORE_NAME, { keyPath: 'id' });
        
        // 创建索引
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        
        console.log('创建了窗户设计对象存储');
      }
    };
  });
}

// 保存窗户设计
export async function saveWindowDesign(design: Omit<WindowDesign, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
  const db = await openDB();
  
  try {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(WINDOW_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(WINDOW_STORE_NAME);
      
      // 判断是新增还是更新
      const isUpdate = !!design.id;
      
      // 准备要保存的设计数据
      const designToSave: WindowDesign = {
        ...design,
        id: design.id || uuidv4(), // 如果没有ID，则生成新的UUID
        createdAt: isUpdate ? (design as any).createdAt : new Date(),
        updatedAt: new Date()
      };
      
      // 保存到数据库
      const request = store.put(designToSave);
      
      request.onerror = (event) => {
        console.error('保存窗户设计失败:', event);
        reject(new Error('保存窗户设计失败'));
      };
      
      request.onsuccess = () => {
        console.log(`窗户设计${isUpdate ? '更新' : '保存'}成功:`, designToSave.id);
        resolve(designToSave.id);
      };
    });
  } finally {
    db.close();
  }
}

// 获取窗户设计列表
export async function getWindowDesignList(): Promise<WindowDesign[]> {
  const db = await openDB();
  
  try {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(WINDOW_STORE_NAME, 'readonly');
      const store = transaction.objectStore(WINDOW_STORE_NAME);
      const index = store.index('updatedAt'); // 使用更新时间索引，最新的排在前面
      
      const request = index.openCursor(null, 'prev'); // 倒序
      const designs: WindowDesign[] = [];
      
      request.onerror = (event) => {
        console.error('获取窗户设计列表失败:', event);
        reject(new Error('获取窗户设计列表失败'));
      };
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        
        if (cursor) {
          designs.push(cursor.value);
          cursor.continue();
        } else {
          resolve(designs);
        }
      };
    });
  } finally {
    db.close();
  }
}

// 根据ID获取窗户设计
export async function getWindowDesignById(id: string): Promise<WindowDesign | null> {
  const db = await openDB();
  
  try {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(WINDOW_STORE_NAME, 'readonly');
      const store = transaction.objectStore(WINDOW_STORE_NAME);
      const request = store.get(id);
      
      request.onerror = (event) => {
        console.error('获取窗户设计失败:', event);
        reject(new Error('获取窗户设计失败'));
      };
      
      request.onsuccess = (event) => {
        const design = (event.target as IDBRequest<WindowDesign>).result;
        resolve(design || null);
      };
    });
  } finally {
    db.close();
  }
}

// 删除窗户设计
export async function deleteWindowDesign(id: string): Promise<void> {
  const db = await openDB();
  
  try {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(WINDOW_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(WINDOW_STORE_NAME);
      const request = store.delete(id);
      
      request.onerror = (event) => {
        console.error('删除窗户设计失败:', event);
        reject(new Error('删除窗户设计失败'));
      };
      
      request.onsuccess = () => {
        console.log('窗户设计删除成功:', id);
        resolve();
      };
    });
  } finally {
    db.close();
  }
}

// 获取缩略图
export function generateThumbnail(canvas: HTMLCanvasElement): string {
  // 创建临时canvas用于生成缩略图
  const tempCanvas = document.createElement('canvas');
  const maxThumbSize = 200; // 最大缩略图尺寸
  
  // 计算缩略图尺寸，保持宽高比
  let thumbWidth, thumbHeight;
  if (canvas.width > canvas.height) {
    thumbWidth = maxThumbSize;
    thumbHeight = (canvas.height / canvas.width) * maxThumbSize;
  } else {
    thumbHeight = maxThumbSize;
    thumbWidth = (canvas.width / canvas.height) * maxThumbSize;
  }
  
  // 设置临时canvas尺寸
  tempCanvas.width = thumbWidth;
  tempCanvas.height = thumbHeight;
  
  // 绘制缩略图
  const ctx = tempCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, thumbWidth, thumbHeight);
    
    // 返回数据URL
    return tempCanvas.toDataURL('image/png');
  }
  
  return '';
} 