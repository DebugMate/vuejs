function parse(error) {
    if (!error || !error.stack || typeof error.stack !== 'string') {
        console.warn('Invalid error object or missing stack trace:', error);

        return {
            sources: [],
            stack: 'No stack trace available'
        };
    }

    const stacklist = error.stack
        .replace(/\n+/g, "\n").split("\n")
        .filter((item, index, array) => {
            if (!!item) {
                return index === array.indexOf(item);
            }
        });

    let stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
    let stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

    const sources = [];
    stacklist.forEach((item) => {
        var sp = stackReg.exec(item) || stackReg2.exec(item);
        if (sp && sp.length === 5) {
            sources.push(
                {
                    function: sp[1] || 'anonymous',
                    file: sp[2] || 'unknown',
                    line: sp[3] || '0',
                    column: sp[4] || '0',
                }
            );
        }
    });
    const stack = stacklist.join('\n');

    return { sources, stack };
}

export { parse };
