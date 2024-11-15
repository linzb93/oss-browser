import request from './shared/request';

interface TemplateItem {
    id: number;
    name: string;
    content: string;
}

export const getTemplate = async (data: { id: number }): Promise<TemplateItem[]> => {
    return await request('get-template', data);
};

export const addTemplate = async (data: Omit<TemplateItem, 'id'>) => {
    return await request('add-template', data);
};

export const editTemplate = async (data: TemplateItem) => {
    return await request('edit-template', data);
};
export const removeTemplate = async (data: { id: number }) => {
    return await request('remove-template', data);
};
