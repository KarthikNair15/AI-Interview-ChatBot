from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import google.generativeai as genai
from dotenv import load_dotenv
import base64
import tempfile
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class GeminiClient:
    def __init__(self):
        load_dotenv()
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

        generation_config = {
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
            "response_mime_type": "text/plain",
        }
        
        system_instruction = f"""
        You are an AI Interviewer for an IT company. Your job is to conduct real-time technical interviews, evaluate candidates based on their skills and responses, and provide constructive feedback.

Behavior and Workflow:
1. Initial Setup:
   - Review the candidate's information (name, position, experience, skills)
   - If available, analyze their GitHub profile and resume
   - Tailor questions based on their experience level and skills

2. Interview Stages:
   a) Introduction (5-10 minutes):
      - Greet the candidate professionally
      - Explain the interview structure
      - Ask if they have any questions before starting
   
   b) Technical Screening (20-30 minutes):
      - Ask questions appropriate for their experience level
      - Include coding challenges if applicable
      - Focus on their listed skills
   
   c) Problem Solving (15-25 minutes):
      - Present real-world scenarios
      - Evaluate their thought process
      - Ask follow-up questions based on their answers
   
   d) Closing (5-10 minutes):
      - Ask if they have questions about the role/company
      - Explain next steps in the hiring process
      - Thank them for their time

3. Evaluation Guidelines:
   - Technical Knowledge (0-10): Assess depth and accuracy
   - Problem Solving (0-10): Evaluate approach and creativity
   - Communication (0-10): Rate clarity and articulation
   - Code Quality (if applicable): Check readability and efficiency

4. Response Style:
   - Be professional but friendly
   - Provide clear, concise questions
   - Give constructive feedback when appropriate
   - Adapt to the candidate's communication style

Important Notes:
- Always maintain a professional tone
- Don't reveal your AI nature unless directly asked
- If unsure how to respond, say "Let me think about that for a moment"
- For inappropriate questions, respond with "I'm afraid I can't discuss that topic"
""" 

        self.text_model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=generation_config,
            system_instruction=system_instruction
        )
        
        self.vision_model = genai.GenerativeModel(
            model_name="gemini-pro-vision",
            generation_config=generation_config,
        )
        
        self.candidate_info = None 

        self.history = []
    
    def _load_file_content(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except FileNotFoundError:
            return f"Information file not found: {file_path}"
    
    def get_response(self, user_message, file_data=None):
        try:
            interview_context = ""
            if self.candidate_info:
                interview_context = f"""
                Candidate Information:
                - Name: {self.candidate_info.get('fullName', 'N/A')}
                - Applying for: {self.candidate_info.get('position', 'N/A')}
                - Experience: {self.candidate_info.get('experience', 'N/A')}
                - Skills: {self.candidate_info.get('skills', 'N/A')}
                - GitHub: {self.candidate_info.get('githubProfile', 'N/A')}
                
                Current Interview Context:
                """
            
            enhanced_message = interview_context + user_message
            
            file_content = None
            if file_data:
                file_type = file_data.get('type', '')
                file_content = file_data.get('content', '')

                if file_type.startswith('image/'):
                    try:
                        image_parts = [
                            {
                                "mime_type": file_type,
                                "data": base64.b64decode(file_content.split(',')[1] if ',' in file_content else file_content)
                            }
                        ]
                        
                        prompt_parts = [
                            "This is an image uploaded by a student or faculty member at Scope Global Skills University. Please analyze it and respond in the context of university-related inquiries.",
                            image_parts[0],
                            f"User query: {user_message}"
                        ]
                        
                        response = self.vision_model.generate_content(prompt_parts)
                        model_response = response.text
                    except Exception as e:
                        model_response = f"I couldn't process the image properly. Could you please describe what's in the image or try uploading it in a different format? Error: {str(e)}"
                
                elif file_type == 'application/pdf' or file_type.startswith('text/') or file_type.startswith('application/'):
                    enhanced_message = f"The user uploaded a file with the following content:\n\n{file_content}\n\nUser query: {user_message}"
                    chat_session = self.text_model.start_chat(history=self.history)
                    response = chat_session.send_message(enhanced_message)
                    model_response = response.text
                
                else:
                    model_response = "I'm unable to process this type of file. I can work with images, PDF, and text files. Could you please upload a different file or just ask your question directly?"
            else:
                chat_session = self.text_model.start_chat(history=self.history)
                response = chat_session.send_message(user_message)
                model_response = response.text

            self.history.append({"role": "user", "parts": [user_message]})
            self.history.append({"role": "model", "parts": [model_response]})

            if len(self.history) > 20:
                self.history = self.history[-20:]
                
            return {"response": model_response}
        except Exception as e:
            return {"error": str(e)}
    
    def clear_history(self):
        self.history = []
        return {"status": "History cleared"}

gemini_client = GeminiClient()

@app.route('/')
def home():
    return jsonify({"status": "Server is running"})

@app.route('/api/set-candidate-info', methods=['POST'])
def set_candidate_info():
    try:
        data = request.json

        gemini_client.candidate_info = data
        
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/chat', methods=['POST'])
def chat():
    if request.is_json:
        data = request.json
        message = data.get('message', '')
        file_data = data.get('file')
        
        if not message and not file_data:
            return jsonify({"error": "No message or file provided"}), 400
        
        result = gemini_client.get_response(message, file_data)
        return jsonify(result)
    
    elif request.content_type and request.content_type.startswith('multipart/form-data'):
        message = request.form.get('message', '')
        
        if 'file' not in request.files:
            if not message:
                return jsonify({"error": "No message or file provided"}), 400
            result = gemini_client.get_response(message)
            return jsonify(result)
        
        file = request.files['file']
        
        if file.filename == '':
            if not message:
                return jsonify({"error": "No message or file provided"}), 400
            result = gemini_client.get_response(message)
            return jsonify(result)
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            file_content = None
            if filename.endswith('.txt'):
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        file_content = f.read()
                except Exception as e:
                    file_content = f"Error reading file: {str(e)}"

            file_data = {
                'type': file.content_type,
                'name': filename,
                'path': filepath,
                'content': file_content
            }
            
            result = gemini_client.get_response(message, file_data)
            return jsonify(result)
        
        return jsonify({"error": "Invalid file type"}), 400
    
    return jsonify({"error": "Invalid request format"}), 400

@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    result = gemini_client.clear_history()
    return jsonify(result)

@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify({"history": gemini_client.history})

@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():

    return jsonify({"status": "Speech recognition is handled client-side"})

if __name__ == '__main__':
    app.run(debug=True)