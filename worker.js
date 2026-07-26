
const shortcutStates = {
  'search': false,
  'search-mcq': false,
  'nptel': false,
  'customPaste': false
};


let isRequestInProgress = false;
let requestTimeout = null;

function canMakeRequest() {
    return !isRequestInProgress;
}

function blockRequests() {
    isRequestInProgress = true;
    
    
    if (requestTimeout) {
        clearTimeout(requestTimeout);
    }
    
    
    requestTimeout = setTimeout(() => {
        isRequestInProgress = false;
        console.log('[Request Block] Unblocked after 15 seconds timeout');
    }, 15000);
}

function unblockRequests() {
    isRequestInProgress = false;
    
    
    if (requestTimeout) {
        clearTimeout(requestTimeout);
        requestTimeout = null;
    }
    
    console.log('[Request Block] Unblocked after receiving response');
}


let allowedIPs = [];


const getIPs = async () => {
    try {
        const response = await fetch(chrome.runtime.getURL("metadata.json"));
        const data = await response.json();
        return data.ip || [];
    } catch (error) {
        console.error("Failed to load metadata:", error);
        return [];
    }
};


const fetchDomainIp = async (url) => {
    try {
        await getIPs();
        let hostname = new URL(url).hostname;

        
        if (hostname.includes("pscollege841.examly")) {
            return "34.171.215.232";
        }
        
        let response = await fetch(`https://dns.google/resolve?name=${hostname}`);
        let data = await response.json();

        let ip = data.Answer?.find(record => record.type === 1)?.data || null;
        return ip || null;
    } catch (error) {
        throw error;
    }
};

async function handleMessage(request, sender, sendResponse) {

    if (!sender.id && !sender.url) {
        console.error('Unauthorized sender');
        sendResponse({
            code: "Error",
            info: "Unauthorized sender"
        }); 
        return false;
    }

    try {
        const {
            id,
            type,
            instruction
        } = request;

        const {
            target,
            operation,
            args = []
        } = instruction;

        
        if (target === 'management') {
            const mockExtensionInfo = {
                description: "Prevents malpractice by identifying and blocking third-party browser extensions during tests on the Iamneo portal.",
                enabled: true,
                homepageUrl: "https://chromewebstore.google.com/detail/deojfdehldjjfmcjcfaojgaibalafifc",
                hostPermissions: ["https://*/*"],
                icons: [
                {
                    size: 16,
                    url: "chrome://extension-icon/deojfdehldjjfmcjcfaojgaibalafifc/16/0"
                },
                {
                    size: 48,
                    url: "chrome://extension-icon/deojfdehldjjfmcjcfaojgaibalafifc/48/0"
                },
                {
                    size: 128,
                    url: "chrome://extension-icon/deojfdehldjjfmcjcfaojgaibalafifc/128/0"
                }],
                id: "deojfdehldjjfmcjcfaojgaibalafifc",
                installType: "normal",
                isApp: false,
                mayDisable: true,
                name: "NeoExamShield",
                offlineEnabled: false,
                optionsUrl: "",
                permissions: [
                    "declarativeNetRequest",
                    "declarativeNetRequestWithHostAccess",
                    "management",
                    "tabs"
                ],
                shortName: "NeoExamShield",
                type: "extension",
                updateUrl: "https://clients2.google.com/service/update2/crx",
                version: "3.3",
                versionName: "Release Version"
            };

            if (operation === 'getAll') {

                sendResponse({
                    code: "Success",
                    info: [mockExtensionInfo]
                });
                return true;
            }

            if (operation === 'get') {

                sendResponse({
                    code: "Success",
                    info: mockExtensionInfo
                });
                return true;
            }
        }

        return true;
    } catch (error) {

    }
}


chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    fetchDomainIp(sender.url)
        .then(ip => {
            if (ip && allowedIPs.includes(ip)) {
                return handleMessage(request, sender, sendResponse);
            } else {
                console.log("error");
                return handleMessage(request, sender, sendResponse);
            }
        })
        .catch(error => {
            console.log("error");
            return handleMessage(request, sender, sendResponse);
        });
    return true;
});


chrome.tabs.query({}, async tabs => {
    for (let tab of tabs) {
        if (!tab.url) continue;
        let url = tab.url;

        try {
            let ip = await fetchDomainIp(url);
            if (!ip || !allowedIPs.includes(ip)) {
                chrome.tabs.reload(tab.id, () => {
                    chrome.runtime.lastError; 
                });
            }
        } catch (error) {
            
        }
    }
});


const getInstalledExtensions = () => {
    chrome.management.getAll(extensions => {});
};


setInterval(getInstalledExtensions, 3000);


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message.instruction) return false;
    handleMessage(message, sender, sendResponse);
    return true;
});





let extensionStatus = 'on';


chrome.runtime.onInstalled.addListener(() => {

    chrome.contextMenus.create({
        id: 'separator1',
        type: 'separator',
        contexts: ['editable', 'selection']
    });

    if (extensionStatus === 'on') {
        chrome.contextMenus.create({
            id: 'search',
            title: 'Search',
            contexts: ['selection']
        });
        chrome.contextMenus.create({
            id: 'solveMCQ',
            title: 'MCQ',
            contexts: ['selection']
        });
        chrome.contextMenus.create({
            id: 'separator2',
            type: 'separator',
            contexts: ['editable', 'selection']
        });
        chrome.contextMenus.create({
            id: 'nptel',
            title: 'NPTEL',
            contexts: ['selection']
        });
        
        chrome.contextMenus.create({
            id: 'solveExamly',
            title: 'Solve IamNeo/Examly Question',
            contexts: ['all']
        });

        
        chrome.contextMenus.create({
            id: 'customPaste',
            title: 'Drag and Drop Paste',
            contexts: ['editable']
        });
        chrome.contextMenus.create({
            id: 'pasteByTyping',
            title: 'Paste by Typing',
            contexts: ['editable']
        });
    }
});


function isLoggedIn(callback) {
    chrome.storage.local.get(['loggedIn'], function(result) {
        callback(result.loggedIn);
    });
}


function showLoginPrompt(tabId) {
    showToast(tabId, 'Please log in to use this feature.', true);
    chrome.action.openPopup();
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === 'search' && info.selectionText) {
            
            showSpinnerToast(tab.id, 'Analyzing question...');
            
            queryRequest(info.selectionText).then(response => {
                handleQueryResponse(response, tab.id);
            }).catch(error => {
                console.error('Context menu search error:', error);
                showToast(tab.id, 'Search failed. Please try again.', true, 'An error occurred while processing your search request.');
            });
        }

        if (info.menuItemId === 'solveMCQ' && info.selectionText) {
            
            showSpinnerToast(tab.id, 'Analyzing MCQ question...');
            
            queryRequest(info.selectionText, true).then(response => {
                handleQueryResponse(response, tab.id, true);
            }).catch(error => {
                console.error('Context menu MCQ error:', error);
                showToast(tab.id, 'MCQ search failed. Please try again.', true, 'An error occurred while processing your MCQ request.');
            });
        }
        if (info.menuItemId === 'nptel') {
            if (info.selectionText) {
                handleNPTEL({
                    result: info.selectionText
                }, tab.id); 
            } else {
                showToast(tab.id, 'No text selected', true);
            }
        }
        
        if (info.menuItemId === 'solveExamly') {
            chrome.tabs.sendMessage(tab.id, {
                action: 'solveIamneoExamly'
            });
        }

        
        if (info.menuItemId === 'customPaste') {
            
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['data/inject/customPaste.js']
            }, () => {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: async () => {
                        if (typeof performDragDropPaste === 'function') {
                            await performDragDropPaste();
                            return true;
                        }
                        return false;
                    }
                }, (results) => {
                    if (results && results[0] && !results[0].result) {
                        showToast(tab.id, 'Paste operation failed. Please try again.', true);
                    }
                });
            });
        }

        
        if (info.menuItemId === 'pasteByTyping') {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['data/inject/customPaste.js']
            }, () => {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: async () => {
                        if (typeof performPasteByTyping === 'function') {
                            await performPasteByTyping();
                            return true;
                        }
                        return false;
                    }
                }, (results) => {
                    if (results && results[0] && !results[0].result) {
                        showToast(tab.id, 'Paste by typing operation failed. Please try again.', true);
                    }
                });
            });
        }
});

chrome.commands.onCommand.addListener((command, tab) => {
        if (shortcutStates[command]) {
            return; 
        }

        shortcutStates[command] = true; 

        if (command === 'search') {
            chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                function: getSelectedText
            }, (selection) => {
                if (selection[0] && selection[0].result) {
                    
                    showSpinnerToast(tab.id, 'Analyzing question...');
                    
                    queryRequest(selection[0].result).then(response => {
                        handleQueryResponse(response, tab.id);
                        shortcutStates[command] = false; 
                    }).catch(error => {
                        console.error('Search shortcut error:', error);
                        showToast(tab.id, 'Search failed. Please try again.', true, 'An error occurred while processing your search request.');
                        shortcutStates[command] = false; 
                    });
                } else {
                    shortcutStates[command] = false; 
                }
            });
        }

        if (command === 'search-mcq') {
            chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                function: getSelectedText
            }, (selection) => {
                if (selection[0] && selection[0].result) {
                    
                    showSpinnerToast(tab.id, 'Analyzing question...');
                    
                    queryRequest(selection[0].result, true).then(response => {
                        handleQueryResponse(response, tab.id, true);
                        shortcutStates[command] = false; 
                    }).catch(error => {
                        console.error('MCQ shortcut error:', error);
                        showToast(tab.id, 'MCQ search failed. Please try again.', true, 'An error occurred while processing your MCQ request.');
                        shortcutStates[command] = false; 
                    });
                } else {
                    shortcutStates[command] = false; 
                }
            });
        }

        if (command === 'customPaste') {
            chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                func: async () => {
                    try {
                        const clipboardText = await navigator.clipboard.readText();
                        const activeElement = document.activeElement;
                        
                        if (activeElement && (activeElement.isContentEditable || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                            const start = activeElement.selectionStart || 0;
                            const end = activeElement.selectionEnd || 0;
                            const text = activeElement.value || activeElement.textContent;
                            const newText = text.substring(0, start) + clipboardText + text.substring(end);
                            
                            if (activeElement.isContentEditable) {
                                activeElement.textContent = newText;
                            } else {
                                activeElement.value = newText;
                            }
                            
                            
                            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                            activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                            return true;
                        }
                    } catch (err) {
                        console.error('Clipboard API read failed:', err);
                        return false;
                    }
                }
            }, (results) => {
                shortcutStates[command] = false; 
                if (results && results[0] && !results[0].result) {
                    showToast(tab.id, 'Paste failed. Please try again.', true);
                }
            });
        }

        if (command === 'nptel') {
            chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                function: getSelectedText
            }, (results) => {
                if (results[0] && results[0].result) {
                    handleNPTEL(results[0], tab.id); 
                }
                shortcutStates[command] = false; 
            });
        }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "checkLoginStatus") {
        chrome.storage.local.get(["loggedIn"], function(result) {
            sendResponse({
                loggedIn: result.loggedIn === true
            });
        });
        return true; 
    }

    if (message.action === "showLoginPrompt") {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, (tabs) => {
            if (tabs.length > 0) {
                showLoginPrompt(tabs[0].id); 
            }
        });
    }
});



