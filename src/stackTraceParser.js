/**
 * Parses an Error object to extract detailed stack trace information.
 *
 * @param {Error} error - The Error object to be parsed.
 * @returns {Object} An object containing:
 *  - `sources`: Array of parsed stack trace details (file, line, column, and function).
 *  - `stack`: The complete stack trace as a single string.
 */
function parse(error) {
    // Validate the error object and check for a valid stack trace
    if (!error || !error.stack || typeof error.stack !== 'string') {
        console.warn('Invalid error object or missing stack trace:', error);

        return {
            sources: [],
            stack: 'No stack trace available'
        };
    }

    // Normalize and split the stack trace into individual lines
    const stacklist = error.stack
        .replace(/\n+/g, "\n")
        .split("\n")
        .filter((item, index, array) => {
            if (!!item) {
                // Ensure unique entries in the stack trace
                return index === array.indexOf(item);
            }
        });

    // Regex patterns to extract function, file, line, and column details
    const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
    const stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

    const sources = [];

    // Iterate through each stack trace line and extract details
    stacklist.forEach((item) => {
        const match = stackReg.exec(item) || stackReg2.exec(item);
        if (match && match.length === 5) {
            sources.push({
                function: match[1] || 'anonymous', // Function name or 'anonymous'
                file: match[2] || 'unknown', // File path or 'unknown'
                line: match[3] || '0', // Line number or '0'
                column: match[4] || '0', // Column number or '0'
            });
        }
    });

    // Combine the original stack trace into a single string
    const stack = stacklist.join('\n');

    return { sources, stack };
}

export { parse };