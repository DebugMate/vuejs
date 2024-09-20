import { parse } from './stackTraceParser';
import { Context } from './context';

class DebugmateSetup {
    constructor(options = {}) {
        this.domain = options.domain;
        this.token = options.token;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
    }

    publish(error, request) {
        if (!error || !this.enabled || !this.domain || !this.token) {
            return;
        }

        const context = new Context();
        const appContext = this.checkAppContext();

        if (appContext?.getUser) {
            context.setUser(appContext.getUser());
        }

        if (appContext?.getEnvironment) {
            context.setEnvironment(appContext.getEnvironment());
        }

        if (request) {
            context.setRequest(request);
        }

        fetch(`${this.domain}/api/capture`, {
            method: 'POST',
            headers: {
                'X-DEBUGMATE-TOKEN': this.token,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(this.payload(error, context)),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na requisição: ${response.status}`);
                }
            })
            .catch(err => {
                console.error('Erro ao enviar erro para o Debugmate:', err);
            });
    }

    payload(error, context) {
        const trace = this.trace(error);

        let data = {
            exception: error.name,
            message: error.message,
            file: trace[0].file,
            type: 'web',
            trace: trace
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
                file: stackTrace.sources[0].file,
                line: stackTrace.sources[0].line,
                column: stackTrace.sources[0].column,
                function: stackTrace.sources[0].function,
                class: stackTrace.sources[0].file,
                preview: stackTrace.stack.split('\n'),
            }
        ];
    }

    checkAppContext() {
        return null;
    }
}

export default DebugmateSetup;
