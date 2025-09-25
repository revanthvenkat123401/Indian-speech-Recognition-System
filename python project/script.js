class SpeechRecognitionSystem {
    constructor() {
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.isRecording = false;
        this.transcript = '';
        
        this.setupRecognition();
        this.initializeElements();
        this.setupEventListeners();
        
        // Add English language feedback messages
        this.messages = {
            START_PROMPT: 'Click "Start Recording" to begin',
            RECORDING: 'Recording in progress... Speak clearly',
            STOPPED: 'Recording stopped. Your transcript is ready.',
            ERROR_START: 'Error starting recognition. Please try again.',
            BROWSER_ERROR: 'Speech recognition is not supported in this browser. Please use Chrome or Edge.',
            NO_SPEECH: 'No speech detected. Please try again.',
            NETWORK_ERROR: 'Network error. Please check your internet connection.',
            PERMISSION_ERROR: 'Microphone permission denied. Please allow microphone access.'
        };
        
        // Add language mapping for better translation
        this.languageMapping = {
            'en-US': 'en',
            'hi-IN': 'hi',
            'te-IN': 'te',
            'ta-IN': 'ta',
            'kn-IN': 'kn',
            'ml-IN': 'ml',
            'mr-IN': 'mr',
            'bn-IN': 'bn',
            'gu-IN': 'gu'
        };
    }

    setupRecognition() {
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        
        this.recognition.onresult = async (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    // Translate final transcript to English
                    const translatedText = await this.translateToEnglish(transcript);
                    finalTranscript += translatedText;
                } else {
                    interimTranscript += transcript;
                }
            }

            this.updateTranscript(finalTranscript, interimTranscript);
        };

        this.recognition.onnomatch = () => {
            this.statusElement.textContent = this.messages.NO_SPEECH;
        };

        this.recognition.onerror = (event) => {
            let errorMessage = this.messages.ERROR_START;
            if (event.error === 'network') {
                errorMessage = this.messages.NETWORK_ERROR;
            } else if (event.error === 'not-allowed') {
                errorMessage = this.messages.PERMISSION_ERROR;
            }
            this.statusElement.textContent = errorMessage;
            this.stopRecording();
        };
    }

    initializeElements() {
        this.startButton = document.getElementById('startButton');
        this.stopButton = document.getElementById('stopButton');
        this.languageSelect = document.getElementById('languageSelect');
        this.statusElement = document.getElementById('status');
        this.transcriptElement = document.getElementById('transcript');
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startRecording());
        this.stopButton.addEventListener('click', () => this.stopRecording());
        this.languageSelect.addEventListener('change', () => {
            this.recognition.lang = this.languageSelect.value;
        });
    }

    startRecording() {
        try {
            this.recognition.lang = this.languageSelect.value;
            this.recognition.start();
            this.isRecording = true;
            
            this.startButton.disabled = true;
            this.stopButton.disabled = false;
            this.statusElement.textContent = this.messages.RECORDING;
            this.statusElement.classList.add('recording');
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.statusElement.textContent = this.messages.ERROR_START;
        }
    }

    stopRecording() {
        try {
            this.recognition.stop();
            this.isRecording = false;
            
            this.startButton.disabled = false;
            this.stopButton.disabled = true;
            this.statusElement.textContent = this.messages.STOPPED;
            this.statusElement.classList.remove('recording');
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }

    updateTranscript(finalTranscript, interimTranscript) {
        if (finalTranscript) {
            this.transcript += `Original: ${interimTranscript}\nEnglish Translation: ${finalTranscript}\n\n`;
        }
        this.transcriptElement.textContent = this.transcript + 
            (interimTranscript ? `Speaking: ${interimTranscript}` : '');
    }

    async translateToEnglish(text) {
        try {
            const sourceLang = this.languageMapping[this.languageSelect.value] || 'auto';
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|en`
            );
            const data = await response.json();
            
            if (data.responseStatus === 200) {
                return data.responseData.translatedText;
            }
            return text;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    }
}

// Initialize the system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        alert(this.messages.BROWSER_ERROR);
        return;
    }
    
    new SpeechRecognitionSystem();
});