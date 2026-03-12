import { registerAccountController } from './controllers/account.controller';
import { registerUtilController } from './controllers/util.controller';
import { registerCollectController } from './controllers/collect.controller';
import { registerHistoryController } from './controllers/history.controller';
import { registerSettingController } from './controllers/setting.controller';
import { registerTemplateController } from './controllers/template.controller';

export const registerApi = () => {
    registerAccountController();
    registerUtilController();
    registerCollectController();
    registerHistoryController();
    registerSettingController();
    registerTemplateController();
};
