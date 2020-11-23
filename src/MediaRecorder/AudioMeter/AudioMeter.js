import React, { useRef, useEffect } from 'react';

export default function AudioMeter() {
    const audioContext = useRef(null);
    const canvasContext = useRef(null);
    const canvasMeter = useRef(null);
    const mediaStreamSource = useRef(null);
    const meter = useRef(null);
    const rafID = useRef(null);
    let WIDTH = 400;
    let HEIGHT = 10;

    useEffect(() => {
        navigator.getUserMedia =
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;

        canvasMeter.current = canvasContext.current.getContext('2d');

        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext.current = new AudioContext();

        try {
            navigator.getUserMedia(
                {
                    audio: {
                        mandatory: {
                            googEchoCancellation: 'false',
                            googAutoGainControl: 'false',
                            googNoiseSuppression: 'false',
                            googHighpassFilter: 'false',
                        },
                        optional: [],
                    },
                },
                gotStream,
                didntGetStream,
            );
        } catch (e) {
            alert('getUserMedia threw exception :' + e);
        }

        function didntGetStream() {
            alert('Stream generation failed.');
        }
    });

    function gotStream(stream) {
        mediaStreamSource.current = audioContext.current.createMediaStreamSource(
            stream,
        );
        meter.current = createAudioMeter(audioContext.current);
        mediaStreamSource.current.connect(meter.current);

        drawLoop();
    }

    function drawLoop() {
        canvasMeter.current.clearRect(0, 0, WIDTH, HEIGHT);

        if (meter.current.checkClipping()) {
            canvasMeter.current.fillStyle = 'red';
        } else {
            canvasMeter.current.fillStyle = 'green';
        }

        canvasMeter.current.fillRect(
            0,
            0,
            meter.current.volume * WIDTH * 1.4,
            HEIGHT,
        );

        rafID.current = window.requestAnimationFrame(drawLoop);
        return rafID.current;
    }

    function createAudioMeter(audioContext, clipLevel, averaging, clipLag) {
        var processor = audioContext.createScriptProcessor(256);

        processor.onaudioprocess = volumeAudioProcess;
        processor.clipping = false;
        processor.lastClip = 0;
        processor.volume = 0;
        processor.clipLevel = clipLevel || 0.98;
        processor.averaging = averaging || 0.95;
        processor.clipLag = clipLag || 750;

        processor.connect(audioContext.destination);

        processor.checkClipping = function () {
            if (!this.clipping) return false;
            if (this.lastClip + this.clipLag < window.performance.now())
                this.clipping = false;
            return this.clipping;
        };

        processor.shutdown = function () {
            this.disconnect();
            this.onaudioprocess = null;
        };

        return processor;
    }

    function volumeAudioProcess(event) {
        const buf = event.inputBuffer.getChannelData(0);
        let bufLength = buf.length;
        let sum = 0;
        let x;

        for (let i = 0; i < bufLength; i++) {
            x = buf[i];
            if (Math.abs(x) >= this.clipLevel) {
                this.clipping = true;
                this.lastClip = window.performance.now();
            }
            sum += x * x;
        }

        let rms = Math.sqrt(sum / bufLength);
        this.volume = Math.max(rms, this.volume * this.averaging);
    }

    return (
        <div>
            <canvas
                className="audio-indicator"
                id="meter"
                height="10"
                ref={canvasContext}
            ></canvas>
        </div>
    );
}
