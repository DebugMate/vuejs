import DebugmateSetup from './DebugmateSetup';

export default defineNuxtPlugin((nuxtApp) => {
    const options = {
        domain: useRuntimeConfig().public.DEBUGMATE_DOMAIN,
        token: useRuntimeConfig().public.DEBUGMATE_TOKEN,
        enabled: useRuntimeConfig().public.DEBUGMATE_ENABLED !== undefined ? useRuntimeConfig().public.DEBUGMATE_ENABLED === 'true' : true,
        checkAppContext: () => ({
            getUser: () => null,
            getEnvironment: () => ({
                environment: nuxtApp.ssrContext ? 'server' : 'client',
                version: process.env.APP_VERSION || '1.0.0',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }),
        }),
    };

    const debugmate = new DebugmateSetup(options, nuxtApp);
    nuxtApp.provide('debugmate', debugmate);

    if (process.client) {
        window.onerror = function (message, source, lineno, colno, error) {
            debugmate.publish(error);
        };

        window.onunhandledrejection = function (event) {
            debugmate.publish(event.reason);
        };
    }

    if (process.server) {
        nuxtApp.hook('render:errorMiddleware', (err, req, res, next) => {
            debugmate.publish(err);
            next(err);
        });
    }
});
