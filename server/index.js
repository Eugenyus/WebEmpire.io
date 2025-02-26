import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(join(__dirname, '../dist')));

// Email sending endpoint
app.post('/api/email', async (req, res) => {
  try {
    const { name, email, html_message, subject } = req.body;

    if (!email || !html_message || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const response = await fetch('https://genisys.ro/smtp/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        html_message,
        subject
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Failed to send email (${response.status})`);
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});