import { sendToApi } from './api/sendToApi';
import { Context } from './context';
import { parse } from './stackTraceParser';

/**
 * DebugmateSetup is responsible for configuring and sending error reports to Debugmate.
 */
class DebugmateSetup {
    /**
     * Creates a new DebugmateSetup instance.
     * @param {Object} options - Configuration options for Debugmate.
     * @param {string} options.domain - The API domain to send error reports to.
     * @param {string} options.token - The API token for authentication.
     * @param {boolean} [options.enabled=true] - Whether error tracking is enabled.
     * @param {Function} [options.checkAppContext] - Function to provide additional app context.
     * @param {Object|null} nuxtContext - The Nuxt.js context, if available.
     */
    constructor(options = {}, nuxtContext = null) {
        this.domain = options.domain;
        this.token = options.token;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.nuxtContext = nuxtContext;
        this.user = null;
        this.environment = null;
        this.checkAppContext = options.checkAppContext || this.defaultCheckAppContext;
    }

    /**
     * Sets the user context for error reports.
     * @param {Object} user - User details.
     * @param {string} user.id - User ID.
     * @param {string} user.name - User name.
     * @param {string} user.email - User email.
     */
    setUser(user) {
        this.user = user;
    }

    /**
     * Sets the environment context for error reports.
     * @param {Object} environment - Environment details.
     * @param {string} environment.environment - Environment name (e.g., 'production').
     * @param {boolean} environment.debug - Whether debugging is enabled.
     * @param {string} environment.timezone - The server timezone.
     */
    setEnvironment(environment) {
        this.environment = environment;
    }

    /**
     * Publishes an error to Debugmate.
     * @param {Error} error - The error object to report.
     * @param {Object|null} [request=null] - Request details, if applicable.
     */
    async publish(error, request = null) {
        if (!error || !this.enabled || !this.domain || !this.token) {
            return;
        }

        const context = new Context();
        const appContext = this.checkAppContext();

        if (this.user) {
            context.setUser(this.user);
        } else if (appContext?.getUser) {
            context.setUser(appContext.getUser());
        }

        if (this.environment) {
            context.setEnvironment(this.environment);
        } else if (appContext?.getEnvironment) {
            context.setEnvironment(appContext.getEnvironment());
        }

        if (request) {
            context.setRequest(request);
        }

        const payload = this.payload(error, context);

        try {
            await sendToApi(payload, this.domain, this.token, typeof fetch !== 'undefined' ? fetch : this.nuxtContext.$fetch);
        } catch (err) {
            console.error('Error sending to Debugmate API:', err);
        }
    }

    /**
     * Constructs the payload for the error report.
     * @param {Error} error - The error object.
     * @param {Context} context - The context object.
     * @returns {Object} - The payload to send to the API.
     */
    payload(error, context) {
        const trace = this.trace(error);

        let data = {
            exception: error.name || 'UnknownError',
            message: error.message || 'An unknown error occurred',
            file: trace[0]?.file || 'unknown',
            type: 'web',
            trace: trace,
        };

        if (context) {
            context.setError(error);
            data = { ...data, ...context.payload() };
        }

        return data;
    }

    /**
     * Parses the stack trace of an error.
     * @param {Error} error - The error object.
     * @returns {Array<Object>} - An array of trace details.
     */
    trace(error) {
        let stackTrace = parse(error);

        return [
            {
                file: stackTrace.sources[0]?.file || 'unknown',
                line: stackTrace.sources[0]?.line || '0',
                column: stackTrace.sources[0]?.column || '0',
                function: stackTrace.sources[0]?.function || 'anonymous',
                class: stackTrace.sources[0]?.file || 'unknown',
                preview: stackTrace.stack ? stackTrace.stack.split('\n') : [],
            }
        ];
    }

    /**
     * Provides default application context.
     * @returns {Object} - Default context details.
     */
    defaultCheckAppContext() {
        return {
            getUser: () => null,
            getEnvironment: () => process.env.NODE_ENV || 'unknown',
        };
    }
}

export default DebugmateSetup;