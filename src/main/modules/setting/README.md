# 用户设置模块 (Setting Module)

## 1. 核心职责
本模块主要负责管理和持久化用户的应用程序设置。它通过 `infra/sql` 模块与数据库交互，确保用户偏好（如预览方式、复制模板、主页路径等）能够被保存和读取。

主要功能包括：
- 获取当前应用设置，提供默认值。
- 更新全部或部分设置。
- 单独设置主页路径。

## 2. 关键文件索引
- [setting.service.ts](setting.service.ts): 包含所有设置管理的业务逻辑函数 (`get`, `set`, `setHome`)。

## 3. 核心逻辑图解

### 数据流向图
```mermaid
flowchart LR
    Client[调用方] -->|get()| Service[Setting Service]
    Client -->|set()| Service
    Client -->|setHome()| Service
    
    Service -->|读/写| DB[(Database/SQL Infra)]
    
    subgraph SettingData [设置数据结构]
        pixel
        previewType
        copyTemplateId
        copyWorkflowId
        homePath
    end
    
    DB -.-> SettingData
```

### 接口定义 (TypeScript)
```typescript
interface Setting {
    pixel: number;          // 像素相关设置
    previewType: number;    // 预览类型
    copyTemplateId: number; // 复制模板 ID
    copyWorkflowId: number; // 复制工作流 ID
    homePath: string;       // 主页路径
}
```

## 4. 注意事项
- 所有操作均依赖 `defaultAppId`，意味着设置是绑定在当前默认应用上下文中的。
- `get()` 方法会返回默认值，如果数据库中不存在设置记录。
- 修改 `Database['setting']` 类型定义时，需同步更新此处的默认值逻辑。
