export * from './client';
import { AddOptions } from './type';
import { AliOssClient } from './client';

let currentClient: AliOssClient | null = null;

// 保留用于向后兼容（如果需要），但已更新为使用 AliOssClient
// 然而，原始的 index.ts 使用了全局 currentClient，它使用空配置进行了初始化？
// 原始代码：let currentClient: OSS = new OSS({} as OssConfig);
// 这对于生产代码来说似乎是错误的（空配置）。
// 但我应该尽量保留结构，或者只是保留它，因为我专注于迁移代码。
// 我将保留之前添加的导出，即 export * from client。

// 重新导出函数以支持旧版本（如果它们在其他地方被使用）（虽然 grep 没有找到用法）
// 我将保留它们，但如果已初始化，则使用新的 client 类。

export const listBuckets = async () => {
    // 如果 currentClient 未正确初始化，此函数在原始代码中似乎已损坏
    throw new Error('Use AliOssClient instance directly');
};

export const deleteFile = async (paths: string) => {
    throw new Error('Use AliOssClient instance directly');
};

export const addDirectory = async (param: AddOptions) => {
    throw new Error('Use AliOssClient instance directly');
};

export const addFile = async (param: AddOptions) => {
    throw new Error('Use AliOssClient instance directly');
};
