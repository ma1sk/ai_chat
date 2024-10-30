from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
from PIL import Image
import io
import base64
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from werkzeug.middleware.proxy_fix import ProxyFix
import logging
from flask_wtf.csrf import CSRFProtect

load_dotenv()

app = Flask(__name__)

# Initialize CSRF protection
csrf = CSRFProtect(app)

# Configure Talisman with proper CSP
Talisman(app, 
    content_security_policy={
        'default-src': "'self'",
        'script-src': ["'self'", 'cdnjs.cloudflare.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'cdnjs.cloudflare.com'],
        'font-src': ["'self'", 'fonts.gstatic.com'],
        'img-src': ["'self'", 'data:'],
        'connect-src': "'self'"
    }
)

# Initialize Gemini AI
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    raise ValueError("No API key found. Please set GOOGLE_API_KEY in .env file")

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-pro')
chat = model.start_chat()

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Handle proxy headers
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

# Add error logging
logger = logging.getLogger(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/send_message', methods=['POST'])
@limiter.limit("20 per minute")
def send_message():
    try:
        user_message = request.json.get('message', '').strip()
        if not user_message:
            return jsonify({'error': 'Empty message'}), 400
        if len(user_message) > 2000:  # Add reasonable limit
            return jsonify({'error': 'Message too long'}), 400
            
        response = chat.send_message(user_message)
        return jsonify({'response': response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze_image', methods=['POST'])
@limiter.limit("10 per minute")
def analyze_image():
    try:
        image_data = request.json.get('image', '')
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400
            
        # Add size limit (5MB)
        if len(image_data) > 5 * 1024 * 1024:
            return jsonify({'error': 'Image too large (max 5MB)'}), 400
            
        # Convert base64 to image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert RGBA to RGB if necessary
        if image.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[-1])
            image = background
        
        # Use Gemini Pro Vision to analyze image
        vision_model = genai.GenerativeModel('gemini-pro-vision')
        response = vision_model.generate_content(["Describe what you see in this image.", image])
        
        return jsonify({'response': response.text})
    except Exception as e:
        logger.error(f"Image analysis error: {str(e)}")
        return jsonify({'error': 'Error processing image'}), 500

# Add error handlers
@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({'error': 'Rate limit exceeded'}), 429

@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal error: {str(e)}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True)