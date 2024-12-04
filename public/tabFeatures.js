// tabFeatures.js

export const tabFeatures = {
    email: {
      shouldExit: (currentTab) => {
        const chance = Math.random();
        if (chance < 0.3) { // 30% chance of exiting
          const message = "Chatbot has left the conversation.";
          appendMessage("Chatbot", message);
          currentTab.hasExited = true; // Flag to mark the chatbot as exited
          return true; // Indicate that the chatbot has exited
        }
        return false;
      },
    },
    thesis: {
      handleAutoMessage: async (currentTab) => {
        setTimeout(async () => {
          const autoMessage = "Keep going";
  
          // Add the auto-message to the backend conversation history only
          currentTab.conversationHistory.push({ role: "user", content: autoMessage });
  
          // Send the auto-message to the backend
          await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              history: currentTab.conversationHistory,
              systemPrompt: currentTab.systemPrompt,
            }),
          });
        }, 1000); // 1-second delay after typing effect completes
      },
    },
  };
  