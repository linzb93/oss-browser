import { request } from '@/renderer/utils/request';
import type {
    AddParams,
    AccountItem,
    BucketItem,
    GetOSSListParams,
    GetOSSListResponse,
} from '@/shared/types';

/**
 * 获取文件列表
 * @param {GetOSSListParams} params - 分页查询参数
 * @returns {Promise<GetOSSListResponse>} 文件列表分页结果
 */
export function getOSSList(params: GetOSSListParams): Promise<GetOSSListResponse> {
    return request('oss:get-list', params);
}
/**
 * 添加新目录或文件
 * @param {AddParams} params - 添加目录或文件的参数对象
 * @returns {Promise<any>}
 */
export const addDirectory = async (params: AddParams): Promise<any> => {
    return request('oss:add-directory', params);
};
/**
 * 删除文件或目录
 * @param {object} data - 删除路径的数据对象
 * @param {string} data.paths - 逗号分隔的路径字符串
 * @returns {Promise<any>}
 */
export const deleteItem = async (data: { paths: string }): Promise<any> => {
    return request('oss:delete', data);
};

/**
 * 获取OSS存储桶列表
 * @param {object} params - 查询参数
 * @param {string} params.region - 区域
 * @param {string} params.accessKeyId - 访问密钥ID
 * @param {string} params.accessKeySecret - 访问密钥密钥
 * @returns {Promise<BucketItem[]>} 存储桶对象数组的Promise
 */
export const getBuckets = async (
    params: Pick<AccountItem, 'region' | 'accessKeyId' | 'accessKeySecret'>,
): Promise<BucketItem[]> => {
    return request('oss:get-buckets', params);
};

export const uploadFiles = (params: {
    prefix: string;
    names: string;
    type: string;
}) => {
    return request('oss:upload', params);
};

/**
 * 复制在线文件：把在线地址的文件以流的方式上传到当前oss目录
 * @param {object} params - 目标目录、在线地址与文件名称
 * @param {string} params.prefix - 目标目录前缀
 * @param {string} params.url - 在线文件地址
 * @param {string} [params.name] - 重命名后的文件名，不传则使用原名
 * @returns {Promise<void>}
 */
export const copyOnlineFile = (params: { prefix: string; url: string; name?: string }): Promise<void> => {
    return request('oss:copy-online-file', params, { showLoading: true });
};