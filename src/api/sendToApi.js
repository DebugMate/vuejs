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
                throw new Error(`Erro na requisição: ${response.status}`);
            }
        })
        .catch(error => {
            console.error('Erro ao enviar erro para Debugmate:', error);
            throw error;
        });
}
