import React, { useState, useRef, useEffect } from 'react';
import './Main.css';
import { assets } from '../../assets/assets';
import axios from 'axios';
import Info from '../Info/Info';
import ActivityLog from '../ActivityLog/ActivityLog';
import CandidateForm from '../../CandidateForm/CandidateForm'; 

const Main = ({ 
  activeSection, 
  chatHistory, 
  setChatHistory, 
  currentChat, 
  setCurrentChat
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const [showGreeting, setShowGreeting] = useState(true);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [interviewStarted, setInterviewStarted] = useState(false); 
  const [candidateInfo, setCandidateInfo] = useState(null); 
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInput(transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

    // Function to handle form submission
    const handleFormSubmit = (formData) => {
      setCandidateInfo(formData);
      setInterviewStarted(true);
      
      // Send candidate info to backend
      axios.post('http://127.0.0.1:5000/api/set-candidate-info', formData)
        .then(response => {
          console.log('Candidate info saved');
        })
        .catch(error => {
          console.error('Error saving candidate info:', error);
        });
      
      // Start the interview with initial message
      const initialMessage = {
        text: `Hello ${formData.fullName}, I'll be conducting your interview for the ${formData.position} position. Let's begin.`,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      
      setChatHistory([initialMessage]);
      
      // Create a new chat for the interview
      const newChat = {
        id: Date.now(),
        title: `Interview: ${formData.position}`,
        messages: [initialMessage],
        timestamp: new Date().toISOString(),
        candidateInfo: formData
      };
      
      setCurrentChat(newChat);
      
      // Save to localStorage
      const savedChats = JSON.parse(localStorage.getItem('chatHistory')) || [];
      localStorage.setItem('chatHistory', JSON.stringify([newChat, ...savedChats]));
      localStorage.setItem('currentChat', JSON.stringify(newChat));
    };

  const handleSendMessage = async () => {
    if (input.trim() === '' && !selectedFile) return;
    
    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
      file: selectedFile ? {
        name: selectedFile.name,
        type: selectedFile.type,
        preview: selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : null
      } : null
    };
    
    const newChatHistory = [...chatHistory, userMessage];
    setChatHistory(newChatHistory);

    if (currentChat) {
      const updatedChat = {
        ...currentChat,
        messages: newChatHistory,
        title: currentChat.title === 'New Chat' && input.length > 0 
          ? input.substring(0, 30) + (input.length > 30 ? '...' : '')
          : currentChat.title
      };
      setCurrentChat(updatedChat);

      const savedChats = JSON.parse(localStorage.getItem('chatHistory')) || [];
      const updatedChats = savedChats.map(chat => 
        chat.id === updatedChat.id ? updatedChat : chat
      );
      localStorage.setItem('chatHistory', JSON.stringify(updatedChats));
      localStorage.setItem('currentChat', JSON.stringify(updatedChat));
    }
    
    setInput('');
    setSelectedFile(null);
    setShowGreeting(false);
    setLoading(true);
    
    try {
      let requestData = {
        message: input
      };
     
      const response = await axios.post('http://127.0.0.1:5000/api/chat', requestData);

      if (response.data.response) {
        const botMessage = {
          text: response.data.response,
          sender: 'bot',
          timestamp: new Date().toISOString()
        };
        
        const updatedChatHistory = [...newChatHistory, botMessage];
        setChatHistory(updatedChatHistory);

        if (currentChat) {
          const updatedChat = {
            ...currentChat,
            messages: updatedChatHistory
          };
          setCurrentChat(updatedChat);

          const savedChats = JSON.parse(localStorage.getItem('chatHistory')) || [];
          const updatedChats = savedChats.map(chat => 
            chat.id === updatedChat.id ? updatedChat : chat
          );
          localStorage.setItem('chatHistory', JSON.stringify(updatedChats));
          localStorage.setItem('currentChat', JSON.stringify(updatedChat));
        }

        const activityLog = JSON.parse(localStorage.getItem('activityLog')) || [];
        activityLog.push({
          query: input,
          response: response.data.response,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('activityLog', JSON.stringify(activityLog));
        
      } else if (response.data.error) {
        const errorMessage = {
          text: `Sorry, there was an error: ${response.data.error}`,
          sender: 'bot',
          timestamp: new Date().toISOString()
        };
        setChatHistory([...newChatHistory, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        text: 'Sorry, there was an error connecting to the server. Please try again later.',
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setChatHistory([...newChatHistory, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpeechRecognition = () => {
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleCardClick = (suggestion) => {
    setInput(suggestion);
  };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (activeSection === 'help') {
    return <Info />;
  }
  
  if (activeSection === 'activity') {
    return <ActivityLog />;
  }

  if (!interviewStarted && activeSection === 'chat') {
    return (
      <div className="main">
        <div className="nav">
          <p>AI Interview ChatBot</p>
          <img src={assets.user_icon} alt="" />
        </div>
        <div className="main-container">
          <CandidateForm onSubmit={handleFormSubmit} />
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="nav">
        <p>AI Interview ChatBot</p>
        <img src={assets.user_icon} alt="" />
      </div>
      <div className="main-container">
        {showGreeting && chatHistory.length === 0 ? (
          <>
            <div className="greet">
              <p><span>Hello, Karthik.</span></p>
              <p>How can I help you Today?</p>
            </div>
          </>
        ) : (
          <div className="messages-container">
            {chatHistory.map((message, index) => (
  <div key={index} className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}>
    <img 
      className="message-avatar" 
      src={message.sender === 'user' ? assets.user_icon : assets.bot_icon} 
      alt={message.sender === 'user' ? 'User' : 'Bot'} 
    />
    <div className="message-content">
      {message.file && message.file.preview && (
        <div className="file-preview">
          <img src={message.file.preview} alt="Uploaded file" />
        </div>
      )}
      {message.file && !message.file.preview && (
        <div className="file-attachment">
          <span className="file-name">{message.file.name}</span>
        </div>
      )}
      
      {message.text.split('\n').map((paragraph, pIndex) => {
        if (paragraph.startsWith('## ')) {
          return <h3 key={pIndex} className="message-heading">{paragraph.substring(3)}</h3>;
        } else if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
          return <strong key={pIndex}>{paragraph.substring(2, paragraph.length-2)}</strong>;
        } else if (paragraph.trim() === '') {
          return <br key={pIndex} />;
        } else if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
          return <li key={pIndex}>{paragraph.substring(2)}</li>;
        } else if (paragraph.startsWith('```') && message.text.includes('\n```\n')) {
          const codeStart = message.text.indexOf('```') + 3;
          const codeEnd = message.text.lastIndexOf('```');
          const codeContent = message.text.substring(codeStart, codeEnd);
          return (
            <pre key={pIndex} className="message-code-block">
              <code>{codeContent}</code>
            </pre>
          );
        } else {
          return <p key={pIndex}>{paragraph}</p>;
        }
      })}
      
      <span className="timestamp">
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  </div>
))}
            {loading && (
              <div className="message bot-message">
                <img className="message-avatar" src={assets.bot_icon} alt="Bot" />
                <div className="message-content" typing-indicator>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
        <div className="main-bottom">
          <div className="search-box">
            {selectedFile && (
              <div className="selected-file">
                <span>{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)}>✕</button>
              </div>
            )}
            <input 
              type="text" 
              placeholder="Enter your Answers" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <img 
                src={assets.gallery_icon} 
                alt="Upload" 
                onClick={handleFileSelect}
                className={selectedFile ? 'active' : ''}
              />
              <img 
                src={assets.mic_icon} 
                alt="Microphone" 
                onClick={toggleSpeechRecognition}
                className={isRecording ? 'active pulse' : ''}
              />
              <img 
                src={assets.send_icon} 
                alt="Send" 
                onClick={handleSendMessage}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
          <p className="bottom-info">
            This is an AI Interview ChatBot, So you will get the Responses in that Manner
          </p>
        </div>
      </div>
    </div>
  );
};

export default Main;