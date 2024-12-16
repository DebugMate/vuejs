import StackTrace from "stacktrace-js";
/**
 * Parses an Error object to extract detailed stack trace information.
 *
 * @param {Error} error - The Error object to be parsed.
 * @returns {Object} An object containing:
 *  - `sources`: Array of parsed stack trace details (file, line, column, and function).
 *  - `stack`: The complete stack trace as a single string.
 */
async function parse(error) {
    if (!error?.stack) {
        console.warn('Invalid error object or missing stack trace:', error);
        return [];
    }

    try {
        const stackFrames = await StackTrace.fromError(error);
        return stackFrames.map(frame => ({
            function: frame.functionName || 'anonymous',
            file: frame.fileName || 'unknown',
            line: frame.lineNumber || 0,
            column: frame.columnNumber || 0,
            name: error.name,
            message: error.message,
        }));
    } catch (err) {
        console.error('Failed to parse stack trace:', err);
        return [];
    }
}


export { parse };
