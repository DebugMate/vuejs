## **Debugmate - Error Monitoring for Vue.js and Nuxt.js**

This package provides error monitoring for Vue.js and Nuxt.js applications, automatically capturing client-side and server-side errors and sending them to a specified API endpoint for reporting and analysis.

#### **Table of Contents**
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Usage in Vue.js](#usage-in-vuejs)
4. [Usage in Nuxt.js](#usage-in-nuxtjs)
5. [Injecting User and Environment Data](#injecting-user-and-environment-data)
6. [API Documentation](#api-documentation)

---

### **1. Installation**

To install the Debugmate package, use npm or yarn:

```bash
# NPM
npm install debugmate-vuejs --save

# Yarn
yarn add debugmate-vuejs
```

### **2. Configuration**

After installing the package, you need to configure it by providing the `domain` and `token` for your API. You can also enable or disable the package through environment variables.

#### **Vue.js Configuration**

In Vue.js, import the Vue-specific plugin and install it in your `main.js`:

```js
import { createApp } from 'vue';
import App from './App.vue';
import DebugmateVue from 'debugmate-vuejs/vue'; 

const app = createApp(App);

app.use(DebugmateVue, {
    domain: process.env.VUE_APP_DEBUGMATE_DOMAIN || 'https://api.debugmate.com',
    token: process.env.VUE_APP_DEBUGMATE_TOKEN || 'your-token',
    enabled: process.env.VUE_APP_DEBUGMATE_ENABLED !== 'false',
});

app.mount('#app');
```

#### **Nuxt.js Configuration**

In Nuxt.js, import the **Nuxt-specific** plugin directly from the package in the `nuxt.config.js` file:

1. **Add the Plugin in `nuxt.config.js`:**

```js
export default {
    runtimeConfig: {
        public: {
            DEBUGMATE_DOMAIN: process.env.DEBUGMATE_DOMAIN || 'https://api.debugmate.com',
            DEBUGMATE_TOKEN: process.env.DEBUGMATE_TOKEN || 'your-token',
            DEBUGMATE_ENABLED: process.env.DEBUGMATE_ENABLED || 'true',
        }
    },
    plugins: ['debugmate-vuejs/nuxt']  // Use Nuxt-specific version
}
```

This will automatically register the plugin for your Nuxt application.

### **3. Usage in Vue.js**

After configuring Debugmate in Vue.js, it will automatically start capturing errors. Errors like `window.onerror` and `window.onunhandledrejection` are monitored out-of-the-box.

You can manually report errors using the useDebugmate hook. The hook gives you access to the Debugmate instance directly.

```js
import useDebugmate from "debugmate-vuejs/useDebugmate";

const debugmate = useDebugmate();

const reportError = () => {
  if (debugmate) {
    debugmate.publish(new Error('Simulated error from useDebugmate hook'));
  } else {
    console.error('Debugmate instance not available');
  }
};
```

### **4. Usage in Nuxt.js**

In Nuxt.js, Debugmate will also capture client-side and server-side errors. You can inject user data or any additional context dynamically. For manual reporting of errors in Nuxt:

```js
const { $debugmate } = useNuxtApp();
$debugmate.publish(new Error('Custom error message'));
```

### **5. Injecting User and Environment Data**

You can dynamically inject user and environment data using the `setUser` and `setEnvironment` methods provided by Debugmate. These methods allow you to customize the context of the errors being reported.

#### **Example in Vue.js:**

```js
import useDebugmate from "debugmate-vuejs/useDebugmate";

const debugmate = useDebugmate();

debugmate.setUser({
    id: '123',
    name: 'Jane Doe',
    email: 'jane@example.com'
});

debugmate.setEnvironment({
    environment: 'client',
    version: '1.0.0',
    timezone: 'America/New_York'
});
```

#### **Example in Nuxt.js:**

```js
const { $debugmate } = useNuxtApp();

$debugmate.setUser({
    id: '789',
    name: 'John Doe',
    email: 'john@example.com'
});

$debugmate.setEnvironment({
    environment: 'server',
    version: '2.0.0',
    timezone: 'America/Sao_Paulo'
});
```

### **6. API Documentation**

The `DebugmateSetup` class handles error capture and reporting to the API:

- **publish(error, request, user)**: Sends the error, request, and user information to the configured API endpoint.
- **setUser(user)**: Allows you to set the current user globally.
- **setEnvironment(environment)**: Allows you to set the environment globally.

#### **Error Payload Example**

The payload sent to the API will include:
- **exception**: The error type (e.g., `TypeError`, `SyntaxError`).
- **message**: The error message.
- **file**: The file where the error occurred.
- **trace**: The stack trace.
- **user**: Optional user data, if provided.
- **environment**: Optional environment data, if provided.

---

By following this guide, you can easily integrate Debugmate for error monitoring in both Vue.js and Nuxt.js applications, ensuring all errors are captured and sent to your API for tracking and debugging.

---

### **Conclusion**

- Use `debugmate-vuejs/vue` for **Vue.js**.
- Use `debugmate-vuejs/nuxt` for **Nuxt.js**.

This separation makes it clear which version of the plugin is used for each framework, ensuring better maintainability and clarity.

---

This version now omits the step related to simulating errors as requested!
