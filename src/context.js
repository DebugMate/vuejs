export class Context {
    constructor() {
        this.error = null;
        this.request = null;
        this.user = null;
        this.environment = null;
        this.process = {
            platform: navigator.platform,
            version: navigator.appVersion,
        };
    }

    setError(error) {
        this.error = error;
        return this;
    }

    setRequest(request) {
        this.request = request;
        return this;
    }

    setUser(user) {
        this.user = user;
        return this;
    }

    setEnvironment(environment) {
        this.environment = environment;
        return this;
    }

    setProcess(process) {
        this.process = process;
        return this;
    }

    get getProcess() {
        return this.process || { platform: 'unknown', version: 'unknown' };
    }

    checkOperationSystem() {
        const osValue = this.getProcess.platform.toLowerCase();

        const operationalSystem = {
            'macintel': 'MacOS',
            'win32': 'Windows',
            'linux': 'Linux',
            'android': 'Android',
        };

        return operationalSystem[osValue] || 'Unknown';
    }

    payload() {
        return {
            ...this.appUser(),
            ...this.appRequest(),
            ...this.appEnvironment(),
        };
    }

    appUser() {
        return this.user ? { user: this.user } : {};
    }

    appRequest() {
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
            }
        };
    }

    getQueryParams() {
        const queryString = window.location.search.substring(1);
        const params = new URLSearchParams(queryString);

        return Object.fromEntries(params.entries());
    }

    appEnvironment() {
        const nodeContext = {
            group: 'Node',
            variables: {
                version: this.getProcess.version || 'unknown',
            }
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
            browser: navigator.userAgent || 'unknown',
        };

        const systemContext = {
            group: 'System',
            variables: systemVariables,
        };

        return {
            environment: this.filterKeys([nodeContext, environmentContext, systemContext])
        };
    }

    filterKeys(array) {
        return array.filter(value => Object.keys(value).length !== 0);
    }
}
