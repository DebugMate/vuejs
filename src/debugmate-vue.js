import DebugmateSetup from './DebugmateSetup';

const DebugmateVue = {
    install(app, options = {}, nuxtContext = null) {
        const debugmate = new DebugmateSetup(options, nuxtContext);

        app.config.globalProperties.$debugmate = debugmate;

        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                debugmate.publish(event.error, event.request);
            });

            window.addEventListener('unhandledrejection', (event) => {
                event.preventDefault();
                console.error('Unhandled Rejection captured:', event.reason);

                if (app.config.globalProperties.$debugmate) {
                    app.config.globalProperties.$debugmate.publish(event.reason);
                }
            });
        }

        app.config.errorHandler = (err, vm, info) => {
            debugmate.publish(err);
        };
    }
};

export default DebugmateVue;
