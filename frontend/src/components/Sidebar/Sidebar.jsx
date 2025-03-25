import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import { assets } from '../../assets/assets';

const Sidebar = ({ setChatHistory, setCurrentChat, setActiveSection, darkMode, setDarkMode }) => {
  const [extended, setExtended] = useState(false);
  const [chats, setChats] = useState([]);
  const [editingChat, setEditingChat] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem('chatHistory')) || [];
    setChats(savedChats);
  }, []);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chats));
  }, [chats]);

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date().toISOString()
    };
    
    setChats([newChat, ...chats]);
    setCurrentChat(newChat);
    setChatHistory([]);
    setActiveSection('chat');
  };

  const selectChat = (chat) => {
    setCurrentChat(chat);
    setChatHistory(chat.messages);
    setActiveSection('chat');
  };

  const deleteChat = (e, chatId) => {
    e.stopPropagation();
    setChats(chats.filter(chat => chat.id !== chatId));
    
    const currentChat = JSON.parse(localStorage.getItem('currentChat'));
    if (currentChat && currentChat.id === chatId) {
      createNewChat();
    }
  };

  const startRenameChat = (e, chat) => {
    e.stopPropagation();
    setEditingChat(chat.id);
    setEditValue(chat.title);
  };

  const finishRenameChat = () => {
    if (editingChat) {
      setChats(chats.map(chat => 
        chat.id === editingChat ? {...chat, title: editValue || 'Untitled Chat'} : chat
      ));
      setEditingChat(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      finishRenameChat();
    }
  };

  const showHelp = () => {
    setActiveSection('help');
  };

  const showActivity = () => {
    setActiveSection('activity');
  };

  const showSettings = () => {
    setActiveSection('settings');
  };

  return (
    <div className={`sidebar ${extended ? 'extended' : ''}`}>
      <div className="top">
        <img 
          onClick={() => setExtended(prev => !prev)} 
          className="menu" 
          src={assets.menu_icon} 
          alt=""
        />
        <div className="new-chat" onClick={createNewChat}>
          <img src={assets.plus_icon} alt="New Chat" />
          {extended ? <p>New Chat</p> : null} 
        </div>
        {extended ? (
          <div className="recent">
            <p className="recent-title">Recent</p>
            {chats.length > 0 ? (
              chats.map(chat => (
                <div 
                  key={chat.id} 
                  className="recent-entry"
                  onClick={() => selectChat(chat)}
                >
                  <img src={assets.message_icon} alt="" />
                  {editingChat === chat.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={finishRenameChat}
                      onKeyPress={handleKeyPress}
                      autoFocus
                      className="edit-input"
                    />
                  ) : (
                    <p>{chat.title}</p>
                  )}
                  <div className="chat-actions">
                    <img 
                      src={assets.rename_icon} 
                      alt="Rename" 
                      onClick={(e) => startRenameChat(e, chat)} 
                      className="action-icon"
                    />
                    <img 
                      src={assets.deleted_icon} 
                      alt="Delete" 
                      onClick={(e) => deleteChat(e, chat.id)}
                      className="action-icon"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No recent chats</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
      
      <div className="bottom">
        <div className="bottom-item recent-entry" onClick={showHelp}>
          <img src={assets.info_icon} alt="About" />
          {extended ? <p>About</p> : null}
        </div>
        <div className="bottom-item recent-entry" onClick={showActivity}>
          <img src={assets.history_icon} alt="Activity" />
          {extended ? <p>Activity</p> : null}
        </div>
        
      </div>
    </div>
  );
};

export default Sidebar;