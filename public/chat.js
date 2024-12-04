let tabs = [];

const tabFeatures = {
  email: {
    shouldExit: (currentTab) => {
      const chance = Math.random();
      if (chance < 0.9) { // 30% chance of exiting
        const message = "Chatbot has left the conversation.";
        appendMessage("Chatbot", message);
        currentTab.hasExited = true; // Flag to mark the chatbot as exited
        return true;
      }
      return false;
    },
  },
  thesis: {
    handleAutoMessage: async (currentTab) => {
      setTimeout(async () => {
        const autoMessage = "GOGO";

        // Add the auto-message to the backend conversation history only
        currentTab.conversationHistory.push({ role: "user", content: autoMessage });
        await sendMessage(false); // Ensure this is backend-only and does not alter UI
        console.log("GOGO sent");
      }, 1000); // 1-second delay after typing effect completes
    },
  },
};


// Load tabs from a JSON file
async function loadTabs() {
  try {
    const response = await fetch('test.json'); // Replace with the correct file path if necessary
    tabs = await response.json();
    initializeTabs(); 
  } catch (error) {
    console.error('Error loading tabs:', error);
  }
}

// Initialize tabs after loading
function initializeTabs() {
  if (tabs.length > 0) {
    activeTab = tabs[0].id; // Default to the first tab
    generateTabsDropdown(); // Assuming you have a dropdown generation function
    switchTab(activeTab);   // Switch to the default tab
  }
}

// Generate dropdown for tabs
function generateTabsDropdown() {
  const tabsContainer = document.getElementById('tabs-container');
  const dropdown = document.createElement('select');
  dropdown.id = 'tabs-dropdown';

  tabs.forEach(tab => {
    const option = document.createElement('option');
    option.value = tab.id;
    option.textContent = tab.title;
    dropdown.appendChild(option);
  });

  dropdown.value = activeTab;
  dropdown.addEventListener('change', (event) => {
    switchTab(event.target.value);
  });

  tabsContainer.appendChild(dropdown);
}

// Switch tab logic (already defined in your existing code)
function switchTab(tabId) {
  activeTab = tabId;

  const chatContainer = document.getElementById('chat-container');
  chatContainer.innerHTML = ''; // Clear current chat messages

  const currentTab = tabs.find(tab => tab.id === activeTab);

  // Iterate through conversationHistory and append messages with correct styles
  currentTab.conversationHistory.forEach(entry => {
    const role = entry.role === 'user' ? 'You' : 'Chatbot';
    appendMessage(role, entry.content);
  });
}


// Call loadTabs() on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  loadTabs();
});

// Append a message to the chat container
function appendMessage(who, message, isTyping = false) {
  const chatContainer = document.getElementById('chat-container');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${who.toLowerCase()}`;

  // Avatar
  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'avatar';
  const avatarImage = document.createElement('img');
  avatarImage.src = who === 'You' ? '/images/user-avatar.jpg' : '/images/assistant-avatar.png';
  avatarImage.alt = `${who} Avatar`;
  avatarDiv.appendChild(avatarImage);

  // Message Bubble
  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'bubble';

  if (isTyping) {
    // Add a loader animation for typing
    const loaderWrapper = document.createElement('div');
    loaderWrapper.className = 'loader-wrapper';
    const loaderDiv = document.createElement('div');
    loaderDiv.className = 'loader';
    loaderWrapper.appendChild(loaderDiv);
    bubbleDiv.appendChild(loaderWrapper);
  } else {
    bubbleDiv.textContent = message;
  }

  // Assemble Message
  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(bubbleDiv);
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return bubbleDiv; // Return the bubble for updating content
}

// Typing effect function
function startTypingEffect(element, fullMessage, delay = 5, onComplete = null) {
  let index = 0;

  const interval = setInterval(() => {
    element.textContent = fullMessage.slice(0, index);
    index++;

    // Scroll to the bottom of the chat container
    const chatContainer = document.getElementById("chat-container");
    chatContainer.scrollTop = chatContainer.scrollHeight;

    if (index > fullMessage.length) {
      clearInterval(interval); // Stop when all characters are displayed
      if (onComplete) onComplete(); // Execute the callback if provided
    }
  }, delay);
}


// Send a message and handle chat responses
async function sendMessage(fromUserInput = true) {
  let message = null;

  if (fromUserInput) {
    const userInput = document.getElementById("user-input");
    message = userInput.value.trim();
    if (!message) return;
    userInput.value = "";
    appendMessage("You", message);
  }

  const currentTab = tabs.find((tab) => tab.id === activeTab);
  if (fromUserInput) {
    currentTab.conversationHistory.push({ role: "user", content: message });
  }

  // Append a loading animation
  const waitingMessage = appendMessage("Chatbot", "", true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        history: currentTab.conversationHistory,
        systemPrompt: currentTab.systemPrompt,
      }),
    });
    const data = await response.json();

    // Replace the loading animation with the typing effect
    waitingMessage.innerHTML = ""; // Clear loader
    startTypingEffect(waitingMessage, data.reply, 20, () => {
      currentTab.conversationHistory.push({ role: "assistant", content: data.reply });

      // Dynamically handle features for the current tab
      handleTabFeatures(activeTab, currentTab);
    });
  } catch (error) {
    console.error("Error communicating with server:", error);

    // Replace the loading animation with an error message
    waitingMessage.innerHTML = "Error: Unable to get a response.";
  }
}




function handleTabFeatures(tabId, currentTab) {
  const features = tabFeatures[tabId];

  if (!features) return; // Exit if there are no specific features for this tab

  // Iterate over the features defined for the tab
  Object.keys(features).forEach((featureKey) => {
    const feature = features[featureKey];

    // Check if the feature is a function and call it
    if (typeof feature === "function") {
      feature(currentTab);
    }
  });
}


// Generate the tabs when the page loads
document.addEventListener('DOMContentLoaded', () => {
  generateTabsDropdown();
  switchTab(activeTab); // Load the default tab content
});