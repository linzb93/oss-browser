import { BrowserWindow } from 'electron';
export class BrowserService {
    static win: BrowserWindow;
    setWindow(instance: BrowserWindow) {
        BrowserService.win = instance;
    }
}
