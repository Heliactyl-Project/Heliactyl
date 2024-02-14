class Queue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    addJob(job) {
        this.queue.push(job);
        if (!this.processing) {
            this.processQueue();
        }
    }

    processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        const job = this.queue.shift();
        this.processing = true;

        const callback = () => {
            this.processing = false;
            this.processQueue();
        };

        job(callback);
    }
}

module.exports = Queue;
