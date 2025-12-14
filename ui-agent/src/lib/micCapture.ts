/**
 * Microphone Capture Utility
 * Captures audio from the microphone and converts to PCM16 format.
 */

export interface MicCaptureOptions {
    sampleRate?: number;
    onAudioData?: (data: ArrayBuffer) => void;
}

export interface MicCapture {
    start: () => Promise<void>;
    stop: () => void;
    isRecording: () => boolean;
}

export function createMicCapture(options: MicCaptureOptions = {}): MicCapture {
    const sampleRate = options.sampleRate || 16000;
    let audioContext: AudioContext | null = null;
    let mediaStream: MediaStream | null = null;
    let processor: ScriptProcessorNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let recording = false;

    const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
        const buffer = new ArrayBuffer(float32Array.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
        return buffer;
    };

    const start = async () => {
        if (recording) return;

        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
            },
        });

        audioContext = new AudioContext({ sampleRate });
        source = audioContext.createMediaStreamSource(mediaStream);

        // Use ScriptProcessor for now (deprecated but widely supported)
        // TODO: Migrate to AudioWorklet for better performance
        processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (event) => {
            if (!recording) return;
            const inputData = event.inputBuffer.getChannelData(0);
            const pcmData = floatTo16BitPCM(inputData);
            options.onAudioData?.(pcmData);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        recording = true;
    };

    const stop = () => {
        recording = false;

        if (processor) {
            processor.disconnect();
            processor = null;
        }

        if (source) {
            source.disconnect();
            source = null;
        }

        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }

        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
    };

    return {
        start,
        stop,
        isRecording: () => recording,
    };
}