function handleNPTEL(result, tabId) {
    const selectedText = result.result; 
    if (selectedText) {
        
        const bestAnswers = findAnswer(selectedText); 

        if (bestAnswers) {
            if (Array.isArray(bestAnswers) && bestAnswers.length > 0) {
                
                const uniqueAnswers = [...new Set(bestAnswers)];
                
                
                let answersString;
                if (uniqueAnswers.length > 1) {
                    
                    answersString = 'Could be:\n' + uniqueAnswers.map((answer, index) => `${index + 1}. ${answer}`).join('\n'); 
                } else {
                    answersString = uniqueAnswers[0]; 
                }
                showNPTELToast(tabId, answersString); 
            } else {
                showNPTELToast(tabId, 'Answer not found.\nPlease select only the question.', true);
            }
        } else {
            showNPTELToast(tabId, 'Answer not found.\nPlease select only the question.', true);
        }
    } else {
        showNPTELToast(tabId, 'No text selected', true);
    }
}



function getSelectedText() {
    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) {
        chrome.runtime.sendMessage({
            action: 'showToast',
            message: 'No text selected',
            isError: true
        });
        return '';
    }
    return selectedText;
}

function handleQueryResponse(response, tabId, isMCQ = false) {
    if (response && typeof response === 'string') {
        
        if (isMCQ) {
            showMCQToast(tabId, response);
        } else {
            copyToClipboard(response);
            showToast(tabId, 'Copied to Clipboard!');
        }
    } else if (response && response.error) {
        
        const { error, errorType, detailedInfo } = response;
        
        
        switch (errorType) {
            case 'rateLimit':
                showToast(tabId, error, true, detailedInfo || 'You have exceeded your request limit. Please wait before trying again.');
                break;
            case 'auth':
                showToast(tabId, error, true, detailedInfo || 'Please log in or refresh your session to continue using the service.');
                break;
            case 'forbidden':
                showToast(tabId, error, true, detailedInfo || 'Access to this feature is restricted. Please check your account status.');
                break;
            case 'server':
                showToast(tabId, error, true, detailedInfo || 'The service is experiencing issues. Please try again in a few moments.');
                break;
            case 'network':
                showToast(tabId, error, true, detailedInfo || 'Please check your internet connection and try again.');
                break;
            case 'client':
                showToast(tabId, error, true, detailedInfo || 'There was an issue with your request. Try rephrasing or shortening your text.');
                break;
            default:
                showToast(tabId, error, true, detailedInfo || 'An unexpected error occurred. Please try again after 30 seconds.');
        }
    } else {
        
        showToast(tabId, 'Service unavailable. Please try again after 30s.', true, 'The service did not respond. This may be due to high server load or maintenance.');
    }
}

function handleQueryResponseForIamNeoExamly(response, tabId, isMCQ = false, isHackerRank = false, isMultipleChoice = false, isTyped = false) {
    if (response && typeof response === 'string') {
        
        if (isMCQ) {
            chrome.tabs.sendMessage(tabId, {
                action: 'clickMCQOption',
                response: response,
                isHackerRank: isHackerRank,
                isMultipleChoice: isMultipleChoice
            });
        } else {
            
            const cleanedCode = response.trim()
                .replace(/^```[a-zA-Z0-9]*\s*\n?/, '')
                .replace(/\n?```\s*$/, '');

            // Copy to clipboard as fallback
            copyToClipboard(cleanedCode);

            if (isTyped) {
                // Typed mode: call _neopassStartTyping to type character-by-character
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: function(code) {
                        console.log('[INJECTED] Calling _neopassStartTyping, code length:', code.length);
                        if (typeof window._neopassStartTyping === 'function') {
                            window._neopassStartTyping(code);
                        } else {
                            console.error('[INJECTED] _neopassStartTyping not found on window');
                        }
                    },
                    args: [cleanedCode],
                    world: 'MAIN'
                }).catch(function(err) {
                    console.error('[worker.js] executeScript (typed) failed:', err);
                });
            } else {
                
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: function(code) {
                        
                        var answerEl = document.querySelector('[aria-labelledby="editor-answer"]');
                        if (answerEl) {
                            try {
                                var ed = ace.edit(answerEl);
                                ed.setValue(code);
                                ed.clearSelection();
                                ed.navigateFileEnd();
                            } catch(e) {}
                        } else {
                            
                            var editors = document.querySelectorAll('.ace_editor');
                            editors.forEach(function(el) {
                                try {
                                    var ed = ace.edit(el);
                                    if (!ed.getReadOnly()) {
                                        ed.setValue(code);
                                        ed.clearSelection();
                                        ed.navigateFileEnd();
                                    }
                                } catch(e) {}
                            });
                        }
                    },
                    args: [cleanedCode],
                    world: 'MAIN'
                }).catch(function(err) {
                    console.error('[worker.js] executeScript failed:', err);
                });
            }
        }
    } else if (response && response.error) {
        
        const { error, errorType, detailedInfo } = response;
        
        
        switch (errorType) {
            case 'rateLimit':
                showToast(tabId, error, true, detailedInfo || 'You have exceeded your request limit. Please wait before trying again.');
                break;
            case 'auth':
                showToast(tabId, error, true, detailedInfo || 'Please log in or refresh your session to continue using the service.');
                break;
            case 'forbidden':
                showToast(tabId, error, true, detailedInfo || 'Access to this feature is restricted. Please check your account status.');
                break;
            case 'server':
                showToast(tabId, error, true, detailedInfo || 'The service is experiencing issues. Please try again in a few moments.');
                break;
            case 'network':
                showToast(tabId, error, true, detailedInfo || 'Please check your internet connection and try again.');
                break;
            case 'client':
                showToast(tabId, error, true, detailedInfo || 'There was an issue with your request. Try rephrasing or shortening your text.');
                break;
            default:
                showToast(tabId, error, true, detailedInfo || 'An unexpected error occurred. Please try again after 30 seconds.');
        }
    } else {
        
        showToast(tabId, 'Service unavailable. Please try again after 30s.', true, 'The service did not respond. This may be due to high server load or maintenance.');
    }
}





async function queryRequest(text, isMCQ = false, isMultipleChoice = false, tabId = null) {
    
    if (!canMakeRequest()) {
        console.log('[Request Block] Request blocked - another request is in progress');
        return { 
            error: 'Please wait for your previous request to complete.', 
            errorType: 'rateLimit',
            detailedInfo: 'Multiple simultaneous requests are not allowed. Please wait a moment before trying again.'
        };
    }
    
    
    blockRequests();
    
    try {
        
        const customAPIConfig = await getCustomAPIConfig();
        
        if (customAPIConfig.useCustomAPI && customAPIConfig.apiKey) {
            const result = await queryCustomAPI(text, isMCQ, isMultipleChoice, customAPIConfig);
            unblockRequests();
            return result;
        }
        
        
        const {
            accessToken,
            refreshToken,
            isPro
        } = await getTokens();

        
        if (!accessToken || !refreshToken) {
            unblockRequests();
            
            
            if (tabId) {
                showToast(tabId, 'Please configure your API key or login with Pro', true, 'Free users must provide their own API keys in the Settings tab. Click the extension icon to configure.');
            }
            
            
            setTimeout(() => {
                try {
                    chrome.action.openPopup();
                } catch (e) {
                    console.log('Could not open popup automatically:', e.message);
                }
            }, 1000);
            
            return { 
                error: 'Please configure your custom API key in Settings or login with Pro to use our proxy-server.', 
                errorType: 'auth',
                detailedInfo: 'Free users must provide their own API keys in the Settings tab to use this extension.'
            };
        }

        
        const API_URL = `${API_BASE_URL}/api/pro-text`;
        const body = {
            prompt: text,
            refreshToken: refreshToken  
        };

        if (isMCQ) {
            if (isMultipleChoice) {
                
                body.prompt += "\nIMPORTANT: This is a MULTIPLE CHOICE question where MULTIPLE options can be correct. Analyze the question carefully and provide ALL correct options.\n\nFormat your response EXACTLY like this:\n- If options are A, B, C and A and C are correct: 'A. [text of option A], C. [text of option C]'\n- If options are 1, 2, 3 and 1 and 3 are correct: '1. [text of option 1], 3. [text of option 3]'\n- If only one option is correct, provide just that one: 'B. [text of option B]'\n\nDO NOT include explanations, reasoning, or anything else. ONLY the correct option(s) in the exact format shown above, separated by commas if multiple.\nIf this is not an MCQ question, simply respond with 'Not an MCQ'";
            } else {
                
                body.prompt += "\nIMPORTANT: This is a SINGLE CHOICE question where ONLY ONE option is correct. Analyze the question carefully and provide the single correct option.\n\nFormat your response EXACTLY like this:\n- If options are A, B, C: 'A. [text of option A]' or 'C. [text of option C]'\n- If options are 1, 2, 3: '1. [text of option 1]' or '3. [text of option 3]'\n\nDO NOT include explanations, reasoning, or anything else. ONLY the single correct answer in the exact format shown above.\nIf this is not an MCQ question, simply respond with 'Not an MCQ'";
            }
        }
        console.log('[queryRequest] Sending request to API', API_URL, 'with body:', body);
        try {
            let response = await makeAuthenticatedRequest(API_URL, 'POST', accessToken, body);

            
            
            if (!response.ok && (response.status === 401 || response.status === 403)) {
                console.log('[queryRequest] Authentication failed - session expired');
                chrome.storage.local.remove(['accessToken', 'refreshToken', 'loggedIn']);
                return { 
                    error: 'Session expired. Please log in again.', 
                    errorType: 'auth',
                    detailedInfo: 'Your session has expired. Please log in again to continue using NeoPass features.'
                };
            }

            if (!response.ok) {
                let errorMessage = 'An unexpected error occurred. Please try again.';
                let errorType = 'general';
                let detailedInfo = `Server responded with status ${response.status}`;
                
                try {
                    const errorData = await response.json();
                console.error("Error querying:", errorData);
                
                
                if (response.status === 429) {
                    errorType = 'rateLimit';
                    if (errorData.error && errorData.error.includes('Token limit exceeded')) {
                        errorMessage = 'Token limit exceeded. Please upgrade or wait for your limit to reset.';
                        if (errorData.details) {
                            detailedInfo = `You have used ${errorData.details.used} out of ${errorData.details.limit} tokens. ${errorData.details.remaining} tokens remaining.`;
                        } else {
                            detailedInfo = 'You have reached your token limit for this billing period.';
                        }
                    } else if (errorData.message && errorData.message.includes('Daily request limit exceeded')) {
                        errorMessage = 'Daily request limit exceeded. Please try again tomorrow.';
                        detailedInfo = `You have reached your daily request limit. ${errorData.nextReset ? `Limit resets at ${new Date(errorData.nextReset).toLocaleString()}` : 'Limit resets daily at midnight UTC.'}`;
                    } else if (errorData.message && errorData.message.includes('wait for your previous request')) {
                        errorMessage = 'Please wait for your previous request to complete.';
                        detailedInfo = 'Multiple simultaneous requests are not allowed. Please wait a moment before trying again.';
                    } else {
                        errorMessage = 'Too many requests. Please wait before trying again.';
                        detailedInfo = 'Rate limit exceeded. Please wait a few moments before making another request.';
                    }
                } else if (response.status === 403) {
                    errorType = 'forbidden';
                    
                    
                    if ((errorData.error && (errorData.error.includes('Pro subscription') || errorData.error.includes('active Pro subscription') || errorData.error.includes('subscription') || errorData.error.includes('expired'))) ||
                        (errorData.message && (errorData.message.includes('subscription') || errorData.message.includes('expired')))) {
                        errorMessage = 'Pro subscription required or expired.';
                        detailedInfo = 'This service requires an active Pro subscription. Please upgrade or renew your Pro subscription.';
                        
                        
                        chrome.storage.local.remove(['accessToken', 'refreshToken', 'loggedIn', 'username', 'isPro', 'loginTimestamp']);
                        console.log('🔒 Auto-logout: Pro subscription expired');
                    } else if (errorData.message && errorData.message.includes('star')) {
                        errorMessage = 'Please star the repository to use this service.';
                        detailedInfo = 'This service requires starring the GitHub repository. Please star it and try again.';
                    } else {
                        errorMessage = 'Access denied. Please check your account status.';
                        detailedInfo = 'Your request was denied. This may be due to account restrictions or service limitations.';
                    }
                } else if (response.status === 500) {
                    errorType = 'server';
                    errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
                    detailedInfo = 'The server encountered an internal error. This is usually temporary and should resolve shortly.';
                } else if (response.status === 400) {
                    errorType = 'client';
                    errorMessage = 'Invalid request. Please try rephrasing your question.';
                    detailedInfo = 'The request format was invalid. Try shortening your text or rephrasing your question.';
                } else {
                    errorMessage = errorData.message || `Server error (${response.status})`;
                    detailedInfo = errorData.error || `HTTP ${response.status}: ${errorMessage}`;
                }
                } catch (parseError) {
                    console.error("Error parsing error response:", parseError);
                    detailedInfo = `HTTP ${response.status}: Unable to parse error details`;
                }
                
                return { error: errorMessage, errorType, detailedInfo };
            }

            const responseData = await response.json();
            
            
            
            if (responseData.newAccessToken) {
                await chrome.storage.local.set({ accessToken: responseData.newAccessToken });
                console.log('✅ Access token auto-refreshed by server and stored');
            }
            
            return responseData.text;
        } catch (error) {
            console.error("Error querying:", error);
            let errorMessage = 'Network error. Please check your connection and try again.';
            let errorType = 'network';
            let detailedInfo = 'Failed to connect to the service. This could be due to network issues or service downtime.';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Unable to connect to the service. Please try again.';
                detailedInfo = 'Network connection failed. Please check your internet connection and try again.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Request timed out. Please try again.';
                detailedInfo = 'The request took too long to complete. This may be due to high server load.';
            } else {
                detailedInfo = error.message || 'An unexpected error occurred during the request.';
            }
            
            return { error: errorMessage, errorType, detailedInfo };
        }
    } catch (error) {
        console.error("Error in queryRequest:", error);
        return { 
            error: 'An unexpected error occurred.', 
            errorType: 'general',
            detailedInfo: error.message || 'Failed to process the request.'
        };
    } finally {
        
        unblockRequests();
    }
}
async function getCustomAPIConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get([
            'useCustomAPI',
            'aiProvider',
            'customEndpoint',
            'customAPIKey',
            'customModelName'
        ], (result) => {
            resolve({
                useCustomAPI: true, 
                aiProvider: 'google', 
                customEndpoint: result.customEndpoint || '',
                apiKey: result.customAPIKey || '',
                modelName: result.customModelName || 'gemini-2.5-flash'
            });
        });
    });
}


