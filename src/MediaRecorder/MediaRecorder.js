import React, { useRef, useEffect, useState } from 'react';
// eslint-disable-next-line
import adapter from 'webrtc-adapter';

import AudioMeter from './AudioMeter/AudioMeter';

import './MediaRecorder.scss';

const MediaRecorder = () => {
    const videoElement = useRef();
    const audioInputSelect = useRef();
    const audioOutputSelect = useRef();
    const videoSelect = useRef();
    const constraints = useRef();
    const recorder = useRef(null);
    const chunks = useRef([]);
    const [onlyAudio, setOnlyAudio] = useState(false);
    const [isVideo, setIsVideo] = useState(true);
    const [isRecord, setIsRecord] = useState(false);

    useEffect(() => {
        const selectors = [
            audioInputSelect.current,
            audioOutputSelect.current,
            videoSelect.current,
        ];
        audioOutputSelect.current.disabled = !(
            'sinkId' in HTMLMediaElement.prototype
        );

        function gotDevices(deviceInfos) {
            const values = selectors.map((select) => select.value);
            selectors.forEach((select) => {
                while (select.firstChild) {
                    select.removeChild(select.firstChild);
                }
            });

            for (let i = 0; i !== deviceInfos.length; ++i) {
                const deviceInfo = deviceInfos[i];
                const option = document.createElement('option');
                option.value = deviceInfo.deviceId;
                if (deviceInfo.kind === 'audioinput') {
                    option.text =
                        deviceInfo.label ||
                        `microphone ${audioInputSelect.current.length + 1}`;
                    audioInputSelect.current.appendChild(option);
                } else if (deviceInfo.kind === 'audiooutput') {
                    option.text =
                        deviceInfo.label ||
                        `speaker ${audioOutputSelect.current.length + 1}`;
                    audioOutputSelect.current.appendChild(option);
                } else if (deviceInfo.kind === 'videoinput') {
                    option.text =
                        deviceInfo.label ||
                        `camera ${videoSelect.current.length + 1}`;
                    videoSelect.current.appendChild(option);
                } else {
                    console.log(
                        'Some other kind of source/device: ',
                        deviceInfo,
                    );
                }
            }

            selectors.forEach((select, selectorIndex) => {
                if (
                    Array.prototype.slice
                        .call(select.childNodes)
                        .some((n) => n.value === values[selectorIndex])
                ) {
                    select.value = values[selectorIndex];
                }
            });
        }

        navigator.mediaDevices
            .enumerateDevices()
            .then(gotDevices)
            .catch(handleError);

        function changeAudioDestination() {
            const audioDestination = audioOutputSelect.current.value;
            attachSinkId(videoElement.current, audioDestination);
        }

        function start() {
            const audioSource = audioInputSelect.current.value;
            const videoSource = videoSelect.current.value;

            constraints.current = {
                audio: {
                    deviceId: audioSource ? { exact: audioSource } : undefined,
                    tag: 'audio',
                    type: 'audio/mp3',
                    ext: '.mp3',
                    gUM: { audio: true },
                },
                video: onlyAudio
                    ? false
                    : {
                          deviceId: videoSource
                              ? { exact: videoSource }
                              : undefined,
                          tag: 'video',
                          type: 'video/webm',
                          ext: '.mp4',
                          gUM: { video: true, audio: true },
                      },
            };

            navigator.mediaDevices
                .getUserMedia(constraints.current)
                .then(gotStream)
                .then(gotDevices)
                .catch(handleError);
        }

        audioInputSelect.current.onchange = start;
        audioOutputSelect.current.onchange = changeAudioDestination;

        videoSelect.current.onchange = start;

        start();

        function handleError(error) {
            handleOnlyAudio();
            console.log(
                'navigator.MediaDevices.getUserMedia error: ',
                error.message,
                error.name,
            );
        }
    }, [onlyAudio]);

    function attachSinkId(element, sinkId) {
        if (typeof element.sinkId !== 'undefined') {
            element
                .setSinkId(sinkId)
                .then(() => {
                    console.log(
                        `Success, audio output device attached: ${sinkId}`,
                    );
                })
                .catch((error) => {
                    let errorMessage = error;
                    if (error.name === 'SecurityError') {
                        errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
                    }
                    console.error(errorMessage);
                    // Jump back to first output device in the list as it's the default.
                    audioOutputSelect.current.selectedIndex = 0;
                });
        } else {
            console.warn('Browser does not support output device selection.');
        }
    }

    function gotStream(stream) {
        videoElement.current.srcObject = stream;
        recorder.current = new window.MediaRecorder(stream);
        recorder.current.ondataavailable = (e) => {
            chunks.current.push(e.data);
            if (recorder.current.state == 'inactive') makeLink();
        };
        return navigator.mediaDevices.enumerateDevices();
    }

    const makeLink = () => {};

    const handleRecordStream = () => {
        setIsRecord(true);
        chunks.current = [];
        recorder.current.start();
    };

    const handleRecordStop = () => {
        setIsRecord(false);
        recorder.current.stop();
    };

    const handleOnlyAudio = () => {
        setIsVideo(false);
        setOnlyAudio(true);
    };

    const handleSetOnlyAudio = (e) => {
        console.log(e.target.value);
        e.target.value === 'audio' ? setOnlyAudio(true) : setOnlyAudio(false);
    };

    return (
        <div className="container">
            <div className="header-content">
                <h1>Media Recorder</h1>
                <h2>
                    Configure your {onlyAudio ? null : 'camera and '} audio
                    devices
                </h2>
            </div>

            {isVideo && (
                <>
                    <div className="select-title">Selecting a record type</div>

                    <div
                        className="control"
                        onChange={(e) => handleSetOnlyAudio(e)}
                    >
                        <input
                            type="radio"
                            name="media"
                            value="video"
                            id="mediaVideo"
                            defaultChecked={!onlyAudio}
                        />
                        <label htmlFor="media">Video</label>
                        <input
                            type="radio"
                            name="media"
                            value="audio"
                            defaultChecked={onlyAudio}
                        />
                        <label htmlFor="media">Audio</label>
                    </div>
                </>
            )}

            <div className="settings">
                <div
                    className={[
                        'video-settings',
                        onlyAudio ? 'invisible' : null,
                    ].join(' ')}
                >
                    <div className="video-content">
                        <video
                            id="video"
                            poster="images/poster.jpg"
                            autoPlay
                            playsInline
                            ref={videoElement}
                        ></video>
                    </div>

                    <div className="select">
                        <label htmlFor="videoSource">Video source:</label>
                        <select id="videoSource" ref={videoSelect}></select>
                    </div>
                </div>

                <div className="audio-settings">
                    <div className="select">
                        <label htmlFor="audioSource">Audio input:</label>
                        <AudioMeter />
                        <select
                            id="audioSource"
                            ref={audioInputSelect}
                        ></select>
                    </div>

                    <div className="select">
                        <label htmlFor="audioOutput">Audio output:</label>
                        <select
                            id="audioOutput"
                            ref={audioOutputSelect}
                        ></select>
                    </div>

                    <div className="record-btns">
                        <button
                            disabled={isRecord ? true : false}
                            className={[
                                'btn',
                                'btn-success',
                                isRecord ? 'active' : null,
                            ].join(' ')}
                            onClick={handleRecordStream}
                        >
                            Record
                        </button>
                        <button
                            disabled={isRecord ? false : true}
                            className="btn btn-info"
                            onClick={handleRecordStop}
                        >
                            Stop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaRecorder;
