import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// API function for the standard chat with memory
const sendMemoryMessageToApi = async (message, conversationId) => {
    const url = new URL('http://localhost:8090/api/memory/chat');
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
    return response.json(); // Returns { conversationId, message }
};

// --- NEW: API function for the MCP Tools chat ---
const sendMcpMessageToApi = async (message) => {
    const url = 'http://localhost:8090/api/mcp/chat';
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: message,
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    return response.text(); // Returns a plain string
};


function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [theme, setTheme] = useState('dark');
    // --- NEW: State to manage the chat mode ---
    const [chatMode, setChatMode] = useState('memory'); // 'memory' or 'mcp'

    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    // --- NEW: Clear chat when mode changes for better UX ---
    const handleModeChange = (newMode) => {
        if (chatMode !== newMode) {
            setChatMode(newMode);
            setMessages([]);
            setConversationId(null);
        }
    };

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;
        const userMessage = { sender: 'user', text: input };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        try {
            let aiResponseText;
            // --- UPDATED: Call API based on the current chatMode ---
            if (chatMode === 'memory') {
                const response = await sendMemoryMessageToApi(currentInput, conversationId);
                aiResponseText = response.message;
                setConversationId(response.conversationId);
            } else { // 'mcp' mode
                aiResponseText = await sendMcpMessageToApi(currentInput);
            }
            const aiMessage = { sender: 'ai', text: aiResponseText };
            setMessages(prevMessages => [...prevMessages, aiMessage]);
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
        <div className="chat-app-container" data-theme={theme}>
            <div className="chat-container">
                <header className="app-header">
                    {/* --- NEW: Mode Switcher UI --- */}
                    <div className="mode-switcher">
                        <button onClick={() => handleModeChange('memory')} className={chatMode === 'memory' ? 'active' : ''}>Standard</button>
                        <button onClick={() => handleModeChange('mcp')} className={chatMode === 'mcp' ? 'active' : ''}>MCP Tools</button>
                    </div>
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
                        // --- UPDATED: Placeholder text changes based on mode ---
                        placeholder={chatMode === 'mcp' ? 'e.g., Get a list of all products' : 'Reply to your AI assistant...'}
                        rows="1"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()}>
                        <svg xmlns="http://www.w.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="send-icon">
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;