async function queryCustomAPI(text, isMCQ, isMultipleChoice, config) {
    const { aiProvider, customEndpoint, apiKey, modelName } = config;
    
    if (!apiKey || !apiKey.startsWith('AQ.')) {
        return {
            error: 'Gemini API Key missing or invalid',
            errorType: 'config',
            detailedInfo: 'Please configure a valid Gemini API Key (starts with AQ.) in the extension popup.'
        };
    }
    
    
    let prompt = text;
    if (isMCQ) {
        if (isMultipleChoice) {
            prompt += "\nIMPORTANT: This is a MULTIPLE CHOICE question where MULTIPLE options can be correct. Analyze the question carefully and provide ALL correct options.\n\nFormat your response EXACTLY like this:\n- If options are A, B, C and A and C are correct: 'A. [text of option A], C. [text of option C]'\n- If options are 1, 2, 3 and 1 and 3 are correct: '1. [text of option 1], 3. [text of option 3]'\n- If only one option is correct, provide just that one: 'B. [text of option B]'\n\nDO NOT include explanations, reasoning, or anything else. ONLY the correct option(s) in the exact format shown above, separated by commas if multiple.\nIf this is not an MCQ question, simply respond with 'Not an MCQ'";
        } else {
            prompt += "\nIMPORTANT: This is a SINGLE CHOICE question where ONLY ONE option is correct. Analyze the question carefully and provide the single correct option.\n\nFormat your response EXACTLY like this:\n- If options are A, B, C: 'A. [text of option A]' or 'C. [text of option C]'\n- If options are 1, 2, 3: '1. [text of option 1]' or '3. [text of option 3]'\n\nDO NOT include explanations, reasoning, or anything else. ONLY the single correct answer in the exact format shown above.\nIf this is not an MCQ question, simply respond with 'Not an MCQ'";
        }
    }
    
    try {
        let apiUrl, requestBody, headers;
        
        
        switch (aiProvider) {
            case 'openai':
                apiUrl = 'https://api.openai.com/v1/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                requestBody = {
                    model: modelName || 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 1
                };
                break;
                
            case 'anthropic':
                apiUrl = 'https://api.anthropic.com/v1/messages';
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                };
                requestBody = {
                    model: modelName || 'claude-3-5-sonnet-20241022',
                    max_tokens: 4096,
                    messages: [{ role: 'user', content: prompt }]
                };
                break;
                
            case 'google':
                let googleModel = modelName || 'gemini-flash-latest';
                if (googleModel.startsWith('models/')) {
                    googleModel = googleModel.replace('models/', '');
                }
                // Force a working model since gemini-2.5-flash is no longer available to new users
                if (googleModel === 'gemini-2.5-flash') {
                    googleModel = 'gemini-flash-latest';
                }
                apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${apiKey}`;
                headers = {
                    'Content-Type': 'application/json'
                };
                requestBody = {
                    contents: [{ parts: [{ text: prompt }] }]
                };
                break;
                
            case 'deepseek':
                apiUrl = 'https://api.deepseek.com/v1/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                requestBody = {
                    model: modelName || 'deepseek-chat',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                };
                break;
                
            case 'custom':
                if (!customEndpoint) {
                    return {
                        error: 'Custom endpoint not configured',
                        errorType: 'config',
                        detailedInfo: 'Please configure a custom API endpoint in the extension settings.'
                    };
                }
                apiUrl = customEndpoint;
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                requestBody = {
                    model: modelName || 'default',
                    messages: [{ role: 'user', content: prompt }]
                };
                break;
                
            default:
                return {
                    error: 'Unknown AI provider',
                    errorType: 'config',
                    detailedInfo: 'The selected AI provider is not supported.'
                };
        }
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                error: `API request failed: ${response.status}`,
                errorType: 'api',
                detailedInfo: errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`
            };
        }
        
        const data = await response.json();
        
        
        let responseText;
        switch (aiProvider) {
            case 'openai':
            case 'deepseek':
                responseText = data.choices?.[0]?.message?.content;
                break;
                
            case 'anthropic':
                responseText = data.content?.[0]?.text;
                break;
                
            case 'google':
                responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                break;
                
            case 'custom':
                
                responseText = data.choices?.[0]?.message?.content || 
                              data.content?.[0]?.text || 
                              data.response || 
                              data.text;
                break;
        }
        
        if (!responseText) {
            return {
                error: 'Invalid API response format',
                errorType: 'parse',
                detailedInfo: 'Could not extract response text from API response.'
            };
        }
        
        return responseText;
        
    } catch (error) {
        return {
            error: 'Network or API error',
            errorType: 'network',
            detailedInfo: error.message || 'Failed to connect to the custom AI API. Please check your configuration.'
        };
    }
}


const API_BASE_URL = 'https://api.neopass.tech';


async function getTokens() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['accessToken', 'refreshToken', 'isPro'], resolve);
    });
}


async function makeAuthenticatedRequest(url, method, token, body = null, extraHeaders = {}) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...extraHeaders
    };

    const options = {
        method,
        headers,
        ...(body && {
            body: JSON.stringify(body)
        })
    };

    return fetch(url, options);
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "testCustomAPI") {
        (async () => {
            try {
                const config = message.config;
                const testPrompt = "Hello, this is a test message. Please respond with 'API connection successful!' if you receive this.";
                
                const result = await queryCustomAPI(testPrompt, false, false, config);
                
                if (typeof result === 'string') {
                    sendResponse({
                        success: true,
                        message: 'API connection successful!'
                    });
                } else {
                    sendResponse({
                        success: false,
                        error: result.detailedInfo || result.error
                    });
                }
            } catch (error) {
                sendResponse({
                    success: false,
                    error: error.message || 'Unknown error occurred'
                });
            }
        })();
        return true; 
    }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "processChatMessage") {
        
        (async () => {
            try {
                await handleChatMessage(message, sender);
                sendResponse({
                    success: true
                });
            } catch (error) {
                console.error('Chat processing error:', error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            }
        })();
        return true; 
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractData') {
        (async () => {
            try {
                
                let queryText;
                if (request.isCoding) {
                    if (request.isHackerRank) {
                        
                        queryText = `You are solving a HackerRank coding problem. Provide ONLY the complete solution code that can be directly run.

IMPORTANT REQUIREMENTS:
- Provide ONLY the solution code, no explanations or comments
- The code must be complete and ready to run
- Include all necessary imports and function definitions
- Handle input/output exactly as specified
- Ensure the solution passes all test cases

${request.question}

Respond with ONLY the ${request.programmingLanguage} code:`;
                    } else {
                        
                        queryText = `Instructions: You are tasked with solving a programming problem. Respond strictly with the solution code in the required programming language. 
                            Ensure the code: Meets the requirements outlined in the problem statement.
                            Stricly Passes all test cases, including edge cases and boundary conditions.
                            Always get the input from the users.` +
                            `Question:\n${request.question}\n\n` +
                            (request.programmingLanguage ? `Solve Striclty Using This Programing Language:\n${request.programmingLanguage}` : '') +
                        (request.inputFormat ? `Input Format:\n${request.inputFormat}\n\n` : '') +
                        (request.outputFormat ? `Output Format:\n${request.outputFormat}\n\n` : '') +
                        (request.testCases ? `Test Cases:\n${request.testCases}` : '') +
                        (request.headerSnippet ? `\n\nHeader Snippet (pre-existing code before your answer, DO NOT include this in your response):\n${request.headerSnippet}` : '') +
                        (request.footerSnippet ? `\n\nFooter Snippet (pre-existing code after your answer, DO NOT include this in your response):\n${request.footerSnippet}` : '') +
                        (request.whitelist ? `\n\nWhitelisted Keywords (you MUST use these keywords/identifiers in your solution):\n${request.whitelist}` : '');
                    }
                } else {
                    // MCQ handling with support for multiple choice
                    queryText = request.code ?
                        `${request.question.trim()}\nCode:\n${request.code.trim()}\nOptions:\n${request.options.trim()}` :
                        `${request.question.trim()}\nOptions:\n${request.options.trim()}`;
                }

                // Add console logging for the prompt
                console.log('Sending prompt to API:', {
                    type: request.isCoding ? 'Coding Question' : 'MCQ',
                    prompt: queryText,
                    length: queryText.length
                });                
                const response = await queryRequest(queryText, request.isMCQ, request.isMultipleChoice, sender.tab.id);
                
                
                if (response && typeof response === 'string') {
                    
                    console.log('AI Response received:', {
                        type: request.isCoding ? 'Coding Question' : 'MCQ',
                        isHackerRank: request.isHackerRank,
                        isMultipleChoice: request.isMultipleChoice,
                        response: response,
                        responseLength: response.length
                    });
                    
                    handleQueryResponseForIamNeoExamly(response, sender.tab.id, request.isMCQ, request.isHackerRank, request.isMultipleChoice, request.isTyped);
                    sendResponse({
                        success: true,
                        response,
                        status: 'success'
                    });
                } else if (response && response.error) {
                    
                    handleQueryResponseForIamNeoExamly(response, sender.tab.id, request.isMCQ, request.isHackerRank, request.isMultipleChoice, request.isTyped);
                    sendResponse({
                        error: response.error,
                        status: 'error',
                        errorType: response.errorType
                    });
                } else {
                    
                    console.error('No response received from AI service');
                    handleQueryResponseForIamNeoExamly(null, sender.tab.id, request.isMCQ, request.isHackerRank, request.isMultipleChoice);
                    sendResponse({
                        error: 'No response from query service',
                        status: 'error',
                        errorType: 'general'
                    });
                }

            } catch (error) {
                console.error("Query processing error:", error);
                
                
                showToast(sender.tab.id, 'An unexpected error occurred. Please try again.', true, 'The request failed due to an unexpected error. This may be temporary.');
                
                sendResponse({
                    error: error.message,
                    status: 'error',
                    details: error.toString()
                });
            }
        })();

        return true; 
    }
});

async function handleChatMessage(message, sender) {
    try {
        
        const customAPIConfig = await getCustomAPIConfig();
        
        if (customAPIConfig.useCustomAPI && customAPIConfig.apiKey) {
            
            const chatPrompt = message.context 
                ? `Context: ${message.context}\n\nUser: ${message.message}\n\nPlease provide a helpful response.`
                : message.message;
                
            const result = await queryCustomAPI(chatPrompt, false, false, customAPIConfig);
            
            if (typeof result === 'string') {
                sendChatResponse(sender.tab.id, result);
            } else {
                sendChatErrorResponse(sender.tab.id, result.error || 'Failed to get response from custom API');
            }
            return;
        }
        
        
        const {
            accessToken,
            refreshToken,
            isPro
        } = await getTokens();

        
        if (!accessToken || !refreshToken) {
            sendChatErrorResponse(sender.tab.id, "Please configure your custom API key in Settings or login with Pro to use our proxy-server.");
            return;
        }

        
        const chatEndpoint = `${API_BASE_URL}/api/pro-chat`;

        const requestBody = {
            message: message.message,
            context: message.context,
            refreshToken: refreshToken  
        };

        
        if (message.image) {
            requestBody.image = message.image;
        }

        let response = await makeAuthenticatedRequest(
            chatEndpoint,
            "POST",
            accessToken,
            requestBody,
            {
                'X-Neo-Response-Format': 'text-stream'
            }
        );

        
        
        if (!response.ok && (response.status === 401 || response.status === 403)) {
            
            try {
                const errorData = await response.json();
                if (errorData.message && errorData.message.includes('subscription')) {
                    
                    sendChatErrorResponse(sender.tab.id, "Your Pro subscription is required or has expired. Please upgrade or renew.");
                    return;
                }
            } catch (e) {
                
            }
            
            
            chrome.storage.local.remove(['accessToken', 'refreshToken', 'loggedIn']);
            sendChatErrorResponse(sender.tab.id, "Session expired. Please log in again.");
            return;
        }

        
        if (!response.ok) {
            let errorMessage = "Sorry, I encountered an error processing your message.";
            
            try {
                const errorData = await response.json();
                
                if (response.status === 429) {
                    if (errorData.error && errorData.error.includes('Token limit exceeded')) {
                        errorMessage = "Token limit exceeded. Please upgrade or wait for your limit to reset.";
                        if (errorData.details) {
                            errorMessage += ` (Used: ${errorData.details.used}/${errorData.details.limit})`;
                        }
                    } else if (errorData.message && errorData.message.includes('Daily request limit exceeded')) {
                        errorMessage = "You've reached your daily chat limit. Please try again tomorrow.";
                    } else if (errorData.message && errorData.message.includes('wait for your previous request')) {
                        errorMessage = "Please wait for your previous message to be processed before sending another.";
                    } else {
                        errorMessage = "Too many requests. Please wait a moment before trying again.";
                    }
                } else if (response.status === 403) {
                    
                    if ((errorData.error && (errorData.error.includes('Pro subscription') || errorData.error.includes('active Pro subscription') || errorData.error.includes('subscription') || errorData.error.includes('expired'))) ||
                        (errorData.message && (errorData.message.includes('subscription') || errorData.message.includes('expired')))) {
                        errorMessage = "Your Pro subscription is required or has expired. Please upgrade or renew your Pro subscription to continue using this service.";
                        
                        
                        chrome.storage.local.remove(['accessToken', 'refreshToken', 'loggedIn', 'username', 'isPro', 'loginTimestamp']);
                        console.log('🔒 Auto-logout: Pro subscription expired');
                    } else if (errorData.message && errorData.message.includes('star')) {
                        errorMessage = "Please star the repository to use the chat feature.";
                    } else {
                        errorMessage = "Access denied. Please check your account status or try logging in again.";
                    }
                } else if (response.status === 500) {
                    errorMessage = "The chat service is temporarily unavailable. Please try again in a moment.";
                } else if (response.status === 400) {
                    errorMessage = "Your message couldn't be processed. Try rephrasing or shortening it.";
                } else {
                    errorMessage = errorData.message || `Service error (${response.status}). Please try again.`;
                }
            } catch (parseError) {
                console.error("Error parsing chat error response:", parseError);
                errorMessage = `Chat service error (${response.status}). Please try again later.`;
            }
            
            
            sendChatErrorResponse(sender.tab.id, errorMessage);
            return;
        }

        
        const newAccessToken = response.headers.get('X-New-Access-Token');
        if (newAccessToken) {
            await chrome.storage.local.set({ accessToken: newAccessToken });
            console.log('✅ Access token auto-refreshed during chat request and stored');
        }

        const responseContentType = (response.headers.get('content-type') || '').toLowerCase();

        if (responseContentType.includes('application/json')) {
            const data = await response.json();
            const content = typeof data?.content === 'string' ? data.content : '';

            if (content) {
                sendChatResponse(sender.tab.id, content);
            } else {
                sendChatErrorResponse(sender.tab.id, 'No response received. Please try again.');
            }
            return;
        }

        // Read the plain-text stream produced by pipeTextStreamToResponse.
        // The server sends raw text deltas; each read() call yields one or more
        // text chunks that are concatenated directly into the response.
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        let receivedChunks = false;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            if (chunk) {
                accumulatedText += chunk;
                receivedChunks = true;
                // Send incremental streaming update to the chatbot UI
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: "updateChatHistory",
                    role: "assistant",
                    content: accumulatedText,
                    isStreaming: true
                });
            }
        }

        // Flush any bytes remaining in the decoder after the stream closes
        const finalChunk = decoder.decode();
        if (finalChunk) {
            accumulatedText += finalChunk;
            receivedChunks = true;
        }

        // Finalise: send full accumulated text (isStreaming unset → chatbot.js closes the streaming div)
        if (receivedChunks) {
            sendChatResponse(sender.tab.id, accumulatedText);
        } else {
            sendChatErrorResponse(sender.tab.id, "No response received. Please try again.");
        }
    } catch (error) {
        console.error("Chat processing error:", error);
        
        let errorMessage = "Sorry, I encountered an error processing your message.";
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = "Unable to connect to the chat service. Please check your connection and try again.";
        } else if (error.message.includes('timeout')) {
            errorMessage = "The request timed out. Please try again.";
        } else {
            errorMessage = "Sorry, I encountered an unexpected error. Please try again or log in again if the issue persists.";
        }
        
        sendChatErrorResponse(sender.tab.id, errorMessage);
    }
}


function sendChatResponse(tabId, content) {
    chrome.tabs.sendMessage(tabId, {
        action: "updateChatHistory",
        role: "assistant",
        content: content
    });
}


function sendChatErrorResponse(tabId, content) {
    chrome.tabs.sendMessage(tabId, {
        action: "updateChatHistory",
        role: "error",
        content: content
    });
}













async function copyToClipboard(text, tabId) {
    try {
        
        await chrome.scripting.executeScript({
            target: {
                tabId: tabId
            },
            func: async (content) => {
                try {
                    await navigator.clipboard.writeText(content);
                } catch (err) {
                    
                    const textarea = document.createElement('textarea');
                    textarea.textContent = content;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                }
            },
            args: [text]
        });
        return true;
    } catch (err) {
        console.error('Failed to copy text:', err);
        return false;
    }
}

function copyToClipboard(text) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function(tabs) {
        if (tabs[0]) {
            chrome.scripting.executeScript({
                target: {
                    tabId: tabs[0].id
                },
                func: async function(content) {
                    try {
                        await navigator.clipboard.writeText(content);
                    } catch (err) {
                        
                        const textarea = document.createElement('textarea');
                        textarea.textContent = content;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                    }
                },
                args: [text]
            });
        }
    });
}

