declare module './cache.js' {
  interface SessionCache {
    set(key: string, value: any): void;
    get(key: string): any;
    setJSON(key: string, jsonValue: any): void;
    getJSON(key: string): any;
    remove(key: string): void;
  }

  interface LocalCache {
    set(key: string, value: any): void;
    get(key: string): any;
    setJSON(key: string, jsonValue: any): void;
    getJSON(key: string): any;
    remove(key: string): void;
  }

  interface Cache {
    session: SessionCache;
    local: LocalCache;
  }

  const cache: Cache;
  export default cache;
} 