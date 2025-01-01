import { createApp, MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL } from './modules/app/app.service';
import router from './router';

createApp({
    router,
});
export { MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL };
