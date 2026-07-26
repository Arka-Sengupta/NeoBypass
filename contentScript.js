
if (typeof chrome === "undefined") {
  
}


(function injectMockCode() {
  const mockScript = document.createElement('script');
  mockScript.src = chrome.runtime.getURL('data/inject/mock_code.js');
  mockScript.onload = function () {
      console.log('✅ Mock code interceptor loaded');
      this.remove(); 
  };
  mockScript.onerror = function() {
      console.error('❌ Failed to load mock code interceptor');
  };
  
  (document.head || document.documentElement).prepend(mockScript);
})();


const script = document.createElement('script');
script.src = chrome.runtime.getURL('data/inject/exam.js');
(document.head || document.documentElement).appendChild(script);








window.addEventListener("message", function(event) {
  
  
  
  if (event.data.target === "extension") {
      
      chrome.runtime.sendMessage(event.data.message, response => {
          
          window.postMessage({
              source: "extension",
              response: response
          }, "*");
      });
  }
});

window.addEventListener("message", function (event) {

  if (event.source === window && event.data.target === "extension") {

    browser.runtime.sendMessage(event.data.message, (response) => {

      window.postMessage({ source: "extension", response: response }, "*");
    });
  }
});


window.addEventListener("beforeunload", removeInjectedElement);


function sendMessageToWebsite(messageData) {
  removeInjectedElement(); 

  
  const injectedElement = document.createElement("span");
  injectedElement.id = "x-template-base-" + messageData.currentKey; 

  
  document.body.appendChild(injectedElement);
  console.log("message", messageData); 

  
  window.postMessage(0, messageData.url); 
}


function removeInjectedElement() {
  const injectedElement = document.querySelector("[id^='x-template-base-']"); 
  if (injectedElement) {
      injectedElement.remove(); 
  }
}

