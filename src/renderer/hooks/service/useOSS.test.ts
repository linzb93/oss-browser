import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('element-plus', () => ({
    ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
    ElMessageBox: vi.fn(),
}));

vi.mock('@/renderer/utils/request', () => ({
    request: vi.fn().mockResolvedValue(null),
    requestActions: { copy: vi.fn() },
}));

vi.mock('@/renderer/utils/scroll-to', () => ({ scrollTo: vi.fn() }));
vi.mock('@/renderer/utils/size', () => ({ getSize: () => '0 B' }));
vi.mock('@/renderer/api', () => ({
    getOSSList: vi.fn(),
    addDirectory: vi.fn(),
    deleteItem: vi.fn(),
    copyTemplate: vi.fn(),
}));

import { getOSSList as apiGetOSSList } from '@/renderer/api';
import { useBreadcrumb } from '../common/useBreadcrumb';
import { useOSSStore } from './useOSS';

const { ossList, getOSSList } = useOSSStore();
const { setPath } = useBreadcrumb();

const mockedGetOSSList = vi.mocked(apiGetOSSList);

beforeEach(() => {
    vi.clearAllMocks();
    setPath('diankeduo/dkd-aibaodan');
    mockedGetOSSList.mockResolvedValue({
        list: [
            { name: 'home', type: 'directory', size: 0 },
            { name: 'cover.png', type: 'png', size: 1024, lastModified: '2026-01-01 00:00:00' },
        ],
        hasNext: false,
        hasPrev: false,
        page: 1,
    });
});

describe('getOSSList', () => {
    it('目录项的 path 以 / 结尾，下载时才能按目录展开', async () => {
        await getOSSList('reset');
        expect(ossList.value.map((item) => item.path)).toEqual([
            'diankeduo/dkd-aibaodan/home/',
            'diankeduo/dkd-aibaodan/cover.png',
        ]);
    });
});
