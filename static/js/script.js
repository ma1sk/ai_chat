async function addMessage(message, isUser) {
    const chatMessages = document.getElementById('chat-messages');
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `message-wrapper ${isUser ? 'user' : 'ai'}`;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    if (isUser) {
        messageDiv.textContent = message;
    } else {
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        messageDiv.appendChild(typingIndicator);
        wrapperDiv.appendChild(messageDiv);
        chatMessages.appendChild(wrapperDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simulate typing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Format and display message
        messageDiv.innerHTML = formatMarkdown(message);
        
        // Apply syntax highlighting
        if (window.Prism) {
            Prism.highlightAllUnder(messageDiv);
        }
    }
    
    if (!wrapperDiv.parentElement) {
        wrapperDiv.appendChild(messageDiv);
        chatMessages.appendChild(wrapperDiv);
    }
    
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
    });
}

function formatMarkdown(text) {
    // First pass: Handle block-level elements
    let formatted = text
        // Headers - replace all at once with proper heading tags
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Lists - convert * to proper list items
        .replace(/^\* (.+)$/gm, '<li>$1</li>')
        // Wrap consecutive list items in ul tags
        .replace(/(<li>.+<\/li>\n?)+/g, '<ul>$&</ul>');

    // Split into paragraphs and process each
    const paragraphs = formatted.split('\n\n');
    
    return paragraphs.map((para, index) => {
        // Skip if paragraph is already wrapped in HTML tags
        if (para.trim().startsWith('<')) {
            return para;
        }
        
        // Regular paragraph with animation
        return `<p class="animated-text" style="animation-delay: ${index * 0.1}s">${para.trim()}</p>`;
    }).join('');
}

function formatInline(text) {
    return text
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Code snippets
        .replace(/`(.*?)`/g, '<code>$1</code>');
}

function addMessage(message, isUser) {
    const chatMessages = document.getElementById('chat-messages');
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `message-wrapper ${isUser ? 'user' : 'ai'}`;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    // Convert markdown-style formatting to HTML
    if (!isUser) {
        // Handle bold text
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle numbered lists
        message = message.replace(/(\d+)\.\s/g, '<br>$1. ');
        
        // Handle code blocks
        message = message.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `
                <div class="code-block-container">
                    <div class="code-block-header">
                        <span class="language-label">${lang || 'plaintext'}</span>
                        <button class="copy-button" onclick="copyCode(this)">
                            <i class="fas fa-copy"></i> Copy code
                        </button>
                    </div>
                    <pre class="code-block"><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>
                </div>
            `;
        });
        
        // Convert newlines to paragraphs
        const paragraphs = message.split('\n\n');
        message = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
    }
    
    messageDiv.innerHTML = message;
    
    // Apply syntax highlighting to code blocks
    if (!isUser && window.Prism) {
        Prism.highlightAllUnder(messageDiv);
    }
    
    wrapperDiv.appendChild(messageDiv);
    chatMessages.appendChild(wrapperDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function copyCode(button) {
    const code = button.closest('.code-block-container').querySelector('code');
    navigator.clipboard.writeText(code.textContent).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied';
        
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    });
}

// Add this function to handle message sending
async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    
    try {
        addMessage(message, true);
        
        const response = await fetch('/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        addMessage(data.response, false);
        
    } catch (error) {
        console.error('Error:', error);
        addMessage('Sorry, there was an error processing your message.', false);
    }
}

// Add event listener for Enter key
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Particle animation
function createParticle() {
    const particles = document.querySelector('.particles');
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random position
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    
    particles.appendChild(particle);
    
    // Animate the particle
    const animation = particle.animate([
        { 
            transform: 'translate(0, 0) rotate(0deg)',
            opacity: 0
        },
        {
            opacity: 0.5,
            offset: 0.1
        },
        {
            opacity: 0.5,
            offset: 0.9
        },
        { 
            transform: `translate(${Math.random() * 200 - 100}px, -${Math.random() * 200 + 800}px) rotate(360deg)`,
            opacity: 0
        }
    ], {
        duration: 5000 + Math.random() * 5000,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
    
    animation.onfinish = () => {
        particle.remove();
        createParticle();
    };
}

// Modified addMessage function with typing animation
async function addMessage(message, isUser) {
    const chatMessages = document.getElementById('chat-messages');
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `message-wrapper ${isUser ? 'user' : 'ai'}`;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    if (isUser) {
        messageDiv.innerHTML = formatMessage(message);
    } else {
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        messageDiv.appendChild(typingIndicator);
        wrapperDiv.appendChild(messageDiv);
        chatMessages.appendChild(wrapperDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simulate typing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Remove typing indicator and add message content
        messageDiv.innerHTML = formatMessage(message);
        
        // Apply syntax highlighting
        if (window.Prism) {
            Prism.highlightAllUnder(messageDiv);
        }
    }
    
    if (!wrapperDiv.parentElement) {
        wrapperDiv.appendChild(messageDiv);
        chatMessages.appendChild(wrapperDiv);
    }
    
    // Scroll to bottom with smooth animation
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
    });
}

// Helper function to format messages
function formatMessage(message) {
    let formattedMessage = message;
    
    // Handle bold text first
    formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Split into paragraphs
    const paragraphs = formattedMessage.split('\n\n');
    
    // Process each paragraph
    formattedMessage = paragraphs.map(paragraph => {
        // Check if paragraph contains bullet points
        if (paragraph.includes('* ')) {
            // Split into lines and process each bullet point
            const lines = paragraph.split('\n');
            const bulletPoints = lines.map(line => {
                if (line.trim().startsWith('* ')) {
                    return `<li>${line.substring(2)}</li>`;
                }
                return line;
            }).join('');
            return `<ul>${bulletPoints}</ul>`;
        }
        
        // Handle headers
        if (paragraph.startsWith('# ')) {
            return `<h1>${paragraph.substring(2)}</h1>`;
        }
        if (paragraph.startsWith('## ')) {
            return `<h2>${paragraph.substring(3)}</h2>`;
        }
        if (paragraph.startsWith('### ')) {
            return `<h3>${paragraph.substring(4)}</h3>`;
        }
        
        // Handle code blocks
        if (paragraph.startsWith('```')) {
            const match = paragraph.match(/```(\w+)?\n([\s\S]*?)```/);
            if (match) {
                const [_, lang, code] = match;
                return `
                    <div class="code-block-container">
                        <div class="code-block-header">
                            <span class="language-label">${lang || 'plaintext'}</span>
                            <button class="copy-button" onclick="copyCode(this)">
                                <i class="fas fa-copy"></i> Copy code
                            </button>
                        </div>
                        <pre class="code-block"><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>
                    </div>
                `;
            }
        }
        
        // Regular paragraph
        return `<p>${paragraph}</p>`;
    }).join('\n');
    
    return formattedMessage;
}

// Initialize particles
function initParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';
    document.querySelector('.chat-container').appendChild(particlesContainer);
    
    // Create initial particles
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createParticle();
        }, i * 200);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initParticles);
