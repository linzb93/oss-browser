# History 模块说明文档

## 1. 核心职责

History 模块负责管理和持久化对象存储（OSS）的操作历史记录。主要功能包括：

- **记录操作**：自动记录文件的上传（新增）和删除操作。
- **数据查询**：提供分页查询接口，支持按时间倒序查看历史记录。
- **数据同步**：监听 OSS 模块的事件流，自动同步操作记录。
- **性能优化**：采用“内存缓存 + 定时刷盘”策略，减少频繁的数据库 I/O 操作。

## 2. 关键文件索引

- [history.service.ts](file:///Users/linzhibin/Documents/GitHub/oss-browser/src/main/modules/history/history.service.ts): 核心业务逻辑实现。
  - 维护内存中的历史记录缓存 (`cachedHistory`)。
  - 实现数据持久化逻辑 (`flush`, `ensureLoaded`)。
  - 监听 `ossEvents` 并响应 `add`/`remove` 事件。

## 3. 核心逻辑图解

### 3.1 数据加载与刷盘机制

该模块通过维护一个脏标记 (`isDirty`) 和定时器 (`flushTimer`) 来批量写入数据库，避免高频写入。

```mermaid
flowchart TD
    A[外部请求/事件] --> B{操作类型}
    B -- add/remove --> C[更新内存缓存 cachedHistory]
    C --> D[标记 isDirty = true]
    D --> E{是否存在定时器?}
    E -- 否 --> F[启动 2秒 定时器]
    E -- 是 --> G[等待定时器触发]
    F --> H(定时器触发)
    H --> I{isDirty?}
    I -- 是 --> J[写入数据库]
    J --> K[重置 isDirty = false]
    I -- 否 --> L[结束]
    
    subgraph 读取流程
    Q[查询请求] --> R{检查当前 AppId}
    R -- 变更/未加载 --> S[从数据库加载]
    S --> T[更新缓存]
    T --> U[返回内存数据]
    R -- 无变更 --> U
    end
```

### 3.2 OSS 事件响应时序图

History 模块并不直接被 Controller 调用，而是通过订阅 OSS 模块的事件来被动更新。

```mermaid
sequenceDiagram
    participant OSS as OSS Repository
    participant History as History Service
    participant DB as SQLite Database

    Note over OSS, History: 初始化阶段
    History->>OSS: 订阅 ossEvents ('add', 'remove')
    History->>DB: ensureLoaded() 预加载数据

    Note over OSS, History: 文件上传场景
    OSS->>OSS: 文件上传成功
    OSS->>History: emit('add', { prefix, names })
    History->>History: 解析路径，生成记录
    History->>History: 更新内存缓存
    History->>History: 调度 flush()
    
    Note over History, DB: 2秒后 (异步)
    History->>DB: 持久化数据 (flush)
```

## 4. 注意事项

1. **数据隔离**：历史记录是基于 `appId` 进行隔离的。在 `ensureLoaded` 中会检查 `currentAppId`，如果发生变化会重新加载数据。
2. **单例模式**：模块内的状态（`cachedHistory`, `currentAppId` 等）是模块级变量，这意味着该服务在主进程中是单例运行的。
3. **事件依赖**：强依赖 `../../infra/sql` 进行数据库操作，以及 `../oss/oss.repository` 中的 `ossEvents` 进行事件通信。
4. **路径处理**：在记录路径时，会自动将反斜杠转换为斜杠 (`slash`) 并处理路径拼接。

