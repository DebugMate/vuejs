/**
 * A class that manages the context of errors, user, environment, and requests for DebugMate.
 */
export class Context {
    /**
     * Constructs a new Context instance and initializes default values.
     */
    constructor() {
        this.error = null;
        this.request = null;
        this.user = null;
        this.environment = null;

        if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
            this.process = {
                platform: navigator.platform,
                version: navigator.appVersion,
            };
        } else {
            this.process = {
                platform: 'server',
                version: process.version || 'unknown',
            };
        }
    }

    /**
     * Sets the error object for the context.
     * @param {Error} error - The error to set.
     * @returns {Context} - Returns the current context instance for chaining.
     */
    setError(error) {
        this.error = error;
        return this;
    }

    /**
     * Sets the request details for the context.
     * @param {Object} request - The request details to set.
     * @returns {Context} - Returns the current context instance for chaining.
     */
    setRequest(request) {
        this.request = request;
        return this;
    }

    /**
     * Sets the user details for the context.
     * @param {Object} user - The user details to set.
     * @param {string|number} user.id - The user ID.
     * @param {string} user.name - The user's name.
     * @param {string} user.email - The user's email address.
     * @returns {Context} - Returns the current context instance for chaining.
     */
    setUser(user) {
        this.user = user;
        return this;
    }

    /**
     * Sets the environment details for the context.
     * @param {Object} environment - The environment details to set.
     * @returns {Context} - Returns the current context instance for chaining.
     */
    setEnvironment(environment) {
        this.environment = environment;
        return this;
    }

    /**
     * Sets the process details for the context.
     * @param {Object} process - The process details to set.
     * @returns {Context} - Returns the current context instance for chaining.
     */
    setProcess(process) {
        this.process = process;
        return this;
    }

    /**
     * Gets the process details.
     * @returns {Object} - The process details with platform and version.
     */
    get getProcess() {
        return this.process || { platform: 'unknown', version: 'unknown' };
    }

    /**
     * Determines the operating system based on the process platform.
     * @returns {string} - The name of the operating system.
     */
    checkOperationSystem() {
        const osValue = this.getProcess.platform.toLowerCase();

        const operationalSystem = {
            macintel: 'MacOS',
            win32: 'Windows',
            linux: 'Linux',
            android: 'Android',
        };

        return operationalSystem[osValue] || 'Unknown';
    }

    /**
     * Constructs the payload object to send to the API.
     * @returns {Object} - The context payload.
     */
    payload() {
        return {
            ...this.appUser(),
            ...this.appRequest(),
            ...this.appEnvironment(),
        };
    }

    /**
     * Retrieves user-related details for the payload.
     * @returns {Object} - User information or an empty object if not set.
     */
    appUser() {
        return this.user ? { user: this.user } : {};
    }

    /**
     * Retrieves request-related details for the payload.
     * @returns {Object} - Request information or an empty object if not set.
     */
    appRequest() {
        if (typeof window === 'undefined') return {};

        const url = window.location.href;
        const queryParams = this.getQueryParams();

        return {
            request: {
                request: {
                    url: url,
                    method: this.request?.method || 'GET',
                    params: this.request?.params || {},
                },
                headers: this.request?.headers || {},
                query_string: queryParams,
                body: this.request?.body || '',
            },
        };
    }

    /**
     * Parses and retrieves query parameters from the URL.
     * @returns {Object} - An object containing the query parameters as key-value pairs.
     */
    getQueryParams() {
        if (typeof window === 'undefined') return {};

        const queryString = window.location.search.substring(1);
        const params = new URLSearchParams(queryString);

        return Object.fromEntries(params.entries());
    }

    /**
     * Retrieves environment-related details for the payload.
     * @returns {Object} - Environment information grouped into categories.
     */
    appEnvironment() {
        const nodeContext = {
            group: 'Node',
            variables: {
                version: this.getProcess.version || 'unknown',
            },
        };

        const environmentVariables = {
            environment: this.environment?.environment || 'unknown',
            debug: this.environment?.debug || 'unknown',
            timezone: this.environment?.timezone || 'unknown',
        };

        const environmentContext = {
            group: 'App',
            variables: environmentVariables,
        };

        const systemVariables = {
            os: this.checkOperationSystem(),
            server: this.environment?.server || 'unknown',
            database: this.environment?.database || 'unknown',
            npm: this.environment?.npm || 'unknown',
            browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        };

        const systemContext = {
            group: 'System',
            variables: systemVariables,
        };

        return {
            environment: this.filterKeys([nodeContext, environmentContext, systemContext]),
        };
    }

    /**
     * Filters out empty keys from an array of objects.
     * @param {Object[]} array - The array to filter.
     * @returns {Object[]} - The filtered array.
     */
    filterKeys(array) {
        return array.filter((value) => Object.keys(value).length !== 0);
    }
}