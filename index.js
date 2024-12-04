// ES6 imports for necessary modules
import express from 'express';
import bodyParser from 'body-parser';
import OpenAIApi from 'openai';
import { config } from 'dotenv';

// Load environment variables
config();

// Express app and OpenAI API setup
const app = express();
const openai = new OpenAIApi({ apiKey: process.env.OPENAI_SECRET_KEY });

// Middleware for JSON parsing and serving static files
app.use(bodyParser.json());
app.use(express.static('public'));

async function generate(history, systemPrompt) { 
  // Use the systemPrompt directly as it is now dynamically provided
  const messages = [{ role: 'system', content: systemPrompt }].concat(history);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });

  return response.choices[0].message.content;
}

app.post('/api/chat', async (req, res) => {
  const { history, systemPrompt } = req.body;
  try {
    const modelReply = await generate(history, systemPrompt);
    res.json({ reply: modelReply });
  } catch (error) {
    console.error('Error communicating with OpenAI API:', error);
    res.status(500).send('Error generating response');
  }
});

// Server configuration
const PORT = process.env.PORT || 3000;
// Start the server and log the listening port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

