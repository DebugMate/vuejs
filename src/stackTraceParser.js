/**
 * Parses an Error object to extract detailed stack trace information.
 *
 * @param {Error} error - The Error object to be parsed.
 * @returns {Object} An object containing:
 *  - `sources`: Array of parsed stack trace details (file, line, column, and function).
 *  - `stack`: The complete stack trace as a single string.
 */
function parse(error) {
    if (!error || !error.stack || typeof error.stack !== 'string') {
        console.warn('Invalid error object or missing stack trace:', error);

        return {
            sources: [],
            stack: 'No stack trace available'
        };
    }

    const stacklist = error.stack
        .replace(/\n+/g, "\n")
        .split("\n")
        .filter((item, index, array) => {
            if (!!item) {
                return index === array.indexOf(item);
            }
        });

    const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
    const stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

    const sources = [];

    stacklist.forEach((item) => {
        const match = stackReg.exec(item) || stackReg2.exec(item);
        if (match && match.length === 5) {
            sources.push({
                function: match[1] || 'anonymous',
                file: match[2] || 'unknown',
                line: match[3] || '0',
                column: match[4] || '0', 
            });
        }
    });

    const stack = stacklist.join('\n');

    return { sources, stack };
}

export { parse };