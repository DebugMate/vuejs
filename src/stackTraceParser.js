function parse(error) {
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
                    function: sp[1],
                    file: sp[2],
                    line: sp[3],
                    column: sp[4],
                }
            );
        }
    });
    const stack = stacklist.join('\n');

    return { sources, stack };
}

export { parse };
