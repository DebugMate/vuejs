import { sendToApi } from './api/sendToApi';
import { Context } from './context';
import { parse } from './stackTraceParser';

/**
 * Handles error tracking and reporting to DebugMate.
 */
class DebugmateSetup {
    /**
     * Creates an instance of DebugmateSetup.
     * @param {Object} options - Configuration options.
     * @param {string} options.domain - API domain for sending error reports.
     * @param {string} options.token - API authentication token.
     * @param {boolean} [options.enabled=true] - Whether error tracking is enabled.
     * @param {Function} [options.checkAppContext] - Custom function to provide additional app context.
     * @param {Object|null} nuxtContext - Optional Nuxt.js context.
     */
    constructor(options = {}, nuxtContext = null) {
        this.domain = options.domain;
        this.token = options.token;
        this.enabled = options.enabled ?? true;
        this.nuxtContext = nuxtContext;
        this.user = null;
        this.environment = null;
        this.checkAppContext = options.checkAppContext || this.defaultAppContext;
    }

    /**
     * Sets user context for error tracking.
     * @param {Object} user - User details.
     * @param {string} user.id - User ID.
     * @param {string} user.name - User name.
     * @param {string} user.email - User email.
     */
    setUser(user) {
        this.user = user;
    }

    /**
     * Sets environment context for error tracking.
     * @param {Object} environment - Environment details.
     * @param {string} environment.environment - Environment name (e.g., 'production').
     * @param {boolean} environment.debug - Debugging status.
     * @param {string} environment.timezone - Server timezone.
     */
    setEnvironment(environment) {
        this.environment = environment;
    }

    /**
     * Reports an error to DebugMate.
     * @param {Error} error - The error object.
     * @param {Object|null} [request=null] - Optional request context.
     */
    async publish(error, request = null) {
        if (!error || !this.enabled || !this.domain || !this.token) {
            console.warn('Error tracking is disabled or misconfigured.');
            return;
        }

        const context = new Context();
        const appContext = this.checkAppContext();

        if (this.user) context.setUser(this.user);
        else if (appContext?.getUser) context.setUser(appContext.getUser());

        if (this.environment) context.setEnvironment(this.environment);
        else if (appContext?.getEnvironment) context.setEnvironment(appContext.getEnvironment());

        if (request) context.setRequest(request);

        const payload = await this.createPayload(error, context);

        try {
            const fetchFn = typeof fetch !== 'undefined' ? fetch : this.nuxtContext?.$fetch;
            await sendToApi(payload, this.domain, this.token, fetchFn);
        } catch (err) {
            console.error('Failed to send error to DebugMate:', err);
        }
    }

    /**
     * Builds the payload for error reporting.
     * @param {Error} error - The error object.
     * @param {Context} context - The context instance.
     * @returns {Object} - The payload object.
     */
    async createPayload(error, context) {
        const trace = await this.parseStackTrace(error);
        const defaultTrace = { file: 'unknown', line: 0 };

        let payload = {
            exception: trace[0]?.name || 'Unknown Error',
            message: trace[0]?.message || 'Unknown Message',
            file: trace[0]?.file || defaultTrace.file,
            type: 'web',
            trace: trace.length ? trace : [defaultTrace],
        };

        if (context) {
            context.setError(error);
            payload = { ...payload, ...context.payload() };
        }

        return payload;
    }

    /**
     * Parses the stack trace from an error object.
     * @param {Error} error - The error to parse.
     * @returns {Array<Object>} - Parsed stack trace details.
     */
    async parseStackTrace(error) {
        try {
            const sources = await parse(error);

            return await Promise.all(
                sources.map(async (source) => {
                    const fileContent = await this.fetchFileContent(source?.file);

                    const errorLine = source?.line;
                    const previewLines = fileContent ? this.getCodePreview(fileContent, errorLine) : null;

                    return {
                        name: source.name,
                        message: source.message,
                        file: source?.file || 'unknown',
                        line: source?.line || 0,
                        column: source?.column || 0,
                        function: source?.function || 'anonymous',
                        class: source?.file || 'unknown',
                        preview: previewLines,
                    };
                })
            );
        } catch (err) {
            console.error('Failed to parse stack trace:', err);
            return [];
        }
    }

    /**
     * Fetches file content from a URL.
     * @param {string} filePath - The URL of the file.
     * @returns {Promise<string>} - The file content as a string.
     */
    async fetchFileContent(filePath) {
        if (!filePath) return '';
        try {
            const response = await fetch(filePath);
            if (response.ok) return await response.text();
            throw new Error(`Unable to fetch file: ${filePath}`);
        } catch (err) {
            console.error('File fetching error:', err);
            return '';
        }
    }

    /**
     * Retrieves a preview of lines surrounding the error line in an object format.
     * @param {string} fileContent - The full file content.
     * @param {number} errorLine - The line where the error occurred.
     * @returns {Object} - Lines near the error in an object with line numbers as keys.
     */
    getCodePreview(fileContent, errorLine) {
        const lines = fileContent.split('\n');
        const start = Math.max(errorLine - 5, 0);
        const end = Math.min(errorLine + 5, lines.length);

        const preview = {};
        for (let i = start; i < end; i++) {
            preview[i + 1] = lines[i] ? lines[i].trim() : null;
        }

        return preview;
    }


    /**
     * Provides a default application context.
     * @returns {Object} - Default context implementation.
     */
    defaultAppContext() {
        return {
            getUser: () => null,
            getEnvironment: () => process.env.NODE_ENV || 'unknown',
        };
    }
}

export default DebugmateSetup;