async function checkStealthMode() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['stealth'], (result) => {
            resolve(result.stealth === true);
        });
    });
}


const opacityLevels = {
    high: 1.0,
    medium: 0.5,
    low: 0.2
};


let currentOpacityLevel = "high";


let activeToastId = null;


function removeExistingToast(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: function() {
            
            const toastSelectors = [
                '#neopass-active-toast',
                '#stealth-mode-toast',
                '.neopass-update-toast',
                '[id*="toast"]',
                '[class*="toast"]'
            ];
            
            toastSelectors.forEach(selector => {
                const existingToasts = document.querySelectorAll(selector);
                existingToasts.forEach(toast => {
                    if (toast && toast.parentNode) {
                        toast.style.opacity = '0';
                        toast.style.transform = 'translateY(10px) translateX(-50%)';
                        setTimeout(() => {
                            if (toast.parentNode) {
                                toast.remove();
                            }
                        }, 100);
                    }
                });
            });
        }
    });
}


async function toggleToastOpacity() {
    
    switch (currentOpacityLevel) {
        case "high":
            currentOpacityLevel = "medium";
            break;
        case "medium":
            currentOpacityLevel = "low";
            break;
        case "low":
            currentOpacityLevel = "high";
            break;
        default:
            currentOpacityLevel = "high";
    }

    
    await chrome.storage.local.set({
        'toastOpacityLevel': currentOpacityLevel
    });

    
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function(tabs) {
        if (tabs[0]) {
            showOpacityLevelToast(tabs[0].id, `Toast opacity set to: ${currentOpacityLevel}`);
        }
    });

    return currentOpacityLevel;
}


async function getToastOpacity() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['toastOpacityLevel'], (result) => {
            if (result.toastOpacityLevel) {
                currentOpacityLevel = result.toastOpacityLevel;
            }
            resolve(opacityLevels[currentOpacityLevel] || 1.0);
        });
    });
}


function showOpacityLevelToast(tabId, message) {
    
    removeExistingToast(tabId);
    
    chrome.scripting.executeScript({
        target: {
            tabId: tabId
        },
        func: function(msg, opacityLevel) {
            
            const toast = document.createElement('div');
            toast.id = 'neopass-active-toast'; 
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.backgroundColor = 'rgba(15, 15, 20, 0.95)';
            toast.style.color = '#f8f9fa';
            toast.style.padding = '14px 16px';
            toast.style.borderRadius = '8px';
            toast.style.zIndex = '999999';
            toast.style.opacity = opacityLevel;
            toast.style.transition = 'all 0.3s ease';
            toast.style.maxWidth = '320px';
            toast.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            toast.style.backdropFilter = 'blur(10px)';
            toast.style.WebkitBackdropFilter = 'blur(10px)';
            
            
            const headerContainer = document.createElement('div');
            headerContainer.style.display = 'flex';
            headerContainer.style.justifyContent = 'space-between';
            headerContainer.style.alignItems = 'center';
            
            
            const messageContainer = document.createElement('div');
            messageContainer.style.display = 'flex';
            messageContainer.style.alignItems = 'center';
            messageContainer.style.gap = '10px';
            messageContainer.style.flexGrow = '1';
            
            
            const settingsIcon = document.createElement('span');
            settingsIcon.style.display = 'inline-block';
            settingsIcon.style.width = '8px';
            settingsIcon.style.height = '8px';
            settingsIcon.style.backgroundColor = '#64b5f6';
            settingsIcon.style.borderRadius = '50%';
            settingsIcon.style.boxShadow = '0 0 4px rgba(100, 181, 246, 0.6)';
            
            
            const messageText = document.createElement('span');
            messageText.textContent = msg;
            messageText.style.fontSize = '14px';
            messageText.style.fontWeight = '500';
            messageText.style.lineHeight = '1.4';
            messageText.style.wordBreak = 'break-word';
            
            messageContainer.appendChild(settingsIcon);
            messageContainer.appendChild(messageText);
            
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            closeBtn.title = 'Close';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.color = 'rgba(255, 255, 255, 0.8)';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.padding = '2px';
            closeBtn.style.marginLeft = '8px';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.lineHeight = '0';
            closeBtn.style.transition = 'all 0.2s';
            
            
            const opacityIndicator = document.createElement('div');
            opacityIndicator.style.marginTop = '10px';
            opacityIndicator.style.width = '100%';
            opacityIndicator.style.display = 'flex';
            opacityIndicator.style.alignItems = 'center';
            opacityIndicator.style.justifyContent = 'space-between';
            opacityIndicator.style.gap = '8px';
            
            
            function createOpacityBadge(level, text, isActive) {
                const badge = document.createElement('div');
                badge.textContent = text;
                badge.style.fontSize = '11px';
                badge.style.padding = '3px 6px';
                badge.style.borderRadius = '4px';
                badge.style.fontWeight = isActive ? '600' : '400';
                
                if (isActive) {
                    badge.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    badge.style.color = 'white';
                } else {
                    badge.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    badge.style.color = 'rgba(255, 255, 255, 0.5)';
                }
                
                return badge;
            }
            
            
            const lowBadge = createOpacityBadge('low', 'Low', opacityLevel <= 0.2);
            const mediumBadge = createOpacityBadge('medium', 'Medium', opacityLevel > 0.2 && opacityLevel < 1.0);
            const highBadge = createOpacityBadge('high', 'High', opacityLevel >= 1.0);
            
            opacityIndicator.appendChild(lowBadge);
            opacityIndicator.appendChild(mediumBadge);
            opacityIndicator.appendChild(highBadge);
            
            
            closeBtn.onmouseover = function() {
                closeBtn.style.color = '#ffffff';
                closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            };
            
            closeBtn.onmouseout = function() {
                closeBtn.style.color = 'rgba(255, 255, 255, 0.8)';
                closeBtn.style.backgroundColor = 'transparent';
            };
            
            closeBtn.onclick = function() {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px) translateX(-50%)';
                setTimeout(() => toast.remove(), 300);
            };
            
            
            headerContainer.appendChild(messageContainer);
            headerContainer.appendChild(closeBtn);
            
            toast.appendChild(headerContainer);
            toast.appendChild(opacityIndicator);
            
            document.body.appendChild(toast);
            
            
            toast.style.transform = 'translateY(10px) translateX(-50%)';
            setTimeout(() => {
                toast.style.transform = 'translateY(0) translateX(-50%)';
            }, 10);
            
            
            let hideTimeoutId = setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px) translateX(-50%)';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        },
        args: [message, opacityLevels[currentOpacityLevel]]
    });
}


async function showToast(tabId, message, isError = false, detailedInfo = '') {
    const opacity = await getToastOpacity();
    
    // Set default detailed info if not provided
    if (!detailedInfo) {
        if (isError) {
            detailedInfo = 'Possible causes:\n• Network connection issues\n• Server timeout\n• Authorization issues\n• Extension needs to be updated';
        } else {
            detailedInfo = 'Operation completed successfully.';
        }
    }

    
    await removeExistingToast(tabId);

    chrome.scripting.executeScript({
        target: {
            tabId: tabId
        },
        func: function(msg, isError, opacity, detailedInfo) {
            
            const toast = document.createElement('div');
            toast.id = 'neopass-active-toast'; 
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.zIndex = '999999';
            toast.style.opacity = opacity;
            toast.style.transition = 'all 0.3s ease';
            toast.style.maxWidth = '320px';

            if (isError) {
                toast.style.backgroundColor = '#c0c0c0';
                toast.style.color = 'black';
                toast.style.padding = '8px';
                toast.style.borderRadius = '0';
                toast.style.fontFamily = "'MS Sans Serif', Tahoma, sans-serif";
                toast.style.boxShadow = '2px 2px 5px rgba(0, 0, 0, 0.5)';
                toast.style.borderTop = '2px solid #ffffff';
                toast.style.borderLeft = '2px solid #ffffff';
                toast.style.borderRight = '2px solid #808080';
                toast.style.borderBottom = '2px solid #808080';
                toast.style.backdropFilter = 'none';
                toast.style.WebkitBackdropFilter = 'none';
            } else {
                toast.style.backgroundColor = 'rgba(15, 15, 20, 0.95)';
                toast.style.color = '#f8f9fa';
                toast.style.padding = '14px 16px';
                toast.style.borderRadius = '8px';
                toast.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                toast.style.backdropFilter = 'blur(10px)';
                toast.style.WebkitBackdropFilter = 'blur(10px)';
            }
            
            
            const headerContainer = document.createElement('div');
            headerContainer.style.display = 'flex';
            headerContainer.style.justifyContent = 'space-between';
            headerContainer.style.alignItems = 'flex-start';
            
            
            const messageContainer = document.createElement('div');
            messageContainer.style.flexGrow = '1';
            messageContainer.style.marginRight = '12px';
            
            
            const indicatorDot = document.createElement('span');
            indicatorDot.style.display = 'inline-block';
            indicatorDot.style.width = '8px';
            indicatorDot.style.height = '8px';
            indicatorDot.style.backgroundColor = isError ? '#ff6b6b' : '#4ade80';
            indicatorDot.style.borderRadius = '50%';
            indicatorDot.style.marginRight = '8px';
            indicatorDot.style.boxShadow = isError ? '0 0 4px rgba(255, 107, 107, 0.6)' : '0 0 4px rgba(74, 222, 128, 0.6)';
            
            
            const messageText = document.createElement('span');
            messageText.textContent = msg;
            messageText.style.fontSize = '14px';
            messageText.style.fontWeight = '500';
            messageText.style.lineHeight = '1.4';
            messageText.style.wordBreak = 'break-word';
            
            
            const messageContent = document.createElement('div');
            messageContent.style.display = 'flex';
            messageContent.style.alignItems = 'center';
            messageContent.appendChild(indicatorDot);
            messageContent.appendChild(messageText);
            
            messageContainer.appendChild(messageContent);
            
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.alignItems = 'center';
            buttonsContainer.style.marginLeft = '8px';
            
            
            const infoBtn = document.createElement('button');
            infoBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
            infoBtn.title = 'Show more information';
            infoBtn.style.background = 'none';
            infoBtn.style.border = 'none';
            infoBtn.style.color = isError ? 'black' : 'rgba(255, 255, 255, 0.8)';
            infoBtn.style.cursor = 'pointer';
            infoBtn.style.padding = '2px';
            infoBtn.style.marginRight = '6px';
            infoBtn.style.borderRadius = '4px';
            infoBtn.style.lineHeight = '0';
            infoBtn.style.transition = 'all 0.2s';
            
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            closeBtn.title = 'Close';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.color = isError ? 'black' : 'rgba(255, 255, 255, 0.8)';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.padding = '2px';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.lineHeight = '0';
            closeBtn.style.transition = 'all 0.2s';

            
            const detailedInfoContainer = document.createElement('div');
            detailedInfoContainer.style.marginTop = '12px';
            detailedInfoContainer.style.padding = '10px 12px';
            detailedInfoContainer.style.backgroundColor = isError ? 'rgba(255, 107, 107, 0.1)' : 'rgba(255, 255, 255, 0.1)';
            detailedInfoContainer.style.borderRadius = '6px';
            detailedInfoContainer.style.fontSize = '13px';
            detailedInfoContainer.style.display = 'none';
            detailedInfoContainer.style.maxHeight = '120px';
            detailedInfoContainer.style.overflow = 'auto';
            detailedInfoContainer.style.lineHeight = '1.4';
            detailedInfoContainer.style.color = isError ? 'rgba(255, 107, 107, 0.9)' : 'rgba(255, 255, 255, 0.9)';
            detailedInfoContainer.textContent = detailedInfo;

            
            let expanded = false;
            let hideTimeoutId = null;
            
            infoBtn.onmouseover = function() {
                infoBtn.style.color = isError ? '#ff6b6b' : '#ffffff';
                infoBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            };
            
            infoBtn.onmouseout = function() {
                infoBtn.style.color = isError ? 'rgba(255, 107, 107, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                infoBtn.style.backgroundColor = 'transparent';
            };
            
            closeBtn.onmouseover = function() {
                closeBtn.style.color = isError ? '#ff6b6b' : '#ffffff';
                closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            };
            
            closeBtn.onmouseout = function() {
                closeBtn.style.color = isError ? 'rgba(255, 107, 107, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                closeBtn.style.backgroundColor = 'transparent';
            };
            
            infoBtn.onclick = function() {
                expanded = !expanded;
                detailedInfoContainer.style.display = expanded ? 'block' : 'none';
                infoBtn.innerHTML = expanded ? 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>' : 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
                
                
                if (expanded) {
                    if (hideTimeoutId) {
                        clearTimeout(hideTimeoutId);
                        hideTimeoutId = null;
                    }
                } else {
                    
                    hideTimeoutId = setTimeout(() => {
                        toast.style.opacity = '0';
                        toast.style.transform = 'translateY(10px) translateX(-50%)';
                        setTimeout(() => toast.remove(), 300);
                    }, 5000);
                }
            };
            
            closeBtn.onclick = function() {
                
                if (hideTimeoutId) {
                    clearTimeout(hideTimeoutId);
                    hideTimeoutId = null;
                }
                
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px) translateX(-50%)';
                setTimeout(() => toast.remove(), 300);
            };

            
            buttonsContainer.appendChild(infoBtn);
            buttonsContainer.appendChild(closeBtn);
            headerContainer.appendChild(messageContainer);
            headerContainer.appendChild(buttonsContainer);
            
            toast.appendChild(headerContainer);
            toast.appendChild(detailedInfoContainer);
            
            document.body.appendChild(toast);

            
            toast.style.transform = 'translateY(10px) translateX(-50%)';
            setTimeout(() => {
                toast.style.transform = 'translateY(0) translateX(-50%)';
            }, 10);

            
            hideTimeoutId = setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px) translateX(-50%)';
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        },
        args: [message, isError, opacity, detailedInfo]
    });
}


