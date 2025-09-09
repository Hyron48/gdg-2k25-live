class RecorderWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = [];
        this.bufferSize = 1024;
    }

    process(inputs) {
        const inputChannel = inputs[0][0];
        if (!inputChannel) {
            return true;
        }

        this.buffer.push(...inputChannel);
        while (this.buffer.length >= this.bufferSize) {
            const chunk = this.buffer.splice(0, this.bufferSize);
            const pcm16Data = new Int16Array(this.bufferSize);
            for (let i = 0; i < this.bufferSize; i++) {
                let s = Math.max(-1, Math.min(1, chunk[i]));
                pcm16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            this.port.postMessage(pcm16Data.buffer, [pcm16Data.buffer]);
        }
        return true;
    }
}

registerProcessor('recorder-worklet-processor', RecorderWorkletProcessor);
