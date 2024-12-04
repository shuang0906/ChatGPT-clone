let tabs = [
  { 
    id: 'email', 
    title: 'Email Rephrase', 
    content: '', 
    systemPrompt: 'You are an email rephrasing assistant. Constrain the output to max_token = 1024', 
    conversationHistory: [] 
  },
  { 
    id: 'thesis', 
    title: 'Thesis Brainstorm', 
    content: '', 
    systemPrompt: 'You are a thesis brainstorming assistant.Constrain the output to max_token = 1024', 
    conversationHistory: [] 
  },
  { 
    id: 'therapy', 
    title: 'Emotional Therapy', 
    content: '', 
    systemPrompt: 'You are an emotional therapy assistant.', 
    conversationHistory: [] 
  }
];

let activeTab = 'email';

const proxyURL = "https://replicate-api-proxy.glitch.me/create_n_get/";

function renderTabs() {
  const tabsList = document.getElementById('tabsList');
  const tabContent = document.getElementById('tabContent');

  tabsList.innerHTML = tabs
    .map(
      (tab, index) => `
    <div 
      class="tab-group ${tab.id === activeTab ? 'active' : ''}" 
    >
      <span class="tab-title" onclick="setActiveTab('${tab.id}')">${tab.title}</span>
    </div>
  `
)
.join('') + `<button class="add-tab-button" onclick="openNewTabDialog()"> + New </button>`;

if (activeTab) {
const currentTab = tabs.find((tab) => tab.id === activeTab);
tabContent.innerHTML = currentTab
  ? `<div id="chat-container" class="chat-container">${currentTab.content}</div>`
  : '';
} else {
tabContent.innerHTML = '<p>No tabs available. Add a new assistant.</p>';
}
}

// Set Active Tab
function setActiveTab(tabId) {
  activeTab = tabId;
  renderTabs();
}

// Handle Sending a Message
function handleSend() {
  const input = document.getElementById('messageInput').value.trim();
  if (!input || !activeTab) return;

  const currentTab = tabs.find(tab => tab.id === activeTab);

  // Add user message to the tab's content and conversation history
  currentTab.content += `<div class="user-message">${input}</div>`;
  currentTab.conversationHistory.push({ role: "user", content: input });

  document.getElementById('messageInput').value = '';
  renderTabs();

  sendToAPI(currentTab); // Send the request
}

// Send Message to API
async function sendToAPI(currentTab) {
  const formattedHistory = formatHistoryForAPI(currentTab.conversationHistory);
  const loadingMessage = `<div class="bot-message">Loading...</div>`;
  currentTab.content += loadingMessage;
  renderTabs();

  try {
    const response = await getChatResponse(formattedHistory, currentTab.systemPrompt);
    
    // Replace loading message with the actual response
    currentTab.content = currentTab.content.replace(loadingMessage, `<div class="bot-message">${response}</div>`);
    currentTab.conversationHistory.push({ role: "assistant", content: response });
    renderTabs();
  } catch (error) {
    console.error('Error:', error);
    currentTab.content = currentTab.content.replace(loadingMessage, `<div class="bot-message">Error occurred</div>`);
    renderTabs();
  }
}


window.onload = renderTabs;


//api--------------------------------------------------------------------------------------------

// Format Conversation History for API
function formatHistoryForAPI(history) {
  let formattedHistory = "<|begin_of_text|>";
  history.forEach(message => {
    formattedHistory += message.role === "user" 
      ? `<|start_header_id|>user<|end_header_id|>\n${message.content}<|eot_id|>` 
      : `<|start_header_id|>assistant<|end_header_id|>\n${message.content}<|eot_id|>`;
  });
  formattedHistory += `<|start_header_id|>assistant<|end_header_id|>`; // Expected assistant response
  return formattedHistory;
}

// Get Chat Response from API
async function getChatResponse(history, systemPrompt) {
  const data = {
    modelURL: "https://api.replicate.com/v1/models/meta/meta-llama-3-70b-instruct/predictions",
    input: {
      prompt: history,
      system_prompt: systemPrompt,
      max_tokens: 150,
      temperature: 0.7,
      top_p: 0.9,
    },
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  };

  const response = await fetch(proxyURL, options);
  const jsonResponse = await response.json();
  return jsonResponse.output.join("").trim();
}
//api--------------------------------------------------------------------------------------------

// Async function to send a message and get a response
async function sendMessage() {
  // Access the user input element and get the value
  const userInput = document.getElementById('user-input');
  const message = userInput.value;
  userInput.value = '';
  // Append the user's message to the chat and update the history
  appendMessage('you', message);
  conversationHistory.push({ role: 'user', content: message });

  // Scroll to the latest message
  const chatContainer = document.getElementById('chat-container');
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    // Send the message to the server and await the response
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history: conversationHistory }),
    });
    const data = await response.json();
    // Log the response data for debugging and append the bot's message to the chat
    console.log(data);
    appendMessage('chatbot', data.reply);
    // Update conversation history with the assistant's reply
    conversationHistory.push({ role: 'assistant', content: data.reply });

    // Log the updated conversation history for debugging
    console.log(JSON.stringify(conversationHistory, null, 2));
  } catch (error) {
    // Log any errors in communicating with the server
    console.error('Error communicating with server:', error);
  }
}