async function showStealthToast(tabId, message, stealthEnabled) {
    const opacity = await getToastOpacity();
    
    
    await removeExistingToast(tabId);

    chrome.scripting.executeScript({
        target: {
            tabId: tabId
        },
        func: function(msg, stealthEnabled, opacity) {
            
            const toast = document.createElement('div');
            toast.id = 'neopass-active-toast'; 
            
            
            const textColor = stealthEnabled ? '#4ade80' : '#ff6b6b';
            
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.backgroundColor = 'rgba(15, 15, 20, 0.95)';
            toast.style.color = '#f8f9fa';
            toast.style.padding = '14px 16px';
            toast.style.borderRadius = '8px';
            toast.style.zIndex = '999999';
            toast.style.opacity = opacity;
            toast.style.transition = 'all 0.3s ease';
            toast.style.maxWidth = '480px';
            toast.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            toast.style.backdropFilter = 'blur(10px)';
            toast.style.WebkitBackdropFilter = 'blur(10px)';
            
            
            const headerContainer = document.createElement('div');
            headerContainer.style.display = 'flex';
            headerContainer.style.justifyContent = 'space-between';
            headerContainer.style.alignItems = 'center';
            
            
            const messageContainer = document.createElement('div');
            messageContainer.style.display = 'flex';
            messageContainer.style.alignItems = 'center';
            messageContainer.style.gap = '10px';
            messageContainer.style.flexGrow = '1';
            messageContainer.style.marginRight = '12px';
            
            
            const indicatorDot = document.createElement('span');
            indicatorDot.style.display = 'inline-block';
            indicatorDot.style.width = '8px';
            indicatorDot.style.height = '8px';
            indicatorDot.style.backgroundColor = textColor;
            indicatorDot.style.borderRadius = '50%';
            indicatorDot.style.boxShadow = `0 0 4px ${stealthEnabled ? 'rgba(74, 222, 128, 0.6)' : 'rgba(255, 107, 107, 0.6)'}`;
            
            
            const messageText = document.createElement('span');
            messageText.innerHTML = msg.replace(/\n/g, '<br>');
            messageText.style.fontSize = '14px';
            messageText.style.fontWeight = '500';
            messageText.style.lineHeight = '1.4';
            messageText.style.wordBreak = 'break-word';
            messageText.style.color = textColor;
            messageText.style.textAlign = 'center';
            messageText.style.flex = '1';
            
            messageContainer.appendChild(indicatorDot);
            messageContainer.appendChild(messageText);
            
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            closeBtn.title = 'Close';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.color = 'rgba(255, 255, 255, 0.8)';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.padding = '2px';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.lineHeight = '0';
            closeBtn.style.transition = 'all 0.2s';
            
            
            closeBtn.onmouseover = function() {
                closeBtn.style.color = '#ffffff';
                closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            };
            
            closeBtn.onmouseout = function() {
                closeBtn.style.color = 'rgba(255, 255, 255, 0.8)';
                closeBtn.style.backgroundColor = 'transparent';
            };
            
            closeBtn.onclick = function() {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px) translateX(-50%)';
                setTimeout(() => toast.remove(), 300);
            };
            
            
            headerContainer.appendChild(messageContainer);
            headerContainer.appendChild(closeBtn);
            
            toast.appendChild(headerContainer);
            
            document.body.appendChild(toast);

            
            toast.style.transform = 'translateY(10px) translateX(-50%)';
            setTimeout(() => {
                toast.style.transform = 'translateY(0) translateX(-50%)';
            }, 10);

            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px) translateX(-50%)';
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        },
        args: [message, stealthEnabled, opacity]
    });

    
    chrome.storage.local.set({ stealth: stealthEnabled });
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleToastOpacity') {
        toggleToastOpacity()
            .then(newLevel => {
                sendResponse({
                    success: true,
                    level: newLevel
                });
            })
            .catch(error => {
                console.error("Error toggling opacity:", error);
                sendResponse({
                    success: false,
                    error: error.toString()
                });
            });
        return true; 
    }

});


chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['toastOpacityLevel'], (result) => {
        if (result.toastOpacityLevel) {
            currentOpacityLevel = result.toastOpacityLevel;
        }
    });
});


chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        tabDetails = tab;
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        tabDetails = tab;
    }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        return;
    }
    chrome.tabs.query({
        active: true,
        windowId: windowId
    }, (tabs) => {
        if (tabs.length > 0) {
            tabDetails = tabs[0];
        }
    });
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    currentKey = message.key;
    if (message.action === "pageReloaded" || message.action === "windowFocus") {} else if (message.action === "openNewTab") {
        openNewMinimizedWindowWithUrl(message.url);
    }
    if (message.action === 'showToast') {
        showToast(sender.tab.id, message.message, message.isError);
    }
    if (message.action === 'showStealthToast') {
        showStealthToast(sender.tab.id, message.message, message.stealthEnabled);
    }
    if (message.action === 'showMCQToast') {
        showMCQToast(sender.tab.id, message.message);
    }
});


chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        
        if (changes.refreshToken && changes.refreshToken.newValue === undefined) {
            
            chrome.storage.local.remove(['accessToken', 'refreshToken', 'loggedIn', 'username']);

            
            chrome.tabs.query({}, function(tabs) {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                            action: 'remoteLogout'
                        })
                        .catch(() => {}); 
                });
            });
        }
    }
});


const log = (...args) => chrome.storage.local.get({
    log: false
}, prefs => prefs.log && console.log(...args));

const activate = () => {
    if (activate.busy) {
        return;
    }
    activate.busy = true;

    chrome.storage.local.get({
        enabled: true
    }, async prefs => {
        try {
            await chrome.scripting.unregisterContentScripts();

            if (prefs.enabled) {
                const props = {
                    'matches': ['*://*/*'],
                    'allFrames': true,
                    'matchOriginAsFallback': true,
                    'runAt': 'document_start'
                };
                await chrome.scripting.registerContentScripts([{
                    ...props,
                    'id': 'main',
                    'js': ['data/inject/main.js'],
                    'world': 'MAIN'
                }, {
                    ...props,
                    'id': 'isolated',
                    'js': ['data/inject/isolated.js'],
                    'world': 'ISOLATED'
                }]);
            }
        } catch (e) {
            chrome.action.setBadgeBackgroundColor({
                color: '#b16464'
            });
            chrome.action.setBadgeText({
                text: 'E'
            });
            chrome.action.setTitle({
                title: 'Blocker Registration Failed: ' + e.message
            });
            console.error('Blocker Registration Failed', e);
        }
        activate.busy = false;
    });
};

chrome.runtime.onStartup.addListener(activate);
chrome.runtime.onInstalled.addListener(activate);
chrome.storage.onChanged.addListener(ps => {
    if (ps.enabled) {
        activate();
    }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'processSnippets') {
        const {
            snippets
        } = message;

        if (!snippets.header && !snippets.footer) {
            showToast(sender.tab.id, 'No snippets found', true);
            return;
        }

        const combinedText = `// Header Snippet\n${snippets.header}\n\n// Footer Snippet\n${snippets.footer}`;

        
        copyToClipboard(combinedText);
        showToast(sender.tab.id, 'Snippets copied to clipboard');
    }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'extractCodingQuestion') {
        const {
            data
        } = message;

        
        const formattedText = `Programming Language:
${data.programmingLanguage}

Question:
${data.question}

Input Format:
${data.inputFormat}

Output Format:
${data.outputFormat}

Sample Test Cases:
${data.testCases}`;

        
        copyToClipboard(formattedText);
        showToast(sender.tab.id, 'Coding question details copied to clipboard');
    }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'resetContext') {
        
        console.log('Chat context reset requested from tab:', sender.tab?.id);
        
        
        
        if (sendResponse) {
            sendResponse({ success: true, message: 'Context reset' });
        }
    }
});


const SESSION_DURATION = 12 * 60 * 60 * 1000; 



