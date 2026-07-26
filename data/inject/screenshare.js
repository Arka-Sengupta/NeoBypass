// Mac detection - only declare if not already declared
let isMac;
if (typeof isMac === 'undefined') {
    isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
            navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
}

// Lists of events to intercept
const windowEvents = [
    "blur", 
    "focus", 
    "beforeunload", 
    "pagehide", 
    "unload", 
    "popstate", 
    "resize", 
    "pagehide", 
    'lostpointercapture', 
    "fullscreenchange", 
    "visibilitychange"
];

const documentEvents = [
    "paste", 
    "onpaste", 
    "visibilitychange", 
    "webkitvisibilitychange"
];

// Store original property descriptors for restoration
const originalVisibilityState = Object.getOwnPropertyDescriptor(document, 'visibilityState');
const originalWebkitVisibilityState = Object.getOwnPropertyDescriptor(document, "webkitVisibilityState");
const originalHidden = Object.getOwnPropertyDescriptor(document, "hidden");

// Event handler to prevent default behavior
const eventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
};

// Main function to bypass browser restrictions
function bypassRestrictions() {
    // Aggressively block beforeunload popup
    const blockBeforeUnload = (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        delete e['returnValue'];
    };
    
    // Add our handler with highest priority (capture phase)
    window.addEventListener('beforeunload', blockBeforeUnload, true);
    
    // Override addEventListener to block beforeunload handlers
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'beforeunload') {
            return; // Completely ignore beforeunload listeners
        }
        return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Override onbeforeunload property setter
    Object.defineProperty(window, 'onbeforeunload', {
        set: function(val) {
            // Silently ignore attempts to set onbeforeunload
        },
        get: function() {
            return null;
        },
        configurable: false
    });
    
    // Prevent window events from firing
    windowEvents.forEach(eventName => {
        // Skip unload and beforeunload events
        if (eventName !== 'unload' && eventName !== 'beforeunload') {
            window.addEventListener(eventName, eventHandler, true);
        }
    });

    // Prevent document events from firing
    documentEvents.forEach(eventName => {
        document.addEventListener(eventName, eventHandler, true);
    });

    // Override visibility state properties
    Object.defineProperty(document, "visibilityState", {
        get: () => "visible",
        configurable: true
    });

    Object.defineProperty(document, 'webkitVisibilityState', {
        get: () => "visible",
        configurable: true
    });

    Object.defineProperty(document, "hidden", {
        get: () => false,
        configurable: true
    });
}

const NP_API_BASE = 'https://api.neopass.tech';

function getNeoPassToken() {
    const port = document.getElementById('np-ss-auth-port');
    return port?.dataset?.npToken || '';
}

async function validateProAccess() {
    return true; // Bypassed: All options available for free
}

// Function to spoof screen recording behavior
function spoofScreenRecording() {
    const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
    
    // Store original method reference
    if (!navigator.mediaDevices.__originalGetDisplayMedia) {
        navigator.mediaDevices.__originalGetDisplayMedia = originalGetDisplayMedia;
    }
    
    navigator.mediaDevices.getDisplayMedia = async function(constraints) {
        // Will be handled by combined popup
        return new Promise((resolve, reject) => {
            showPopup(resolve, reject, constraints, originalGetDisplayMedia);
        });
    };
}

