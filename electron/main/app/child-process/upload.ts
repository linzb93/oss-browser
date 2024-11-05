const paths = getArgValue('paths');

function getArgValue(arg: string) {
    const list = process.argv.slice(2);
    const match = list.find((item) => item.startsWith(`--${arg}`));
    if (!match) {
        return null;
    }
    if (match === `--${arg}`) {
        return true;
    }
    const rest = match.replace(`--${arg}=`, '');
    return isNaN(Number(rest)) ? rest : Number(rest);
}
