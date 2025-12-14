/**
 * PCM Audio Player
 * Plays PCM16 audio data received from the agent.
 */

export interface PCMPlayerOptions {
    sampleRate?: number;
}

export interface PCMPlayer {
    play: (pcmData: ArrayBuffer) => void;
    stop: () => void;
}

export function createPCMPlayer(options: PCMPlayerOptions = {}): PCMPlayer {
    const sampleRate = options.sampleRate || 24000;
    let audioContext: AudioContext | null = null;
    let nextStartTime = 0;

    const getAudioContext = (): AudioContext => {
        if (!audioContext) {
            audioContext = new AudioContext({ sampleRate });
        }
        return audioContext;
    };

    const pcm16ToFloat32 = (pcmData: ArrayBuffer): Float32Array => {
        const int16Array = new Int16Array(pcmData);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7fff);
        }
        return float32Array;
    };

    const play = (pcmData: ArrayBuffer) => {
        const ctx = getAudioContext();
        const float32Data = pcm16ToFloat32(pcmData);

        const audioBuffer = ctx.createBuffer(1, float32Data.length, sampleRate);
        audioBuffer.getChannelData(0).set(float32Data);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        // Schedule playback to prevent gaps
        const currentTime = ctx.currentTime;
        const startTime = Math.max(currentTime, nextStartTime);
        source.start(startTime);
        nextStartTime = startTime + audioBuffer.duration;
    };

    const stop = () => {
        if (audioContext) {
            audioContext.close();
            audioContext = null;
            nextStartTime = 0;
        }
    };

    return { play, stop };
}