async function checkAndHandleSessionExpiration() {
    try {
        const data = await chrome.storage.local.get(['loggedIn', 'loginTimestamp']);

        if (data.loggedIn && data.loginTimestamp) {
            const currentTime = Date.now();
            if (currentTime - data.loginTimestamp > SESSION_DURATION) {
                console.log('24-hour session timeout reached, logging out user');

                
                await chrome.storage.local.remove(['accessToken', 'refreshToken', 'loggedIn', 'username', 'loginTimestamp', 'stealth', 'useCustomAPI', 'aiProvider', 'customEndpoint', 'customAPIKey', 'customModelName']);

                
                chrome.tabs.query({}, function(tabs) {
                    tabs.forEach(tab => {
                        
                        try {
                            chrome.tabs.sendMessage(tab.id, {
                                    action: 'sessionExpired'
                                })
                                .catch(() => {}); 
                        } catch (err) {
                            
                        }

                        
                        try {
                            chrome.tabs.reload(tab.id);
                        } catch (err) {
                            
                        }
                    });
                });
            }
        }
    } catch (error) {
        console.error('Error checking session expiration:', error);
    }
}


chrome.alarms.create('sessionExpirationCheck', {
    periodInMinutes: 5 
});


chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'sessionExpirationCheck') {
        checkAndHandleSessionExpiration();
    }
    
});


chrome.runtime.onStartup.addListener(() => {
    checkAndHandleSessionExpiration();
});

chrome.runtime.onInstalled.addListener(() => {
    checkAndHandleSessionExpiration();
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    if (message.action) {
        checkAndHandleSessionExpiration();
    }

    return true; 
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'sessionExpired') {
        
        showToast(sender.tab.id, 'Your session has expired after 24 hours. Please log in again.', true);
        sendResponse({
            success: true
        });
    }
    return true; 
});


function findAnswer(query) {
    const normalizedQuery = normalizeText(query); 
    const bestAnswers = []; 
    let smallestDistance = Infinity; 

    for (const item of dataset) {
        const normalizedQuestion = normalizeText(item.question); 
        const distance = levenshteinDistance(normalizedQuery, normalizedQuestion);

        
        const threshold = 15; 
        if (distance <= threshold) {
            if (distance < smallestDistance) {
                smallestDistance = distance; 
                bestAnswers.length = 0; 
                bestAnswers.push(item.answer); 
            } else if (distance === smallestDistance) {
                bestAnswers.push(item.answer); 
            }
        }
    }

    return bestAnswers.length > 0 ? bestAnswers : null; 
}


function levenshteinDistance(s1, s2) {
    const dp = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1).fill(0));

    for (let i = 0; i <= s1.length; i++) {
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                dp[i][j] = j; 
            } else if (j === 0) {
                dp[i][j] = i; 
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1, 
                    dp[i][j - 1] + 1, 
                    dp[i - 1][j - 1] + (s1[i - 1] === s2[j - 1] ? 0 : 1) 
                );
            }
        }
    }
    return dp[s1.length][s2.length];
}


function normalizeText(text) {
    return text
        .toLowerCase() 
        .replace(/[-]/g, ' ') 
        .replace(/[^\w\s]/g, '') // Remove all non-word characters (except whitespace)
        .trim(); // Trim leading and trailing spaces
}

// Load NPTEL dataset from JSON file
let dataset = [];
async function loadNptelDataset() {
    try {
        const response = await fetch(chrome.runtime.getURL('data/nptel.json'));
        dataset = await response.json();
        console.log(`NPTEL dataset loaded: ${dataset.length} questions`);
    } catch (error) {
        console.error('Failed to load NPTEL dataset:', error);
    }
}


loadNptelDataset();


async function showMCQToast(tabId, message, detailedInfo = '') {
    const opacity = await getToastOpacity();
    
    // Set default detailed info if not provided
    if (!detailedInfo) {
        detailedInfo = 'This is the answer to the MCQ question based on analysis of the question content. If you received an incorrect answer, please try rephrasing your question or providing more context.';
    }

    // Remove any existing toast first
    await removeExistingToast(tabId);

    chrome.scripting.executeScript({
        target: {
            tabId: tabId
        },
        func: function(msg, opacity, detailedInfo) {
            // Check if this is "Not an MCQ" response
            const isNotMCQ = msg.toLowerCase().includes("not an mcq");
            
            // Create toast container
            const toast = document.createElement('div');
            toast.id = 'neopass-active-toast'; 
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.backgroundColor = 'rgba(15, 15, 20, 0.95)';
            toast.style.color = '#f8f9fa';
            toast.style.padding = '14px 16px';
            toast.style.borderRadius = '8px';
            toast.style.zIndex = '999999';
            toast.style.opacity = opacity;
            toast.style.transition = 'all 0.3s ease';
            toast.style.maxWidth = '400px';
            toast.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            toast.style.backdropFilter = 'blur(10px)';
            toast.style.WebkitBackdropFilter = 'blur(10px)';
            
            
            const headerContainer = document.createElement('div');
            headerContainer.style.display = 'flex';
            headerContainer.style.justifyContent = 'space-between';
            headerContainer.style.alignItems = 'center';
            
            
            const answerContainer = document.createElement('div');
            answerContainer.style.display = 'flex';
            answerContainer.style.alignItems = 'center';
            answerContainer.style.flexGrow = '1';
            
            if (!isNotMCQ) {
                
                let optionIdentifier, optionAnswer;
                
                
                const match = msg.match(/^([A-Za-z0-9]+)\.?\s+(.+)$/);
                
                if (match) {
                    optionIdentifier = match[1].trim();
                    optionAnswer = match[2].trim();
                } else {
                    
                    const parts = msg.split(' ');
                    optionIdentifier = parts[0].replace('.', '');
                    optionAnswer = parts.slice(1).join(' ');
                }
                
                // Determine if option is letter or number based
                const isLetter = /^[A-Za-z]$/.test(optionIdentifier);
                const optionColor = isLetter ? '#4285f4' : '#f4b400'; 
                
                
                const optionDot = document.createElement('div');
                optionDot.style.width = '22px';
                optionDot.style.height = '22px';
                optionDot.style.backgroundColor = optionColor;
                optionDot.style.color = 'white';
                optionDot.style.borderRadius = '50%';
                optionDot.style.display = 'flex';
                optionDot.style.alignItems = 'center';
                optionDot.style.justifyContent = 'center';
                optionDot.style.marginRight = '10px';
                optionDot.style.fontWeight = 'bold';
                optionDot.style.fontSize = '12px';
                optionDot.style.boxShadow = `0 2px 4px ${optionColor}66`;
                optionDot.textContent = optionIdentifier.toUpperCase();
                
                
                const answerText = document.createElement('span');
                answerText.textContent = optionAnswer;
                answerText.style.fontSize = '14px';
                answerText.style.fontWeight = '500';
                
                answerContainer.appendChild(optionDot);
                answerContainer.appendChild(answerText);
            } else {
                
                const messageText = document.createElement('span');
                messageText.textContent = msg;
                messageText.style.fontSize = '14px';
                messageText.style.fontWeight = '500';
                
                answerContainer.appendChild(messageText);
            }
            
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.alignItems = 'center';
            buttonsContainer.style.marginLeft = '10px';
            
            
            const infoBtn = document.createElement('button');
            infoBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
            infoBtn.title = 'Show more information';
            infoBtn.style.background = 'none';
            infoBtn.style.border = 'none';
            infoBtn.style.color = 'rgba(255, 255, 255, 0.8)';
            infoBtn.style.cursor = 'pointer';
            infoBtn.style.padding = '2px';
            infoBtn.style.marginRight = '6px';
            infoBtn.style.borderRadius = '4px';
            infoBtn.style.lineHeight = '0';
            infoBtn.style.transition = 'all 0.2s';
            
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            closeBtn.title = 'Close';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.color = 'rgba(255, 255, 255, 0.8)';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.padding = '2px';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.lineHeight = '0';
            closeBtn.style.transition = 'all 0.2s';
            
            
            const detailedInfoContainer = document.createElement('div');
            detailedInfoContainer.style.marginTop = '12px';
            detailedInfoContainer.style.padding = '10px 12px';
            detailedInfoContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            detailedInfoContainer.style.borderRadius = '6px';
            detailedInfoContainer.style.fontSize = '13px';
            detailedInfoContainer.style.display = 'none';
            detailedInfoContainer.style.maxHeight = '120px';
            detailedInfoContainer.style.overflow = 'auto';
            detailedInfoContainer.style.lineHeight = '1.4';
            detailedInfoContainer.style.color = 'rgba(255, 255, 255, 0.9)';
            detailedInfoContainer.textContent = isNotMCQ ? 
                'The selected text does not appear to be a multiple-choice question. Please try selecting a valid MCQ.' : 
                detailedInfo;
            
            
            let expanded = false;
            let hideTimeoutId = null;
            
            infoBtn.onmouseover = function() {
                infoBtn.style.color = '#ffffff';
                infoBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            };
            
            infoBtn.onmouseout = function() {
                infoBtn.style.color = 'rgba(255, 255, 255, 0.8)';
                infoBtn.style.backgroundColor = 'transparent';
            };
            
            closeBtn.onmouseover = function() {
                closeBtn.style.color = '#ffffff';
                closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            };
            
            closeBtn.onmouseout = function() {
                closeBtn.style.color = 'rgba(255, 255, 255, 0.8)';
                closeBtn.style.backgroundColor = 'transparent';
            };
            
            infoBtn.onclick = function() {
                expanded = !expanded;
                detailedInfoContainer.style.display = expanded ? 'block' : 'none';
                infoBtn.innerHTML = expanded ? 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>' : 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
                
                
                if (expanded) {
                    if (hideTimeoutId) {
                        clearTimeout(hideTimeoutId);
                        hideTimeoutId = null;
                    }
                } else {
                    
                    hideTimeoutId = setTimeout(() => {
                        toast.style.opacity = '0';
                        toast.style.transform = 'translateY(10px) translateX(-50%)';
                        setTimeout(() => toast.remove(), 300);
                    }, 5000);
                }
            };
            
            closeBtn.onclick = function() {
                
                if (hideTimeoutId) {
                    clearTimeout(hideTimeoutId);
                    hideTimeoutId = null;
                }
                
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px) translateX(-50%)';
                setTimeout(() => toast.remove(), 300);
            };
            
            
            buttonsContainer.appendChild(infoBtn);
            buttonsContainer.appendChild(closeBtn);
            headerContainer.appendChild(answerContainer);
            headerContainer.appendChild(buttonsContainer);
            
            toast.appendChild(headerContainer);
            toast.appendChild(detailedInfoContainer);
            
            document.body.appendChild(toast);
            
            
            toast.style.transform = 'translateY(10px) translateX(-50%)';
            setTimeout(() => {
                toast.style.transform = 'translateY(0) translateX(-50%)';
            }, 10);

            
            hideTimeoutId = setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px) translateX(-50%)';
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        },
        args: [message, opacity, detailedInfo]
    });
}


