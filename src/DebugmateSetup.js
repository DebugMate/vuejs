import { sendToApi } from './api/sendToApi';
import { Context } from './context';
import { parse } from './stackTraceParser';

class DebugmateSetup {
    constructor(options = {}, nuxtContext = null) {
        this.domain = options.domain;
        this.token = options.token;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.nuxtContext = nuxtContext;
        this.user = null;  // Variável para armazenar o usuário global
        this.environment = null;  // Variável para armazenar o ambiente global
        this.checkAppContext = options.checkAppContext || this.defaultCheckAppContext;
    }

    // Método para definir o usuário globalmente
    setUser(user) {
        this.user = user;
    }

    // Método para definir o ambiente globalmente
    setEnvironment(environment) {
        this.environment = environment;
    }

    async publish(error, request = null) {
        if (!error || !this.enabled || !this.domain || !this.token) {
            return;
        }

        const context = new Context();
        const appContext = this.checkAppContext();

        // Se um usuário global foi definido, use-o; caso contrário, use o do contexto da aplicação
        if (this.user) {
            context.setUser(this.user);
        } else if (appContext?.getUser) {
            context.setUser(appContext.getUser());
        }

        // Se um ambiente global foi definido, use-o; caso contrário, use o do contexto da aplicação
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

    defaultCheckAppContext() {
        return {
            getUser: () => null,
            getEnvironment: () => process.env.NODE_ENV || 'unknown',
        };
    }
}

export default DebugmateSetup;
