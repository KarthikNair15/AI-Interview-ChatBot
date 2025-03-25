import React, { useState } from 'react';
import './CandidateForm.css';

const CandidateForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    skills: '',
    githubProfile: '',
    resume: null,
    timeLimit: '30' 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      resume: e.target.files[0]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="candidate-form-container">
      <h2>Interview Information Form</h2>
      <p>Please fill out this form to start your interview</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name *</label>
          <input 
            type="text" 
            name="fullName" 
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Email *</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Phone Number</label>
          <input 
            type="tel" 
            name="phone" 
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Position Applying For *</label>
          <input 
            type="text" 
            name="position" 
            value={formData.position}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Years of Experience *</label>
          <select 
            name="experience" 
            value={formData.experience}
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            <option value="0-1">0-1 years</option>
            <option value="1-3">1-3 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5+">5+ years</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Key Skills *</label>
          <textarea 
            name="skills" 
            value={formData.skills}
            onChange={handleChange}
            placeholder="List your technical skills separated by commas"
            required
          />
        </div>
        
        <div className="form-group">
          <label>GitHub Profile URL</label>
          <input 
            type="url" 
            name="githubProfile" 
            value={formData.githubProfile}
            onChange={handleChange}
            placeholder="https://github.com/yourusername"
          />
        </div>
        
        <div className="form-group">
          <label>Upload Resume (PDF/DOCX)</label>
          <input 
            type="file" 
            name="resume"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
          />
        </div>
        
        <button type="submit" className="submit-btn">
          Start Interview
        </button>
      </form>
    </div>
  );
};

export default CandidateForm;