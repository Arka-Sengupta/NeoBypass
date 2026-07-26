document.addEventListener('DOMContentLoaded', function () {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
                  navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
    
    const statusMessage = document.getElementById('statusMessage');
    const errorElement = document.getElementById('error');
    const toastOpacityToggle = document.getElementById('toastOpacityToggle');
    const opacityLevelDisplay = document.getElementById('opacityLevel');
    const uninstallButton = document.getElementById('uninstallButton');
    const closeButton = document.getElementById('closeButton');
    
    // Gemini Config Elements
    const geminiApiKeyInput = document.getElementById('geminiApiKey');
    const geminiModelNameInput = document.getElementById('geminiModelName');
    const saveConfigButton = document.getElementById('saveConfigButton');
    const successMessage = document.getElementById('successMessage');

    function showError(message, duration = 3000) {
        if (!errorElement) return;
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, duration);
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function showSuccess(message, duration = 3000) {
        if (!successMessage) return;
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, duration);
    }

    // Load Gemini configuration
    function loadGeminiConfig() {
        chrome.storage.local.get(['customAPIKey', 'customModelName'], function(result) {
            if (geminiApiKeyInput && result.customAPIKey) {
                geminiApiKeyInput.value = result.customAPIKey;
            }
            if (geminiModelNameInput && result.customModelName) {
                geminiModelNameInput.value = result.customModelName;
            } else if (geminiModelNameInput) {
                geminiModelNameInput.value = 'gemini-2.5-flash'; // default
            }
        });
    }

    // Save Gemini configuration
    if (saveConfigButton) {
        saveConfigButton.addEventListener('click', () => {
            const apiKey = geminiApiKeyInput.value.trim();
            const modelName = geminiModelNameInput.value.trim();

            if (!apiKey) {
                showError('API Key cannot be empty');
                return;
            }

            if (!apiKey.startsWith('AQ.')) {
                showError('Invalid Gemini API Key. It must start with AQ.');
                return;
            }

            if (!modelName) {
                showError('Model Name cannot be empty');
                return;
            }

            chrome.storage.local.set({
                customAPIKey: apiKey,
                customModelName: modelName,
                aiProvider: 'google',
                useCustomAPI: true
            }, function() {
                showSuccess('Configuration saved successfully!');
            });
        });
    }

    loadGeminiConfig();

    function initializeOpacityLevel() {
        chrome.storage.local.get(['toastOpacityLevel'], function(result) {
            const level = result.toastOpacityLevel || 'high';
            if (opacityLevelDisplay) {
                opacityLevelDisplay.textContent = capitalizeFirstLetter(level);
            }
        });
    }

    if (toastOpacityToggle) {
        toastOpacityToggle.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: "toggleToastOpacity" }, (response) => {
                if (response && response.level) {
                    if (opacityLevelDisplay) {
                        opacityLevelDisplay.textContent = capitalizeFirstLetter(response.level);
                    }
                    showError(`Opacity set to: ${capitalizeFirstLetter(response.level)}`, 2000);
                }
            });
        });
    }

    initializeOpacityLevel();

    if (uninstallButton) {
        uninstallButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to uninstall NeoBypass?')) {
                chrome.management.uninstallSelf({ showConfirmDialog: true });
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            window.close();
        });
    }
});
