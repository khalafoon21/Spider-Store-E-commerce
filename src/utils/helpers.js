function getPostData(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            if (!body || !body.trim()) {
                return resolve({});
            }

            try {
                const parsed = JSON.parse(body);
                resolve(parsed);
            } catch (error) {
                const parseError = new Error('Invalid JSON payload');
                parseError.code = 'INVALID_JSON';
                reject(parseError);
            }
        });

        req.on('error', (error) => {
            reject(error);
        });
    });
}

module.exports = {
    getPostData,
};

