import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Main from './components/Main/Main';
import axios from "axios";

function App() {
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState('chat');
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);

  // Check if server is running
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/");
        if (response.data.status === "Server is running") {
          setIsServerRunning(true);
        }
      } catch (error) {
        console.error("Server check failed:", error);
        setIsServerRunning(false);
      }
    };

    checkServer();
  }, []);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = JSON.parse(localStorage.getItem('darkMode'));
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode);
      if (savedDarkMode) {
        document.body.classList.add('dark-mode');
      }
    }
  }, []);

  // Load current chat from localStorage
  useEffect(() => {
    const savedChat = JSON.parse(localStorage.getItem('currentChat'));
    if (savedChat) {
      setCurrentChat(savedChat);
      setChatHistory(savedChat.messages || []);
    } else {
      // Create a new chat if none exists
      const newChat = {
        id: Date.now(),
        title: 'New Chat',
        messages: [],
        timestamp: new Date().toISOString()
      };
      setCurrentChat(newChat);
      
      // Save to localStorage
      localStorage.setItem('currentChat', JSON.stringify(newChat));
      
      // Add to chat history if not already there
      const savedChats = JSON.parse(localStorage.getItem('chatHistory')) || [];
      if (!savedChats.some(chat => chat.id === newChat.id)) {
        localStorage.setItem('chatHistory', JSON.stringify([newChat, ...savedChats]));
      }
    }
  }, []);

  return (
    <div className={darkMode ? 'app dark-mode' : 'app'} style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden'
    }}>
      <Sidebar 
        setChatHistory={setChatHistory}
        setCurrentChat={setCurrentChat}
        setActiveSection={setActiveSection}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
      <Main 
        activeSection={activeSection}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
      {!isServerRunning && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#f44336',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '50px',
          zIndex: 1000
        }}>
          Server is not running. Please start the Flask server.
        </div>
      )}
    </div>
  );
}

export default App;