// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// API function to send a message to your backend
const sendMessageToApi = async (message, conversationId) => {
    // We target the AIChatMemoryController endpoint as it supports conversation history
    const url = new URL('http://localhost:8082/ai-mem-chat');
    if (conversationId) {
        url.searchParams.append('relatedConversationId', conversationId);
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            // Your Spring Boot @RequestBody is expecting a plain string
            'Content-Type': 'text/plain',
        },
        body: message,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json(); // Returns { conversationId, message }
};


function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Effect to scroll to the bottom of the chat window when new messages are added
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

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
        <div className="chat-container">
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
    );
}

export default App;