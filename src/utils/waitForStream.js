module.exports = async (stream, retries=5) => {
    while (retries > 0) {
        if (stream.readableLength > 0) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 200)); // Check every 200ms
        retries--;
    }
    throw new Error('Stream did not become ready in time.');
}