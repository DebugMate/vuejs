import DebugmateSetup from './DebugmateSetup';

const Debugmate = {
    install(app, options = {}) {
        const debugmate = new DebugmateSetup(options);

        app.config.globalProperties.$debugmate = debugmate;

        window.addEventListener('error', (event) => {
            debugmate.publish(event.error, event.request);
        });

        app.config.errorHandler = (err, vm, info) => {
            debugmate.publish(err);
        };
    }
};

export default Debugmate;