function showPopup(resolve, reject, constraints, originalGetDisplayMedia) {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'closed' });

    const styles = document.createElement('style');
    styles.textContent = `
        *, *::before, *::after {
            margin: 0; padding: 0; box-sizing: border-box;
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            line-height: 1.5;
            -webkit-text-fill-color: currentColor;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -45%); }
            to   { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translate(-50%, -50%); }
            to   { opacity: 0; transform: translate(-50%, -45%); }
        }
        .np-root {
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            padding: 2px;
            background-color: #c0c0c0;
            border-top: 2px solid #ffffff;
            border-left: 2px solid #ffffff;
            border-right: 2px solid #808080;
            border-bottom: 2px solid #808080;
            z-index: 2147483647;
            animation: fadeIn 0.3s ease-in;
            font-family: 'MS Sans Serif', Tahoma, sans-serif;
            color: black;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
            -webkit-text-fill-color: black;
        }
        .np-toast {
            position: relative;
            padding: 8px;
            min-width: 400px;
        }
        .np-header {
            background: linear-gradient(to right, #000080, #1084d0);
            color: white;
            padding: 2px 4px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            margin-bottom: 12px;
            -webkit-text-fill-color: white;
        }
        .np-title {
            font-size: 14px;
        }
        .np-close {
            cursor: pointer;
            background-color: #c0c0c0;
            border-top: 1px solid #ffffff;
            border-left: 1px solid #ffffff;
            border-right: 1px solid #000000;
            border-bottom: 1px solid #000000;
            font-weight: bold;
            font-size: 10px;
            width: 16px;
            height: 14px;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0;
            color: black;
            -webkit-text-fill-color: black;
        }
        .np-close:active {
            border-top: 1px solid #000000;
            border-left: 1px solid #000000;
            border-right: 1px solid #ffffff;
            border-bottom: 1px solid #ffffff;
        }
        .np-status {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 12px;
        }
        .np-info {
            margin-bottom: 16px;
            font-size: 12px;
            line-height: 1.4;
            border-top: 1px solid #808080;
            border-left: 1px solid #808080;
            border-right: 1px solid #ffffff;
            border-bottom: 1px solid #ffffff;
            padding: 8px;
            background-color: #ffffff;
        }
        .np-info .hl { font-weight: bold; }
        .np-btn-row {
            display: flex;
            flex-direction: row;
            gap: 10px;
            width: 100%;
        }
        .np-btn-wrap {
            flex: 1;
        }
        .np-btn {
            width: 100%;
            background-color: #c0c0c0;
            border-top: 2px solid #ffffff;
            border-left: 2px solid #ffffff;
            border-right: 2px solid #808080;
            border-bottom: 2px solid #808080;
            padding: 6px 8px;
            color: black;
            font-size: 12px;
            cursor: pointer;
            text-align: center;
            -webkit-text-fill-color: black;
        }
        .np-btn:active {
            border-top: 2px solid #808080;
            border-left: 2px solid #808080;
            border-right: 2px solid #ffffff;
            border-bottom: 2px solid #ffffff;
            padding: 7px 7px 5px 9px;
        }
        .np-proceed-wrap {
            display: none;
            margin-top: 12px;
        }
        .np-proceed-btn {
            width: 100%;
            background-color: #c0c0c0;
            border-top: 2px solid #ffffff;
            border-left: 2px solid #ffffff;
            border-right: 2px solid #808080;
            border-bottom: 2px solid #808080;
            padding: 6px 8px;
            color: black;
            font-size: 12px;
            cursor: pointer;
            -webkit-text-fill-color: black;
        }
        .np-proceed-btn:active {
            border-top: 2px solid #808080;
            border-left: 2px solid #808080;
            border-right: 2px solid #ffffff;
            border-bottom: 2px solid #ffffff;
            padding: 7px 7px 5px 9px;
        }
    `;
    shadow.appendChild(styles);

    const root = document.createElement('div');
    root.className = 'np-root';
    root.innerHTML = `
        <div class="np-toast">
            <div class="np-header">
                <div class="np-title">NeoBypass</div>
                <button type="button" class="np-close">x</button>
            </div>
            <div class="np-status">FullScreen ScreenShare Bypassed!</div>
            <div class="np-info">
                Now you can share <span class="hl">only the tab</span>, <span class="hl">only the Chrome window</span>,<br>
                or a <span class="hl">blank screen</span> instead of the entire screen.<br>
                You can also <span class="hl">freeze</span> your screen at a single frame.
            </div>
            <div class="np-btn-row">
                <div class="np-btn-wrap">
                    <button type="button" class="np-btn ok-btn">Share Tab/Window</button>
                </div>
                <div class="np-btn-wrap">
                    <button type="button" class="np-btn blank-btn">Share Blank Screen</button>
                </div>
                <div class="np-btn-wrap">
                    <button type="button" class="np-btn freeze-btn">Share Frozen Screen</button>
                </div>
            </div>
            <div class="np-proceed-wrap">
                <button type="button" class="np-proceed-btn">Proceed without bypass →</button>
            </div>
        </div>
    `;
    shadow.appendChild(root);

    const proceedWrap = root.querySelector('.np-proceed-wrap');

    function showAuthWall() {
        // Feature unlocked: Auth wall hidden
    }

    async function requirePro(action) {
        action(); // Unlocked
    }

    const closeBtn = root.querySelector('.np-close');
    const okBtn = root.querySelector('.ok-btn');
    const blankBtn = root.querySelector('.blank-btn');
    const freezeBtn = root.querySelector('.freeze-btn');
    const proceedBtn = root.querySelector('.np-proceed-btn');

    const cleanup = () => {
        root.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => host.remove(), 280);
    };

    closeBtn.onclick = () => {
        cleanup();
        reject(new Error('Screen share cancelled by user'));
    };

    proceedBtn.onclick = async () => {
        cleanup();
        try {
            const stream = await originalGetDisplayMedia.call(navigator.mediaDevices, constraints);
            resolve(stream);
        } catch (error) {
            reject(error);
        }
    };

    okBtn.onclick = () => requirePro(async () => {
        cleanup();
        try {
            if (isMac) {
                constraints = {
                    video: {
                        displaySurface: "browser",
                        logicalSurface: true,
                        cursor: "always"
                    },
                    audio: false,
                    selfBrowserSurface: "include",
                    surfaceSwitching: "include",
                    systemAudio: "exclude"
                };
            } else {
                constraints = {
                    selfBrowserSurface: "include",
                    monitorTypeSurfaces: "exclude",
                    video: { displaySurface: "window" }
                };
            }
    
            const stream = await originalGetDisplayMedia.call(navigator.mediaDevices, constraints);
            const videoTrack = stream.getVideoTracks()[0];
            const originalGetSettings = videoTrack.getSettings.bind(videoTrack);
            videoTrack.getSettings = function() {
                const settings = originalGetSettings();
                settings.displaySurface = 'monitor';
                return settings;
            };
            resolve(stream);
        } catch (error) {
            reject(error);
        }
    });

    blankBtn.onclick = () => requirePro(() => {
        cleanup();
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1920;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const stream = canvas.captureStream(30);
            const videoTrack = stream.getVideoTracks()[0];

            const originalGetSettings = videoTrack.getSettings.bind(videoTrack);
            videoTrack.getSettings = function() {
                const settings = originalGetSettings();
                settings.displaySurface = 'monitor';
                settings.width = 1920;
                settings.height = 1080;
                settings.frameRate = 30;
                return settings;
            };

            Object.defineProperty(videoTrack, 'label', {
                get: () => 'screen:0:0',
                configurable: true
            });

            resolve(stream);
        } catch (error) {
            reject(error);
        }
    });

    freezeBtn.onclick = () => requirePro(async () => {
        cleanup();
        const chatElements = [
            document.getElementById('chat-overlay-shadow-host'),
            document.getElementById('chat-button-shadow-host')
        ].filter(Boolean);
        try {
            chatElements.forEach(el => el.style.display = 'none');

            const realConstraints = {
                video: { displaySurface: "monitor" },
                audio: false,
                monitorTypeSurfaces: "include",
                surfaceSwitching: "exclude",
                selfBrowserSurface: "exclude",
                systemAudio: "exclude"
            };

            const realStream = await originalGetDisplayMedia.call(navigator.mediaDevices, realConstraints);
            const realTrack = realStream.getVideoTracks()[0];
            const { width, height } = realTrack.getSettings();

            const canvas = document.createElement('canvas');
            canvas.width = width || 1920;
            canvas.height = height || 1080;
            const ctx = canvas.getContext('2d');

            const video = document.createElement('video');
            video.srcObject = realStream;
            video.muted = true;
            await video.play();

            await new Promise(r => setTimeout(r, 300));

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            realStream.getTracks().forEach(t => t.stop());
            video.srcObject = null;

            chatElements.forEach(el => el.style.display = '');

            const frozenStream = canvas.captureStream(30);
            const frozenTrack = frozenStream.getVideoTracks()[0];

            const originalGetSettings = frozenTrack.getSettings.bind(frozenTrack);
            frozenTrack.getSettings = function() {
                const settings = originalGetSettings();
                settings.displaySurface = 'monitor';
                settings.width = canvas.width;
                settings.height = canvas.height;
                settings.frameRate = 30;
                return settings;
            };

            Object.defineProperty(frozenTrack, 'label', {
                get: () => 'screen:0:0',
                configurable: true
            });

            resolve(frozenStream);
        } catch (error) {
            chatElements.forEach(el => el.style.display = '');
            reject(error);
        }
    });
}

// Initialize bypasses and observer
bypassRestrictions();
spoofScreenRecording();