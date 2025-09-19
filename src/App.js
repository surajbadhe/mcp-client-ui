// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// API function (no changes here)
const sendMessageToApi = async (message, conversationId) => {
    const url = new URL('http://localhost:8082/ai-mem-chat');
    if (conversationId) {
        url.searchParams.append('relatedConversationId', conversationId);
    }
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: message,
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    return response.json();
};

function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    // --- NEW: State to manage the current theme ---
    const [theme, setTheme] = useState('dark'); // 'light' or 'dark'

    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // --- NEW: Function to toggle the theme ---
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;
        const userMessage = { sender: 'user', text: input };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setInput('');
        setIsLoading(true);
        try {
            const response = await sendMessageToApi(input, conversationId);
            const aiMessage = { sender: 'ai', text: response.message };
            setMessages(prevMessages => [...prevMessages, aiMessage]);
            setConversationId(response.conversationId);
        } catch (error) {
            console.error('Failed to send message:', error);
            const errorMessage = { sender: 'ai', text: `Error: ${error.message}`, isError: true };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        // --- UPDATED: Added data-theme attribute to control CSS ---
        <div className="chat-app-container" data-theme={theme}>
            <div className="chat-container">
                {/* --- NEW: Header with title and theme toggle button --- */}
                <header className="app-header">
                    <h1>AI Chat Client</h1>
                    <button onClick={toggleTheme} className="theme-toggle-button">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </header>
                <div className="chat-window">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message-bubble ${msg.sender === 'user' ? 'user-bubble' : 'ai-bubble'} ${msg.isError ? 'error-bubble' : ''}`}>
                             <p>{msg.text}</p>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message-bubble ai-bubble loading-bubble">
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                <div className="chat-input-area">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Reply to your AI assistant..."
                        rows="1"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="send-icon">
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;