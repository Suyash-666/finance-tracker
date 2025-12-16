// src/services/speechRecognition.js
class SpeechRecognitionService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  isSupported() {
    return this.recognition !== null;
  }

  startListening(onResult, onError) {
    if (!this.recognition || this.isListening) {
      return;
    }

    this.isListening = true;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Speech recognized:', transcript);
      
      // Parse the transcript for expense data
      const expenseData = this.parseExpenseCommand(transcript);
      onResult(expenseData, transcript);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (error) {
      this.isListening = false;
      onError(error.message);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  parseExpenseCommand(transcript) {
    // Parse commands like:
    // "add expense 50 for food"
    // "add 25 dollars for gas"
    // "spent 100 on groceries"
    
    const expenseData = {
      amount: null,
      description: '',
      category: 'other'
    };

    // Extract amount (numbers with optional dollar signs)
    const amountMatch = transcript.match(/(\d+(?:\.\d{2})?)/);
    if (amountMatch) {
      expenseData.amount = parseFloat(amountMatch[1]);
    }

    // Extract description after "for", "on", or similar prepositions
    let description = '';
    const forMatch = transcript.match(/for\s+(.+)$/);
    const onMatch = transcript.match(/on\s+(.+)$/);
    
    if (forMatch) {
      description = forMatch[1];
    } else if (onMatch) {
      description = onMatch[1];
    } else {
      // Try to get description after amount
      const afterAmount = transcript.replace(/.*?(\d+(?:\.\d{2})?).*?(for|on)?\s*/, '');
      if (afterAmount) {
        description = afterAmount;
      }
    }

    expenseData.description = description.trim();

    // Determine category based on keywords
    const categories = {
      food: ['food', 'restaurant', 'lunch', 'dinner', 'breakfast', 'groceries', 'grocery'],
      transport: ['gas', 'fuel', 'uber', 'taxi', 'bus', 'transport', 'car'],
      shopping: ['shopping', 'clothes', 'amazon', 'store'],
      entertainment: ['movie', 'cinema', 'game', 'entertainment', 'fun'],
      bills: ['bill', 'electricity', 'water', 'internet', 'phone', 'rent'],
      health: ['doctor', 'medicine', 'pharmacy', 'hospital', 'health']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => transcript.includes(keyword))) {
        expenseData.category = category;
        break;
      }
    }

    return expenseData;
  }
}

export default new SpeechRecognitionService();