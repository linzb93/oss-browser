import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { rcedit } from 'rcedit';

export default async function afterPack(context) {
    const { electronPlatformName, appOutDir, packager } = context;

    if (electronPlatformName !== 'win32') {
        return;
    }

    const { appInfo } = packager;
    const exePath = join(appOutDir, `${appInfo.productFilename}.exe`);
    if (!existsSync(exePath)) {
        return;
    }

    const versionString = {
        ProductName: appInfo.productName,
        FileDescription: appInfo.productName,
        OriginalFilename: `${appInfo.productFilename}.exe`,
    };
    if (appInfo.companyName) {
        versionString.CompanyName = appInfo.companyName;
    }
    if (appInfo.copyright) {
        versionString.LegalCopyright = appInfo.copyright;
    }

    const iconPath = join(packager.projectDir, 'public', 'logo.ico');
    const options = {
        'version-string': versionString,
        'file-version': appInfo.buildVersion || appInfo.version,
        'product-version': appInfo.getVersionInWeirdWindowsForm(),
    };
    if (existsSync(iconPath)) {
        options.icon = iconPath;
    }

    await rcedit(exePath, options);
}
