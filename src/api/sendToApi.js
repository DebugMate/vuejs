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
