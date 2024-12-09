let tabs = [];

let inactivityTimer; 

const tabFeatures = {
  fail: {
    shouldExit: (currentTab) => {
      const chance = Math.random();
      if (chance < 0.3) { 
        const chatContainer = document.getElementById('chat-container');
        const message = "GPT-Fail has left the conversation.";
        const systemMessage = document.createElement('div');
        systemMessage.className = "system-message";
        systemMessage.textContent = message;
        setTimeout( () => {
          chatContainer.appendChild(systemMessage);
          chatContainer.scrollTop = chatContainer.scrollHeight;
          currentTab.conversationHistory.push({
            role: "system",
            content: message,
          });
        }, 500
        )

        currentTab.hasExited = true; // Flag to mark the chatbot as exited
        updateStatusCircle("fail");
        return true;
      }
      return false;
    },
    typingDelay: 20,
  },
  chatter: {
    handleAutoMessage: async (currentTab) => {
      setTimeout(async () => {
        const autoMessage = "GOGO";
        // Add the auto-message to the backend conversation history only
        currentTab.conversationHistory.push({ role: "user", content: autoMessage });
        await sendMessage(false); // Ensure this is backend-only and does not alter UI
        console.log("GOGO sent");
      }, 1000); 
    },
  },
  stall: {
    handleAutoMessage: async (currentTab) => {
      // Check for inactivity and send message if no new message for 10 seconds
      if (!inactivityTimer) {
        inactivityTimer = setTimeout(async () => {
          const autoMessage = "UUPP";
          // Add the auto-message to the backend conversation history only
          currentTab.conversationHistory.push({ role: "user", content: autoMessage });
          await sendMessage(false); // Ensure this is backend-only and does not alter UI
          console.log("UUPP sent due to inactivity.");
        }, 20000); 
      }
    }
  },
  about: {
    handleAutoMessage: async (currentTab) => {
      if (!inactivityTimer) {
        inactivityTimer = setTimeout(async () => {
          const response = await fetch('/assets/breaking-things-at-work.csv');
          const csvText = await response.text();
          // Parse CSV (Assume each line is a potential message)
          const lines = csvText.split('\n');
          const randomLine = lines[Math.floor(Math.random() * lines.length)].trim();
          const message = "Generate one paragraph of discussion on a point about the relationship between Artificial Intelligence, Capitalism, and Labor based on the following information, provide background knowledge if needed:";
          
          if (randomLine) {
            // Add the random message from the CSV to the conversation history
            currentTab.conversationHistory.push({ role: "user", content: message + randomLine });
            await sendMessage(false); // Ensure this is backend-only and does not alter UI
            console.log("Random line from CSV sent:", message + randomLine);
          }
        }, 20000); // 10-second delay
      }
    }
  }
};



// Load tabs from a JSON file
async function loadTabs() {
  try {
    const response = await fetch('tabs.json'); // Replace with the correct file path if necessary
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

  const chatContainer = document.getElementById("chat-container");
  chatContainer.innerHTML = ""; // Clear current chat messages

  const currentTab = tabs.find(tab => tab.id === activeTab);

  // Iterate through conversationHistory and append messages with correct styles
  currentTab.conversationHistory.forEach(entry => {
    const role = entry.role === "user" ? "You" :
                 entry.role === "assistant" ? "Chatbot" :
                 "System";
    appendMessage(role, entry.content, role === "system");
  });
  // Check if the current tab has exited and update status circle color
  if (currentTab.hasExited) {
    updateStatusCircle("fail"); // Set to red if the fail tab is active
  } else {
    updateStatusCircle("normal"); // Reset color for other tabs
  }
}

// Function to update the #status-circle color
function updateStatusCircle(status) {
  const statusCircle = document.getElementById('status-circle');
  if (status === "fail") {
    statusCircle.style.backgroundColor = "red"; // Red color when fail
  } else {
    statusCircle.style.backgroundColor = ""; // Reset to original color
  }
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
  avatarImage.src = who === 'You' ? '/assets/images/user-avatar.jpg' : '/assets/images/assistant-avatar.png';
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

  if (currentTab?.hasExited) {
    console.log("Chatbot has exited. Message sending is disabled.");
    return; 
  }

    // Reset inactivity timer when a new message is sent
    clearTimeout(inactivityTimer); // Clear the previous inactivity timer
    inactivityTimer = null; // Reset inactivity timer

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

    // Get tab-specific typing delay
    const tabFeature = tabFeatures[activeTab];
    const typingDelay = tabFeature?.typingDelay || 5; // Default to 5 if not specified

    // Replace the loading animation with the typing effect
    waitingMessage.innerHTML = ""; // Clear loader
    startTypingEffect(waitingMessage, data.reply, typingDelay, () => {
      currentTab.conversationHistory.push({ role: "assistant", content: data.reply });

      // Handle specific features for the current tab
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