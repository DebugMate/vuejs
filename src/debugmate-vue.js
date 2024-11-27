import DebugmateSetup from './DebugmateSetup';

/**
 * Vue.js plugin for integrating Debugmate error tracking.
 */
const DebugmateVue = {
    /**
     * Install method to register the Debugmate plugin in a Vue.js application.
     * @param {Object} app - The Vue app instance.
     * @param {Object} [options={}] - Configuration options for Debugmate.
     * @param {string} options.domain - The Debugmate API domain.
     * @param {string} options.token - The API token for authentication.
     * @param {boolean} [options.enabled=true] - Whether error tracking is enabled.
     * @param {Object|null} nuxtContext - The Nuxt.js context, if available.
     */
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

        /**
         * Vue.js global error handler.
         * This captures errors from components and sends them to Debugmate.
         * @param {Error} err - The error object.
         * @param {VueComponent} vm - The Vue component instance where the error occurred.
         * @param {string} info - Additional info about the error, such as lifecycle hook.
         */
        app.config.errorHandler = (err, vm, info) => {
            debugmate.publish(err);
        };
    }
};

export default DebugmateVue;