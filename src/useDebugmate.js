import { getCurrentInstance } from 'vue';

/**
 * Hook to access the Debugmate instance in a Vue application.
 *
 * @returns {Object|null} Debugmate instance or null if unavailable.
 */
export default function useDebugmate() {
    const instance = getCurrentInstance();

    if (!instance) {
        console.warn('useDebugmate must be used within a Vue component setup.');
        return null;
    }

    return instance.appContext.config.globalProperties.$debugmate;
}