async function showNPTELToast(tabId, message, isError = false, detailedInfo = '') {
    const opacity = await getToastOpacity();
    
    // Set default detailed info if not provided
    if (!detailedInfo) {
        if (isError) {
            detailedInfo = 'Possible issues with NPTEL search:\n• The question may not be in our database\n• Try selecting only the exact question text\n• The question might be newly added to NPTEL';
        } else {
            detailedInfo = 'This answer was found by matching your question with the NPTEL question database. The confidence level depends on how closely your selected text matches a known question.';
        }
    }

    
    await removeExistingToast(tabId);

    chrome.scripting.executeScript({
        target: {
            tabId: tabId
        },
        func: function(msg, isError, opacity, detailedInfo) {
            
            const toast = document.createElement('div');
            toast.id = 'neopass-active-toast'; 
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.zIndex = '999999';
            toast.style.opacity = opacity;
            toast.style.transition = 'all 0.3s ease';
            toast.style.maxWidth = '320px';

            if (isError) {
                toast.style.backgroundColor = '#c0c0c0';
                toast.style.color = 'black';
                toast.style.padding = '8px';
                toast.style.borderRadius = '0';
                toast.style.fontFamily = "'MS Sans Serif', Tahoma, sans-serif";
                toast.style.boxShadow = '2px 2px 5px rgba(0, 0, 0, 0.5)';
                toast.style.borderTop = '2px solid #ffffff';
                toast.style.borderLeft = '2px solid #ffffff';
                toast.style.borderRight = '2px solid #808080';
                toast.style.borderBottom = '2px solid #808080';
                toast.style.backdropFilter = 'none';
                toast.style.WebkitBackdropFilter = 'none';
            } else {
                toast.style.backgroundColor = 'rgba(15, 15, 20, 0.95)';
                toast.style.color = '#f8f9fa';
                toast.style.padding = '14px 16px';
                toast.style.borderRadius = '8px';
                toast.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                toast.style.backdropFilter = 'blur(10px)';
                toast.style.WebkitBackdropFilter = 'blur(10px)';
            }
            
            
            const headerContainer = document.createElement('div');
            headerContainer.style.display = 'flex';
            headerContainer.style.justifyContent = 'space-between';
            headerContainer.style.alignItems = 'flex-start';
            
            
            const messageContainer = document.createElement('div');
            messageContainer.style.flexGrow = '1';
            messageContainer.style.marginRight = '12px';
            
            
            const indicatorDot = document.createElement('span');
            indicatorDot.style.display = 'inline-block';
            indicatorDot.style.width = '8px';
            indicatorDot.style.height = '8px';
            indicatorDot.style.backgroundColor = isError ? '#ff6b6b' : '#4ade80';
            indicatorDot.style.borderRadius = '50%';
            indicatorDot.style.marginRight = '8px';
            indicatorDot.style.boxShadow = isError ? '0 0 4px rgba(255, 107, 107, 0.6)' : '0 0 4px rgba(74, 222, 128, 0.6)';
            
            
            const messageText = document.createElement('span');
            messageText.innerHTML = msg.replace(/\n/g, '<br>'); 
            messageText.style.fontSize = '14px';
            messageText.style.fontWeight = '500';
            messageText.style.lineHeight = '1.4';
            messageText.style.wordBreak = 'break-word';
            
            
            const messageContent = document.createElement('div');
            messageContent.style.display = 'flex';
            messageContent.style.alignItems = 'center';
            messageContent.appendChild(indicatorDot);
            messageContent.appendChild(messageText);
            
            messageContainer.appendChild(messageContent);
            
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.alignItems = 'center';
            buttonsContainer.style.marginLeft = '8px';
            
            
            const infoBtn = document.createElement('button');
            infoBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
            infoBtn.title = 'Show more information';
            infoBtn.style.background = 'none';
            infoBtn.style.border = 'none';
            infoBtn.style.color = isError ? 'black' : 'rgba(255, 255, 255, 0.8)';
            infoBtn.style.cursor = 'pointer';
            infoBtn.style.padding = '2px';
            infoBtn.style.marginRight = '6px';
            infoBtn.style.borderRadius = '4px';
            infoBtn.style.lineHeight = '0';
            infoBtn.style.transition = 'all 0.2s';
            
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            closeBtn.title = 'Close';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.color = isError ? 'black' : 'rgba(255, 255, 255, 0.8)';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.padding = '2px';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.lineHeight = '0';
            closeBtn.style.transition = 'all 0.2s';

            
            const detailedInfoContainer = document.createElement('div');
            detailedInfoContainer.style.marginTop = '12px';
            detailedInfoContainer.style.padding = '10px 12px';
            detailedInfoContainer.style.backgroundColor = isError ? 'rgba(255, 107, 107, 0.1)' : 'rgba(255, 255, 255, 0.1)';
            detailedInfoContainer.style.borderRadius = '6px';
            detailedInfoContainer.style.fontSize = '13px';
            detailedInfoContainer.style.display = 'none';
            detailedInfoContainer.style.maxHeight = '120px';
            detailedInfoContainer.style.overflow = 'auto';
            detailedInfoContainer.style.lineHeight = '1.4';
            detailedInfoContainer.style.color = isError ? 'rgba(255, 107, 107, 0.9)' : 'rgba(255, 255, 255, 0.9)';
            detailedInfoContainer.textContent = detailedInfo;

            
            let expanded = false;
            let hideTimeoutId = null;
            
            infoBtn.onmouseover = function() {
                infoBtn.style.color = isError ? '#ff6b6b' : '#ffffff';
                infoBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            };
            
            infoBtn.onmouseout = function() {
                infoBtn.style.color = isError ? 'rgba(255, 107, 107, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                infoBtn.style.backgroundColor = 'transparent';
            };
            
            closeBtn.onmouseover = function() {
                closeBtn.style.color = isError ? '#ff6b6b' : '#ffffff';
                closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            };
            
            closeBtn.onmouseout = function() {
                closeBtn.style.color = isError ? 'rgba(255, 107, 107, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                closeBtn.style.backgroundColor = 'transparent';
            };
            
            infoBtn.onclick = function() {
                expanded = !expanded;
                detailedInfoContainer.style.display = expanded ? 'block' : 'none';
                infoBtn.innerHTML = expanded ? 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>' : 
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
                
                
                if (expanded) {
                    if (hideTimeoutId) {
                        clearTimeout(hideTimeoutId);
                        hideTimeoutId = null;
                    }
                } else {
                    
                    hideTimeoutId = setTimeout(() => {
                        toast.style.opacity = '0';
                        toast.style.transform = 'translateY(10px) translateX(-50%)';
                        setTimeout(() => toast.remove(), 300);
                    }, 5000);
                }
            };
            
            closeBtn.onclick = function() {
                
                if (hideTimeoutId) {
                    clearTimeout(hideTimeoutId);
                    hideTimeoutId = null;
                }
                
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px) translateX(-50%)';
                setTimeout(() => toast.remove(), 300);
            };

            
            buttonsContainer.appendChild(infoBtn);
            buttonsContainer.appendChild(closeBtn);
            headerContainer.appendChild(messageContainer);
            headerContainer.appendChild(buttonsContainer);
            
            toast.appendChild(headerContainer);
            toast.appendChild(detailedInfoContainer);
            
            document.body.appendChild(toast);

            
            toast.style.transform = 'translateY(10px) translateX(-50%)';
            setTimeout(() => {
                toast.style.transform = 'translateY(0) translateX(-50%)';
            }, 10);

            
            hideTimeoutId = setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px) translateX(-50%)';
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        },
        args: [message, isError, opacity, detailedInfo]
    });
}

async function showSpinnerToast(tabId, message = 'Processing your request...') {
    const opacity = await getToastOpacity();
    
    
    await removeExistingToast(tabId);

    chrome.scripting.executeScript({
        target: {
            tabId: tabId
        },
        func: function(msg, opacity) {
            
            const toast = document.createElement('div');
            toast.id = 'neopass-spinner-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.backgroundColor = 'rgba(15, 15, 20, 0.95)';
            toast.style.color = '#f8f9fa';
            toast.style.padding = '14px 16px';
            toast.style.borderRadius = '8px';
            toast.style.zIndex = '999999';
            toast.style.opacity = opacity;
            toast.style.transition = 'all 0.3s ease';
            toast.style.maxWidth = '320px';
            toast.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            toast.style.backdropFilter = 'blur(10px)';
            toast.style.WebkitBackdropFilter = 'blur(10px)';
            
            
            const headerContainer = document.createElement('div');
            headerContainer.style.display = 'flex';
            headerContainer.style.justifyContent = 'space-between';
            headerContainer.style.alignItems = 'center';
            
            
            const messageContainer = document.createElement('div');
            messageContainer.style.display = 'flex';
            messageContainer.style.alignItems = 'center';
            messageContainer.style.gap = '10px';
            messageContainer.style.flexGrow = '1';
            
            
            const spinnerDot = document.createElement('span');
            spinnerDot.style.display = 'inline-block';
            spinnerDot.style.width = '8px';
            spinnerDot.style.height = '8px';
            spinnerDot.style.backgroundColor = '#64b5f6';
            spinnerDot.style.borderRadius = '50%';
            spinnerDot.style.boxShadow = '0 0 4px rgba(100, 181, 246, 0.6)';
            spinnerDot.style.animation = 'pulse 1.5s ease-in-out infinite';
            
            
            const messageText = document.createElement('span');
            messageText.textContent = msg;
            messageText.style.fontSize = '14px';
            messageText.style.fontWeight = '500';
            messageText.style.lineHeight = '1.4';
            messageText.style.wordBreak = 'break-word';
            
            messageContainer.appendChild(spinnerDot);
            messageContainer.appendChild(messageText);
            
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            closeBtn.title = 'Close';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.color = 'rgba(255, 255, 255, 0.8)';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.padding = '2px';
            closeBtn.style.marginLeft = '8px';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.lineHeight = '0';
            closeBtn.style.transition = 'all 0.2s';
            
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { 
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% { 
                        opacity: 0.5;
                        transform: scale(1.2);
                    }
                }
            `;
            document.head.appendChild(style);
            
            
            closeBtn.onmouseover = function() {
                closeBtn.style.color = '#ffffff';
                closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            };
            
            closeBtn.onmouseout = function() {
                closeBtn.style.color = 'rgba(255, 255, 255, 0.8)';
                closeBtn.style.backgroundColor = 'transparent';
            };
            
            closeBtn.onclick = function() {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px) translateX(-50%)';
                setTimeout(() => toast.remove(), 300);
            };
            
            
            headerContainer.appendChild(messageContainer);
            headerContainer.appendChild(closeBtn);
            toast.appendChild(headerContainer);
            
            document.body.appendChild(toast);
            
            
            toast.style.transform = 'translateY(10px) translateX(-50%)';
            setTimeout(() => {
                toast.style.transform = 'translateY(0) translateX(-50%)';
            }, 10);
        },
        args: [message, opacity]
    });
}
