LeetCode AI Assistant (Gemini Powered)
This is a powerful Chrome extension designed to help you learn and solve problems on LeetCode without just giving away the answer. It integrates directly into the LeetCode UI and acts as your personal AI coding tutor, powered by Google's Gemini API.

The extension provides progressive hints, allowing you to get just enough help to get unstuck. You can also get your code reviewed, ask follow-up questions in a chat, and analyze the complexity of the final solution.

✨ Key Features
🧠 Progressive Hints: Get up to three hints that gradually increase in detail before seeing the full solution. This encourages problem-solving over memorization.

🤖 AI Code Review & Chat: Submit your code and get an AI-powered review that explains errors and suggests improvements. You can ask follow-up questions in an interactive chat interface.

📊 Complexity Analysis: Once a solution is generated, the extension can provide a detailed Time and Space Complexity analysis in Big O notation.

💾 Persistent History: Your hint and chat history for each problem is saved locally, so you can close the window and pick up right where you left off.

🚀 Seamless Integration: The UI is injected directly and cleanly into LeetCode problem pages, providing a native-like experience.

📋 Copy & Reset: Easily copy the generated code to your clipboard or reset the hint history for a specific problem with a single click.

⚙️ How It Works
The extension operates with a clear separation of concerns between its major components:

Content Script (content.js): When you navigate to a LeetCode problem page, this script injects the "Ask AI" button and popup UI into the page. It scrapes the problem data and sends messages to the background script.

Background Service Worker (background.js): This is the core logic engine. It listens for messages from the content script, securely retrieves your stored API key, constructs carefully worded prompts, and makes the API calls to Google Gemini.

API Communication: The background script sends the prompt to the Gemini API and awaits the response.

UI Update: The response from the API is sent back to the content script, which then dynamically renders the information in the popup for you to see.

🛠️ Tech Stack
Core: JavaScript (ES6+), HTML5, CSS3

Browser API: Chrome Extension APIs (Manifest V3)

AI Backend: Google Gemini API (gemini-1.5-flash-latest model)

Storage: chrome.storage.local for API key and problem history

🚀 Setup and Installation
To get this extension running locally, follow these steps:

Clone the Repository

Bash

git clone https://github.com/your-username/leetcode-ai-assistant.git
Get a Google Gemini API Key

Go to the Google AI for Developers website.

Create an API key in the Google AI Studio.

Load the Extension in Chrome

Open Google Chrome and navigate to chrome://extensions.

Turn on the "Developer mode" toggle in the top-right corner.

Click the "Load unpacked" button.

Select the cloned repository folder on your local machine.

Set the API Key

Once loaded, click on the extension's icon in your Chrome toolbar and select "Options", or right-click the icon and choose "Options".

This will open the options page.

Paste your Google Gemini API key into the input field and click "Save API Key".

Start Solving!

Navigate to any problem on LeetCode (e.g., https://leetcode.com/problems/two-sum/).

You should now see the "Ask AI" button on the bottom-right of the page. You're all set!
