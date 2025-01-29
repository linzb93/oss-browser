import * as utilService from './util.service';

export default {
    copy(dataStr: string) {
        const data = JSON.parse(dataStr) as {
            content: string;
        };
        return utilService.copy(data.content);
    },
    download(dataStr: string) {
        const data = JSON.parse(dataStr) as {
            url: string;
        };
        return utilService.download(data.url, '');
    },
    open(dataStr: string) {
        const data = JSON.parse(dataStr) as {
            type: 'path' | 'web';
            url: string;
        };
        return utilService.open(data.type, data.url);
    },
};
