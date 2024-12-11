/**
 * Sends error payload data to the DebugMate API.
 * 
 * @param {Object} payload - The data payload to send, including error details and context.
 * @param {string} domain - The base URL of the DebugMate API.
 * @param {string} token - The API token used for authentication.
 * @param {Function} fetchOptions - The fetch function or equivalent to use for the HTTP request.
 * 
 * @returns {Promise<void>} - Resolves if the request is successful, otherwise throws an error.
 * 
 * @throws {Error} Throws an error if the request fails or the response status is not OK.
 */
export function sendToApi(payload, domain, token, fetchOptions) {
    const apiEndpoint = `${domain}/api/capture`;

    return fetchOptions(apiEndpoint, {
        method: 'POST',
        headers: {
            'X-DEBUGMATE-TOKEN': token,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Request error: ${response.status}`);
            }
        })
        .catch(error => {
            console.error('Error to send to Debugmate API:', error);
            throw error;
        });
}