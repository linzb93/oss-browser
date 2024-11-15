import { getTemplate, addTemplate, editTemplate, removeTemplate } from '@/api/template';

export default () => {
    return {
        async get({ id }: { id: number }) {
            return await getTemplate({
                id,
            });
        },
    };
};
