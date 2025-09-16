
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    chrome.storage.local.get(['GEMINI_API_KEY'], (data) => {
        if (data.GEMINI_API_KEY) input.value = data.GEMINI_API_KEY;
        else alert('❌ You must set your API key to use this extension.');
    });
    saveBtn.addEventListener('click', () => {
        const key = input.value.trim();
        if (!key) { alert('❌ API key is required.'); return; }
        chrome.storage.local.set({GEMINI_API_KEY: key}, () => { alert('✅ API key saved successfully.'); });
    });
});
