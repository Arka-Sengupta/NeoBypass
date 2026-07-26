<div align="center">
  <img src="images/NB256.png" alt="NeoBypass Logo" width="256" />
  <p><strong>NeoBypass</strong> - A powerful, retro-modern Chrome extension to streamline your coding tasks on NeoCollab.</p>
</div>

---

## 🌟 Features

- **Instant Code Answers**: Effortlessly fetch and insert coding answers on NeoCollab with a single keystroke.
- **Lightning Fast Paste**: Forget the slow character-by-character typing. The entire code block is injected directly into your code editor in a split second.
- **Retro Windows 95 UI**: Enjoy a sleek, nostalgic Windows 95 design aesthetic for popups and error notifications.
- **BYOK (Bring Your Own Key)**: Full control over your AI integration using your personal Google Gemini API credentials.
- **100% Free**: No paywalls, no "Pro" subscriptions. All premium features are permanently unlocked and baked directly into the extension.

## 🚀 How to Use

### 1. Installation

1. Go to the **Releases** section of this repository.
2. Download the latest `.zip` file containing the extension.
3. Extract the downloaded `.zip` file to a folder on your computer.
4. Open Google Chrome and navigate to `chrome://extensions/`.
5. Turn on **Developer mode** (the toggle switch in the top right corner).
6. Click **Load unpacked** in the top left corner.
7. Select the extracted folder. The NeoBypass extension should now be installed and active!

### 2. Setting Up Your Gemini API

To power the AI answers, you need a free API key from Google:

1. Head over to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click on **Create API key** and generate a new key.
4. Copy the API Key.
5. Identify your preferred AI model name (e.g., `models/gemini-2.5-flash` or `gemini-flash-latest`). 
6. Open the NeoBypass extension options/popup in Chrome and enter your copied API Key and Model Name.

### 3. Using NeoBypass on NeoCollab

Once everything is set up, navigating NeoCollab is a breeze:
- Simply open a coding question in NeoCollab.
- Press **`Alt + Shift + Y`**.
- NeoBypass will instantly fetch the correct code snippet using the Gemini API and paste the entire code directly into your editor, completely bypassing the manual typing process!

---

## Troubleshooting

If you ever encounter an error (like a network issue or an invalid API key), NeoBypass will notify you with a classic Windows 95 styled error popup in the bottom corner of your screen. 

Make sure your API key is correct, you haven't hit rate limits, and the model name you specified is currently supported (we recommend `gemini-flash-latest`).
