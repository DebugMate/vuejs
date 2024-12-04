/**
 * Nuxt.js plugin for integrating DebugMate error tracking.
 * 
 * This plugin sets up DebugMate for Nuxt.js applications, enabling the capture of errors and unhandled Promise rejections
 * both on the client and server sides.
 * 
 * @param {Object} nuxtApp - The Nuxt application instance.
 */
import { defineNuxtPlugin, useRuntimeConfig } from '#app';
import DebugmateSetup from './DebugmateSetup';

export default defineNuxtPlugin((nuxtApp) => {
    /**
     * Configuration options for DebugMate.
     * 
     * @type {Object}
     * @property {string} domain - The DebugMate API domain, retrieved from runtime config.
     * @property {string} token - The DebugMate API token, retrieved from runtime config.
     * @property {boolean} enabled - Whether DebugMate is enabled, defaulting to `true`.
     * @property {Function} checkAppContext - A function that provides app-specific context for user and environment.
     */
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
        /**
         * Client-side error handling for uncaught exceptions.
         * Captures `window.onerror` events and publishes the error to DebugMate.
         * 
         * @param {string} message - Error message.
         * @param {string} source - URL of the script where the error occurred.
         * @param {number} lineno - Line number where the error occurred.
         * @param {number} colno - Column number where the error occurred.
         * @param {Error} error - The error object (if available).
         */
        window.onerror = function (message, source, lineno, colno, error) {
            debugmate.publish(error || new Error(message));
        };

        /**
         * Client-side handling for unhandled Promise rejections.
         * Captures `window.onunhandledrejection` events and publishes the reason to DebugMate.
         * 
         * @param {PromiseRejectionEvent} event - The event containing the rejection reason.
         */
        window.onunhandledrejection = function (event) {
            const reason =
                event.reason instanceof Error
                    ? event.reason
                    : new Error(`Unhandled rejection: ${event.reason}`);
            debugmate.publish(reason);
        };
    }

    if (process.server) {
        /**
         * Server-side error handling middleware.
         * Captures errors during rendering and publishes them to DebugMate.
         * 
         * @param {Error} err - The error object.
         * @param {Request} req - The HTTP request object.
         * @param {Response} res - The HTTP response object.
         * @param {Function} next - The next middleware function in the stack.
         */
        nuxtApp.hook('render:errorMiddleware', (err, req, res, next) => {
            debugmate.publish(err);
            next(err);
        });
    }
});