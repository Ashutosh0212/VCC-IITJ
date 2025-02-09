import React, { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('deepseek');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    const timestamp = new Date().toLocaleTimeString();

    // Add user message to chat history
    const userMessage = {
      type: 'user',
      content: message,
      timestamp,
      model
    };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, model }),
      });

      const data = await res.json();
      
      // Add AI response to chat history
      const aiMessage = {
        type: 'ai',
        content: data.response,
        timestamp: new Date().toLocaleTimeString(),
        model
      };
      setChatHistory(prev => [...prev, aiMessage]);
      setMessage(''); // Clear input after sending
    } catch (error) {
      console.error('Error:', error);
      // Add error message to chat history
      const errorMessage = {
        type: 'error',
        content: 'Error getting response from server',
        timestamp: new Date().toLocaleTimeString(),
        model
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>AI Chat Interface</h1>
        <div className="model-selection">
          <label>
            Model:
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="deepseek">DeepSeek</option>
              <option value="chatgpt">ChatGPT</option>
            </select>
          </label>
        </div>
      </header>

      <div className="chat-container">
        <div className="messages-container">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              <div className="message-header">
                <span className="model-badge">{msg.model}</span>
                <span className="timestamp">{msg.timestamp}</span>
              </div>
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message ai loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="input-form">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button type="submit" disabled={loading || !message.trim()}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App; 