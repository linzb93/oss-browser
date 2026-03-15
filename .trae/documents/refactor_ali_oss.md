# 将 Ali-OSS 依赖重构至基础设施层

本计划旨在将 `ali-oss` npm 包的直接依赖从 `src/main/modules/oss` 模块移除，并将其封装在 `src/main/infra/ali-oss` 基础设施层中，以实现业务逻辑与外部依赖的解耦。

## 实施步骤

### 1. 创建基础设施封装类

在 `src/main/infra/ali-oss` 中创建一个新的类 `AliOssClient`，用于封装 `ali-oss` SDK 的操作。

* **文件**: `src/main/infra/ali-oss/client.ts` (新建)

* **内容**:

  * 引入 `ali-oss` 包。

  * 定义并导出 `AliOssClient` 类。

  * 实现 `Impl.ts` 和 `oss.service.ts` 中所需的以下方法：

    * `constructor(options)`: 初始化客户端。

    * `listV2(params)`: 获取文件列表（对应 `listV2`）。

    * `put(name, file)`: 上传文件。

    * `delete(name)`: 删除文件。

    * `multipartUpload(name, file, options)`: 分片上传。

    * `listBuckets()`: 获取存储桶列表。

  * 导出必要的类型定义（如 `OssConfig`，如果需要完全解耦，可以使用自定义类型）。

### 2. 更新基础设施层导出

从 `src/main/infra/ali-oss/index.ts` 导出新的客户端类。

* **文件**: `src/main/infra/ali-oss/index.ts`

* **操作**: 导出 `AliOssClient` 类及其相关类型。

### 3. 重构模块适配器 (`Impl.ts`)

修改 `src/main/modules/oss/adapter/Ali/Impl.ts`，使用新的 `AliOssClient` 替换原有的 `ali-oss` 直接调用。

* **文件**: `src/main/modules/oss/adapter/Ali/Impl.ts`

* **操作**:

  * 移除 `import OSS from 'ali-oss'`。

  * 从 `src/main/infra/ali-oss` 引入 `AliOssClient`。

  * 将 `private client!: OSS` 类型声明更改为 `private client!: AliOssClient`。

  * 将实例化代码 `new OSS(...)` 更改为 `new AliOssClient(...)`。

  * 确保所有方法调用与新封装的接口保持一致。

  * **注意**: 此修改不应影响 `src/main/bootstrap/lifecycle.ts` 中对 `AliOSS` 类的引用和初始化逻辑 (`ossService.add(AliOSS)`)，因为类的接口保持不变。

### 4. 重构服务层 (`oss.service.ts`)

修改 `src/main/modules/oss/oss.service.ts`，使用新的 `AliOssClient` 进行账号验证和存储桶列表获取。

* **文件**: `src/main/modules/oss/oss.service.ts`

* **操作**:

  * 移除 `import OSS from 'ali-oss'`。

  * 从 `src/main/infra/ali-oss` 引入 `AliOssClient`。

  * 将 `getBuckets` 和 `validate` 函数中的 `new OSS(...)` 替换为 `new AliOssClient(...)`。

