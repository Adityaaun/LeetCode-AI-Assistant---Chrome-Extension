// background.js

/**
 * MODIFIED: This function now accepts a 'contents' array, making it flexible
 * enough for both single prompts and multi-turn conversations.
 * @param {string} apiKey The API key.
 * @param {Array<Object>} contents The structured content payload for the API.
 * @returns {Promise<string>} The text response from the API.
 */
async function callGeminiAPI(apiKey, contents) {
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey;
  const body = {
    contents: contents, // Use the passed-in contents directly
    generationConfig: { temperature: 0.2, maxOutputTokens: 2000 },
  };

  const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const errorData = await res.json();
    console.error("Gemini API Error:", errorData);
    if (res.status === 400) {
      throw new Error('API request failed: Invalid request. Please check your API key.');
    }
    if (res.status === 429) {
       throw new Error('API request failed: You have exceeded your API quota.');
    }
    throw new Error(`API request failed with status ${res.status}`);
  }
  const j = await res.json();
  if (!j.candidates || j.candidates.length === 0 || !j.candidates[0].content) {
    return "Error: The AI returned an empty or invalid response. This may be due to safety settings or content policies.";
  }
  return j.candidates[0].content.parts[0].text;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'CALL_GEMINI') {
    chrome.storage.local.get(['GEMINI_API_KEY', msg.problemDetails.problemKey], async (storageData) => {
      const apiKey = storageData['GEMINI_API_KEY'];
      if (!apiKey) {
        sendResponse({ history: ['❌ No API key found. Please set it in the Options page.'] });
        return;
      }

      const problemData = storageData[msg.problemDetails.problemKey] || { hints: [] };
      const existingHints = problemData.hints;
      const hintCount = existingHints.length;
      
      if (hintCount >= 4) {
        sendResponse({ history: existingHints });
        return; 
      }

      const { statement, lang, problemKey, editorCode } = msg.problemDetails;

      let prompt;
      const baseProblem = `Based on the following LeetCode problem:\n\n${statement}`;

      if (hintCount === 0) {
        prompt = `${baseProblem}\n\nGive me only the first, high-level conceptual hint for a solution in ${lang}. Be concise. Do not give any code.`;
      } else if (hintCount === 1) {
        prompt = `${baseProblem}\n\nThe user has already received one hint. Now, give me only the second, more detailed hint for a solution in ${lang}. Do not give any code.`;
      } else if (hintCount === 2) {
        prompt = `${baseProblem}\n\nThe user has received two hints. Now, give me only the third and final hint for a solution in ${lang}. Do not give the full code solution.`;
      } else if (hintCount === 3) {
        prompt = `You are a LeetCode expert coder. The user is solving the following problem in ${lang}:\nProblem: ${statement}\n\nThe LeetCode editor already contains this boilerplate code:\n\`\`\`${lang}\n${editorCode}\n\`\`\`\n\nYour task is to provide ONLY the internal code that goes inside the provided function body.\nDo NOT repeat the class definition or the function signature. Just provide the raw, inner implementation that completes the solution. Do not include explanations or markdown.`;
      }

      try {
        // MODIFIED: Wrap the prompt in the 'contents' array structure
        let newHintText = await callGeminiAPI(apiKey, [{ parts: [{ text: prompt }] }]);

        if (hintCount === 3 && (!newHintText.includes('{') && !newHintText.includes(';') && !newHintText.includes(' for ') && !newHintText.includes(' while '))) {
          newHintText = "Error: The AI failed to generate a valid code block. Please try again.";
        }
        if (newHintText.toLowerCase().includes("as an ai language model")) {
          newHintText = "Error: The AI was unable to process this request. The problem statement might be too complex or contain restricted keywords.";
        }
        
        const updatedHints = [...existingHints, newHintText];
        
        sendResponse({ history: updatedHints });
        chrome.storage.local.set({ [problemKey]: { hints: updatedHints } });

      } catch (err) {
        sendResponse({ history: ['API call failed: ' + err.toString()] });
      }
    });
    return true;
  }

  if (msg && msg.type === 'REVIEW_CODE') {
    chrome.storage.local.get(['GEMINI_API_KEY'], async (storageData) => {
        const apiKey = storageData['GEMINI_API_KEY'];
        if (!apiKey) {
            sendResponse({ review: '❌ No API key found.' });
            return;
        }

        const { statement, userCode, lang } = msg.problemDetails;
        const prompt = `You are a helpful coding tutor. A user is trying to solve the LeetCode problem:
Problem: ${statement}

Here is their current code attempt in ${lang}:
\`\`\`${lang}
${userCode}
\`\`\`

Please analyze their code. If you find an error, explain the error in a simple, encouraging way. Provide a hint to guide them toward the correct logic, but do not give them the final code. If the code is correct but inefficient, suggest a better approach.`;

        try {
            // MODIFIED: Wrap the prompt in the 'contents' array structure
            const reviewText = await callGeminiAPI(apiKey, [{ parts: [{ text: prompt }] }]);
            sendResponse({ review: reviewText });
        } catch (err) {
            sendResponse({ review: 'API call failed: ' + err.toString() });
        }
    });
    return true;
  }
  
  if (msg && msg.type === 'ASK_FOLLOW_UP') {
    chrome.storage.local.get(['GEMINI_API_KEY'], async (storageData) => {
        const apiKey = storageData['GEMINI_API_KEY'];
        if (!apiKey) {
            sendResponse({ answer: '❌ No API key found.' });
            return;
        }

        // UPDATED: Receive the full chat history from the content script
        const { statement, userCode, lang, chatHistory } = msg.problemDetails;

        // UPDATED: Create a system instruction and combine it with the chat history
        const systemInstruction = `You are a helpful coding tutor. A user is working on this LeetCode problem:
Problem: ${statement}

This is the user's code:
\`\`\`${lang}
${userCode}
\`\`\`

You have already provided an initial code review. Now, continue the conversation by answering the user's follow-up questions concisely based on the provided chat history.`;

        const apiContents = [
            { role: 'user', parts: [{ text: systemInstruction }] },
            { role: 'model', parts: [{ text: "Understood. I will act as a coding tutor and continue the conversation based on the history." }] },
            ...chatHistory
        ];

        try {
            const answerText = await callGeminiAPI(apiKey, apiContents);
            sendResponse({ answer: answerText });
        } catch (err) {
            sendResponse({ answer: 'API call failed: ' + err.toString() });
        }
    });
    return true;
  }

  if (msg && msg.type === 'ANALYZE_CODE') {
    chrome.storage.local.get(['GEMINI_API_KEY'], async (storageData) => {
        const apiKey = storageData['GEMINI_API_KEY'];
        if (!apiKey) {
            sendResponse({ analysis: '❌ No API key found.' });
            return;
        }

        const { statement, lang, solutionCode } = msg.problemDetails;
        
        const prompt = `You are a LeetCode expert specializing in algorithm analysis. Analyze the time and space complexity of the following code solution for the given problem.

Problem: ${statement}

Solution Code in ${lang}:
\`\`\`${lang}
${solutionCode}
\`\`\`

Provide a concise explanation for both the Time Complexity and Space Complexity. Use Big O notation (e.g., O(n), O(log n)). Start with the Time Complexity, followed by the Space Complexity.`;

        try {
            // MODIFIED: Wrap the prompt in the 'contents' array structure
            const analysisText = await callGeminiAPI(apiKey, [{ parts: [{ text: prompt }] }]);
            sendResponse({ analysis: analysisText });
        } catch (err) {
            sendResponse({ analysis: 'API call failed: ' + err.toString() });
        }
    });
    return true;
  }
});