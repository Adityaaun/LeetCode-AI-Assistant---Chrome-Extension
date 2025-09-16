(function() {
  const ICONS = {
    sparkle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2a1 1 0 0 1 .993.883L13 3v2.035a7.003 7.003 0 0 1 4.288 2.155l1.457-1.457a1 1 0 0 1 1.405.09l.01.01a1 1 0 0 1 .09 1.405l-1.457 1.457A7 7 0 0 1 21 12h-2.035a7.003 7.003 0 0 1-2.155 4.288l1.457 1.457a1 1 0 0 1-.09 1.405l-.01.01a1 1 0 0 1-1.405.09l-1.457-1.457A7 7 0 0 1 12 21v2.035a1 1 0 0 1-1.993.116L10 23v-2.035a7.003 7.003 0 0 1-4.288-2.155l-1.457 1.457a1 1 0 0 1-1.405-.09l-.01-.01a1 1 0 0 1-.09-1.405l1.457-1.457A7 7 0 0 1 3 12h2.035a7.003 7.003 0 0 1 2.155-4.288l-1.457-1.457a1 1 0 0 1 .09-1.405l.01-.01a1 1 0 0 1 1.405-.09l1.457 1.457A7 7 0 0 1 12 3V2.035a1 1 0 0 1 .993-.116L13 2h-1zm-1.646 7.646a1 1 0 0 1 1.414 0l1.647 1.646a1 1 0 0 1 0 1.414l-1.647 1.647a1 1 0 0 1-1.414 0l-1.646-1.647a1 1 0 0 1 0-1.414l1.646-1.646z"/></svg>`,
    copy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1V4zm0 3H6v12h12V7h-1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7zM9 4v1h6V4H9z"/></svg>`,
    analyze: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.25 2.01a1 1 0 0 1 .968.751l.02.131L2.44 11h-3.458a1 1 0 0 1-.992-.883L16 10V4.028l1.25-.018zM14 10V4h-4v6h4zm-6 0V4H4.012l2.25 8h3.75V10zM3.06 13l-2.906 8.01a1 1 0 0 0 .968 1.24l.13.002h21.498a1 1 0 0 0 1.098-1.242L20.94 13H3.06z"/></svg>`,
    send: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 13.004h11.414l-4.707 4.707 1.414 1.414 7.121-7.121-7.12-7.122-1.415 1.414 4.707 4.707H3v2z"/></svg>`,
    reset: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-1-8H9v2h2v2h2v-2h2v-2h-2V8h-2v2z"/></svg>`,
  };

  const SELECTORS = {
    problemStatement: ['.elfjS', '[data-key="description-content"]', 'div[data-cy="question-content"]', '.question-content__JfgR', '.description__24sA'],
    languageButton: ["button[data-cy='lang-select-button']", "button[data-headlessui-state]", "div.flex.items-center.whitespace-nowrap.text-label-2 button[id^='headlessui-listbox-button']", "#code_tab > div:nth-child(2) > div.medium.whitespace-nowrap.font-medium"],
    codeEditorLines: '.view-line'
  };

  function getElementText(selectorList) { for (const selector of selectorList) { const el = document.querySelector(selector); if (el) return el.innerText.trim(); } return ''; }
  function getProblemStatement() { return getElementText(SELECTORS.problemStatement); }
  function getSelectedLanguage() { return getElementText(SELECTORS.languageButton) || 'Python'; }
  function getCodeFromEditor() { const codeLines = document.querySelectorAll(SELECTORS.codeEditorLines); let code = ''; codeLines.forEach(line => { code += line.innerText + '\n'; }); return code.trim(); }
  function detectLanguageFromCode(code) { if (code.includes('class Solution') && (code.includes('vector<') || code.includes('#include'))) return 'C++'; if (code.includes('public class Solution')) return 'Java'; if (code.includes('def ')) return 'Python'; if (code.includes('var ') || code.includes('let ') || code.includes('const ') && code.includes('function')) return 'JavaScript'; return null; }

  function createButton() { const btn = document.createElement('button'); btn.id = 'ask-ai-btn'; btn.innerHTML = `${ICONS.sparkle} <span>Ask AI</span>`; document.body.appendChild(btn); return btn; }
  function createPopup() { const popup = document.createElement('div'); popup.id = 'ai-popup'; popup.innerHTML = `<div id="ai-popup-inner"><div id="popup-header"><button id="close-popup">×</button></div><div id="ai-popup-content"></div><div id="popup-footer"></div></div>`; document.body.appendChild(popup); return popup; }

  if (document.getElementById('ask-ai-btn')) return;

  const btn = createButton();
  const popup = createPopup();
  let currentHistoryLength = 0;
  let chatHistory = [];

  function updateButtonText() {
    const btnText = document.querySelector('#ask-ai-btn span');
    if (!btnText) return;
    switch (currentHistoryLength) {
      case 0: btnText.innerText = 'Ask AI'; break;
      case 1: btnText.innerText = 'Hint 2'; break;
      case 2: btnText.innerText = 'Hint 3'; break;
      case 3: btnText.innerText = 'Get Code'; break;
      default: btnText.innerText = 'Show History'; break;
    }
  }
  
  // MODIFIED: Function to save chat history
  function saveReviewHistory(problemKey, history) {
    chrome.storage.local.get([problemKey], (data) => {
        const problemData = data[problemKey] || { hints: [] };
        problemData.reviewHistory = history;
        chrome.storage.local.set({ [problemKey]: problemData });
    });
  }

  btn.addEventListener('click', () => {
    document.getElementById('popup-footer').innerHTML = '';
    const statement = getProblemStatement();
    const editorCode = getCodeFromEditor();
    let lang = detectLanguageFromCode(editorCode) || getSelectedLanguage();
    if (!statement) {
      document.getElementById('ai-popup-content').innerText = 'Error: Could not find problem description.';
      popup.style.display = 'block';
      return;
    }
    const contentDiv = document.getElementById('ai-popup-content');
    contentDiv.innerHTML = '<div class="spinner"></div>';
    popup.style.display = 'block';

    const problemKey = window.location.pathname;
    chrome.runtime.sendMessage({ type: 'CALL_GEMINI', problemDetails: { statement, lang, problemKey, editorCode } }, (response) => {
      if (chrome.runtime.lastError) {
        contentDiv.innerText = 'Error: ' + chrome.runtime.lastError.message;
        return;
      }
      const history = response.history || [];
      currentHistoryLength = history.length;
      updateButtonText();
      contentDiv.innerHTML = '';
      const footer = document.getElementById('popup-footer');
      history.forEach((item, index) => {
        const block = document.createElement('div');
        block.className = 'response-block';
        if (item.toLowerCase().startsWith('error:')) { block.classList.add('error-block'); }
        const title = document.createElement('h4');
        title.className = 'response-title';
        const body = document.createElement('p');
        body.className = 'response-body';
        body.innerText = item;
        if (index < 3) { title.innerText = `HINT ${index + 1}`; } else if (index === 3) { title.innerText = 'FINAL SOLUTION'; }
        block.appendChild(title);
        block.appendChild(body);
        contentDiv.appendChild(block);
      });
      popup.scrollTop = popup.scrollHeight;

      if (history.length >= 1) {
        if (!document.getElementById('review-in-popup-btn')) {
          const reviewBtnInPopup = document.createElement('button');
          reviewBtnInPopup.id = 'review-in-popup-btn';
          reviewBtnInPopup.innerText = 'Review My Code';
          footer.appendChild(reviewBtnInPopup);
          reviewBtnInPopup.addEventListener('click', () => {
            const userCode = getCodeFromEditor();
            if (!userCode) { contentDiv.innerHTML = "<div class='response-block'>There's no code in the editor to review.</div>"; return; }
            
            footer.innerHTML = '';
            const chatContainer = document.createElement('div');
            chatContainer.id = 'chat-container';
            const chatInput = document.createElement('input');
            chatInput.id = 'chat-input';
            chatInput.type = 'text';
            chatInput.placeholder = 'Ask a question about your code...';
            const chatSendBtn = document.createElement('button');
            chatSendBtn.id = 'chat-send-btn';
            chatSendBtn.innerHTML = ICONS.send;
            const chatCloseBtn = document.createElement('button');
            chatCloseBtn.id = 'close-footer-btn';
            chatCloseBtn.innerText = 'Close';
            chatContainer.appendChild(chatInput);
            chatContainer.appendChild(chatSendBtn);
            chatContainer.appendChild(chatCloseBtn);
            footer.appendChild(chatContainer);
            contentDiv.innerHTML = ''; // Clear content before loading/fetching

            // MODIFIED: Load existing chat history or start a new review
            chrome.storage.local.get([problemKey], (data) => {
                const problemData = data[problemKey] || {};
                const savedReviewHistory = problemData.reviewHistory || [];
                chatHistory = savedReviewHistory;

                if (chatHistory.length > 0) {
                    // Render existing chat
                    chatHistory.forEach(msg => {
                        const block = document.createElement('div');
                        block.className = 'response-block';
                        if(msg.role === 'user') {
                            block.classList.add('user-question-block');
                        }
                        block.innerText = msg.parts[0].text;
                        contentDiv.appendChild(block);
                    });
                    popup.scrollTop = popup.scrollHeight;
                } else {
                    // Start a new review
                    contentDiv.innerHTML = '<div class="spinner"></div>';
                    chrome.runtime.sendMessage({ type: 'REVIEW_CODE', problemDetails: { statement: getProblemStatement(), userCode: userCode, lang: detectLanguageFromCode(userCode) || getSelectedLanguage() } }, (res) => {
                        contentDiv.innerHTML = '';
                        const block = document.createElement('div');
                        block.className = 'response-block';
                        if (res.review.toLowerCase().startsWith('error:')) { block.classList.add('error-block'); }
                        block.innerText = res.review;
                        contentDiv.appendChild(block);
                        
                        // MODIFIED: Add initial review to history and save it
                        chatHistory = [{ role: 'model', parts: [{ text: res.review }] }];
                        saveReviewHistory(problemKey, chatHistory);
                    });
                }
            });

            chatSendBtn.addEventListener('click', () => {
              const userQuestion = chatInput.value.trim();
              if (!userQuestion) return;
              
              const userBlock = document.createElement('div');
              userBlock.className = 'response-block user-question-block';
              userBlock.innerText = userQuestion;
              contentDiv.appendChild(userBlock);
              
              const aiBlock = document.createElement('div');
              aiBlock.className = 'response-block';
              aiBlock.innerHTML = '<div class="spinner"></div>';
              contentDiv.appendChild(aiBlock);
              
              popup.scrollTop = popup.scrollHeight;
              chatInput.value = '';
              
              chatHistory.push({ role: 'user', parts: [{ text: userQuestion }] });

              chrome.runtime.sendMessage({
                type: 'ASK_FOLLOW_UP',
                problemDetails: {
                  statement: getProblemStatement(),
                  userCode: userCode,
                  lang: detectLanguageFromCode(userCode) || getSelectedLanguage(),
                  chatHistory: chatHistory
                }
              }, (res) => {
                if (res.answer.toLowerCase().startsWith('error:')) { aiBlock.classList.add('error-block'); }
                aiBlock.innerText = res.answer;
                popup.scrollTop = popup.scrollHeight;
                
                // MODIFIED: Add AI's answer and save the entire history
                chatHistory.push({ role: 'model', parts: [{ text: res.answer }] });
                saveReviewHistory(problemKey, chatHistory);
              });
            });

            chatCloseBtn.addEventListener('click', () => { popup.style.display = 'none'; updateButtonText(); });
          });
        }
        
        if (!document.getElementById('reset-btn')) {
            const resetBtn = document.createElement('button');
            resetBtn.id = 'reset-btn';
            resetBtn.innerHTML = `${ICONS.reset} <span>Reset</span>`;
            footer.appendChild(resetBtn);
            resetBtn.addEventListener('click', () => {
                chrome.storage.local.remove(problemKey, () => {
                    if (chrome.runtime.lastError) { console.error('Error resetting history:', chrome.runtime.lastError); return; }
                    currentHistoryLength = 0;
                    chatHistory = []; // Also clear in-memory chat history
                    updateButtonText();
                    popup.style.display = 'none';
                    document.getElementById('ai-popup-content').innerHTML = '';
                    footer.innerHTML = '';
                });
            });
        }

        if (!document.getElementById('close-footer-btn')) {
          const closeFooterBtn = document.createElement('button');
          closeFooterBtn.id = 'close-footer-btn';
          closeFooterBtn.innerText = 'Close';
          footer.appendChild(closeFooterBtn);
          closeFooterBtn.addEventListener('click', () => { popup.style.display = 'none'; updateButtonText(); });
        }
      }

      if (history.length >= 4) {
        if (!document.getElementById('copy-code-btn')) {
          const copyBtn = document.createElement('button');
          copyBtn.id = 'copy-code-btn';
          copyBtn.innerHTML = `${ICONS.copy} <span>Copy Code</span>`;
          footer.prepend(copyBtn);
          copyBtn.addEventListener('click', () => {
            const solutionText = history[3];
            const codeToCopy = solutionText.replace(/```[a-zA-Z]*\n/g, '').replace(/```/g, '').trim();
            navigator.clipboard.writeText(codeToCopy).then(() => { copyBtn.querySelector('span').innerText = 'Copied!'; setTimeout(() => { copyBtn.querySelector('span').innerText = 'Copy Code'; }, 2000); });
          });
        }
        if (!document.getElementById('analyze-complexity-btn')) {
          const analyzeBtn = document.createElement('button');
          analyzeBtn.id = 'analyze-complexity-btn';
          analyzeBtn.innerHTML = `${ICONS.analyze} <span>Analyze Complexity</span>`;
          footer.prepend(analyzeBtn);
          analyzeBtn.addEventListener('click', () => {
            analyzeBtn.querySelector('span').innerText = 'Analyzing...';
            analyzeBtn.disabled = true;
            const solutionCode = history[3];
            chrome.runtime.sendMessage({ type: 'ANALYZE_CODE', problemDetails: { statement: getProblemStatement(), lang: detectLanguageFromCode(solutionCode) || getSelectedLanguage(), solutionCode: solutionCode } }, (response) => {
              if (chrome.runtime.lastError) { console.error(chrome.runtime.lastError.message); return; }
              const block = document.createElement('div');
              block.className = 'response-block';
              const title = document.createElement('h4');
              title.className = 'response-title';
              title.innerText = 'COMPLEXITY ANALYSIS';
              const body = document.createElement('p');
              body.className = 'response-body';
              body.innerText = response.analysis;
              block.appendChild(title);
              block.appendChild(body);
              contentDiv.appendChild(block);
              popup.scrollTop = popup.scrollHeight;
              analyzeBtn.style.display = 'none';
            });
          });
        }
      }
    });
  });

  document.getElementById('close-popup').addEventListener('click', () => { popup.style.display = 'none'; updateButtonText(); });
  chrome.storage.local.get([window.location.pathname], (data) => {
    const problemData = data[window.location.pathname] || { hints: [] };
    currentHistoryLength = problemData.hints.length;
    updateButtonText();
  });
})();