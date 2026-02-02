import { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  MessageSquare, 
  Volume2, 
  VolumeX, 
  Globe, 
  User, 
  Bot, 
  Minimize2,
  Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isVoice?: boolean;
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

// Speech recognition types are in src/types/speech.d.ts

const languages: Language[] = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
  { code: 'ar-SA', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi-IN', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru-RU', name: 'Русский', flag: '🇷🇺' },
];

// Interview questions and suggested responses
const interviewResponses: Record<string, string> = {
  'life story': 'I am a passionate AI developer with a background in software engineering. My journey started with a curiosity about how technology can solve real-world problems. Over the years, I have worked on various projects ranging from web applications to machine learning models. I believe in continuous learning and adapting to new technologies. Outside of work, I enjoy reading, hiking, and contributing to open-source projects.',
  'superpower': 'My #1 superpower is adaptability. I thrive in fast-paced environments and can quickly learn new technologies or methodologies. This allows me to contribute effectively to diverse projects and teams, regardless of the tech stack or domain.',
  'grow': 'The top 3 areas I would like to grow in are: 1) Advanced AI/ML techniques and their practical applications, 2) Leadership and team management skills to mentor junior developers, and 3) Domain expertise in emerging technologies like blockchain and IoT.',
  'misconception': 'A common misconception my coworkers might have is that I am always serious and focused only on work. While I am dedicated to my craft, I also value team bonding, humor, and creating a positive work environment. I enjoy casual conversations and building genuine relationships with colleagues.',
  'boundaries': 'I push my boundaries by taking on challenging projects that are slightly outside my comfort zone. I regularly attend tech conferences, participate in hackathons, and dedicate time to learning new skills. I also seek feedback actively and use it as a tool for growth.',
  'strength': 'One of my key strengths is problem-solving. I approach challenges methodically, breaking them down into manageable parts and finding creative solutions. I am also a strong communicator, which helps in collaborating effectively with cross-functional teams.',
  'weakness': 'I tend to be a perfectionist, which sometimes means I spend more time than necessary on details. I am working on finding the right balance between quality and efficiency, learning when good enough is truly sufficient.',
  'conflict': 'When faced with conflict, I believe in open and honest communication. I try to understand all perspectives, find common ground, and work towards a solution that benefits everyone. I am not afraid to have difficult conversations when they are necessary for the team success.',
  'pressure': 'I handle pressure by staying organized and prioritizing tasks effectively. I break down large projects into smaller, manageable milestones and focus on one thing at a time. I also believe in taking short breaks to maintain mental clarity.',
  'teamwork': 'I believe great teamwork comes from clear communication, mutual respect, and shared goals. I always strive to understand my teammates perspectives and contribute positively to the team dynamic. I am equally comfortable leading and following, depending on what the situation requires.',
};

// Free LLM API using Hugging Face Inference API (no key required for some models)
const HF_API_URL = 'https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill';

async function getBotResponse(userMessage: string): Promise<string> {
  // Check for interview-related keywords
  const lowerMsg = userMessage.toLowerCase();
  
  for (const [keyword, response] of Object.entries(interviewResponses)) {
    if (lowerMsg.includes(keyword)) {
      return response;
    }
  }
  
  // Default responses for common questions
  if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
    return 'Hello! Welcome to the AI Interview Bot. I am here to help you practice for your interview. Feel free to ask me any questions about my background, skills, or experience. What would you like to know?';
  }
  
  if (lowerMsg.includes('name')) {
    return 'I am an AI candidate preparing for the AI Agent Team position. I am excited about the opportunity to contribute my skills in software development and AI to your team!';
  }
  
  if (lowerMsg.includes('experience') || lowerMsg.includes('background')) {
    return 'I have several years of experience in software development, with a focus on AI and machine learning applications. I have worked on projects involving natural language processing, computer vision, and full-stack web development. I am particularly proud of a recent project where I built an intelligent chatbot system that improved customer support efficiency by 40%.';
  }
  
  if (lowerMsg.includes('skill') || lowerMsg.includes('technology')) {
    return 'My technical skills include Python, JavaScript/TypeScript, React, Node.js, and various AI/ML frameworks like TensorFlow and PyTorch. I am also experienced with cloud platforms (AWS, GCP), Docker, and CI/CD pipelines. I am always eager to learn new technologies and adapt to the team needs.';
  }
  
  if (lowerMsg.includes('why') && lowerMsg.includes('job')) {
    return 'I am excited about this position because it combines my passion for AI with the opportunity to work on impactful projects. Your company mission aligns with my values, and I believe my skills in AI development and collaborative problem-solving would make me a valuable addition to your team.';
  }
  
  if (lowerMsg.includes('salary') || lowerMsg.includes('compensation')) {
    return 'I am open to discussing compensation based on the market rate for this position and my experience level. I value the total package including benefits, growth opportunities, and the chance to work on meaningful projects. I am confident we can find a mutually beneficial arrangement.';
  }
  
  if (lowerMsg.includes('remote') || lowerMsg.includes('work from home')) {
    return 'I am fully comfortable with remote work. I have a dedicated home office setup and experience collaborating with distributed teams across different time zones. I use tools like Slack, Zoom, and project management platforms to stay connected and productive.';
  }
  
  if (lowerMsg.includes('question') || lowerMsg.includes('ask')) {
    return 'I would love to learn more about the team structure, the specific projects I would be working on, and what success looks like in this role. I am also curious about opportunities for professional development and growth within the company.';
  }
  
  // Try Hugging Face API for other queries
  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: userMessage }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text;
      }
    }
  } catch (error) {
    console.log('HF API fallback, using local response');
  }
  
  // Fallback response
  return 'That is an interesting question! As a candidate for the AI Agent Team, I am eager to bring my technical expertise, collaborative spirit, and passion for innovation to your organization. I believe in continuous learning and would love to discuss how my skills can contribute to your team success. Is there anything specific about my background or experience you would like to know more about?';
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Hello! I am your AI Interview Assistant. I am here to help you practice interview questions. Feel free to ask me about my background, skills, experience, or any other questions you might have for a candidate!',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        handleSendMessage(transcript);
      };
      
      recognitionRef.current.onerror = () => {
        setIsRecording(false);
        toast.error('Speech recognition failed. Please try again.');
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [selectedLanguage]);

  // Proactive messaging
  useEffect(() => {
    const proactiveTimer = setTimeout(() => {
      if (messages.length === 1) {
        setMessages(prev => [
          ...prev,
          {
            id: 'proactive',
            content: 'Feel free to ask me questions like: "What should we know about your life story?", "What is your #1 superpower?", or "What are your top 3 growth areas?"',
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
      }
    }, 10000);
    
    return () => clearTimeout(proactiveTimer);
  }, []);

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      sender: 'user',
      timestamp: new Date(),
      isVoice: isRecording,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    
    try {
      const botResponse = await getBotResponse(text);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Auto-speak bot response if not muted
      if (!isMuted && synthRef.current) {
        speakText(botResponse);
      }
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage.code;
    utterance.rate = 1;
    utterance.pitch = 1;
    
    synthRef.current.speak(utterance);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser.');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.lang = selectedLanguage.code;
      recognitionRef.current.start();
      setIsRecording(true);
      toast.info('Listening... Speak now!');
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const requestHumanHandoff = () => {
    setMessages(prev => [
      ...prev,
      {
        id: 'handoff',
        content: 'Connecting you to a human representative... Please wait a moment.',
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    
    // Simulate human connection
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: 'human',
          content: 'Hello! This is Sarah from the HR team. I have received your request for human assistance. How can I help you today?',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    }, 3000);
  };

  if (isMinimized) {
    return (
      <TooltipProvider>
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setIsMinimized(false)}
            className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl h-[90vh] flex flex-col bg-white/95 backdrop-blur-xl shadow-2xl border-0 overflow-hidden">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">AI Interview Bot</h2>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  {isTyping ? (
                    <>
                      <span className="animate-pulse">Typing</span>
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                    </>
                  ) : (
                    'Online - Ready to chat'
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                      className="text-white hover:bg-white/20"
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      {selectedLanguage.flag}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select Language</p>
                  </TooltipContent>
                </Tooltip>
                
                {showLanguageMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-y-auto z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSelectedLanguage(lang);
                          setShowLanguageMenu(false);
                          toast.success(`Language changed to ${lang.name}`);
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2',
                          selectedLanguage.code === lang.code && 'bg-blue-50 text-blue-600'
                        )}
                      >
                        <span>{lang.flag}</span>
                        <span className="text-sm">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Mute Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (!isMuted) stopSpeaking();
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMuted ? 'Unmute' : 'Mute'}</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Human Handoff */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={requestHumanHandoff}
                    className="text-white hover:bg-white/20"
                  >
                    <Headphones className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Talk to Human</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Minimize */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(true)}
                    className="text-white hover:bg-white/20"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Minimize</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          
          {/* Messages Area */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600'
                  )}
                >
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-3 text-sm',
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                  )}
                >
                  <p className="leading-relaxed">{message.content}</p>
                  <div
                    className={cn(
                      'flex items-center gap-2 mt-2 text-xs',
                      message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                    )}
                  >
                    <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {message.isVoice && <Mic className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>
          
          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleRecording}
                    className={cn(
                      'rounded-full flex-shrink-0 transition-all',
                      isRecording
                        ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 animate-pulse'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isRecording ? 'Stop Recording' : 'Voice Input'}</p>
                </TooltipContent>
              </Tooltip>
              
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 rounded-full px-4 py-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send Message</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {['Life story', 'Superpower', 'Growth areas', 'Misconception', 'Boundaries'].map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="secondary"
                  className="cursor-pointer hover:bg-blue-100 transition-colors text-xs"
                  onClick={() => {
                    const questions: Record<string, string> = {
                      'Life story': 'What should we know about your life story in a few sentences?',
                      'Superpower': "What is your #1 superpower?",
                      'Growth areas': 'What are the top 3 areas you would like to grow in?',
                      'Misconception': 'What misconception do your coworkers have about you?',
                      'Boundaries': 'How do you push your boundaries and limits?',
                    };
                    handleSendMessage(questions[suggestion]);
                  }}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
        
        {/* Language menu click outside handler */}
        {showLanguageMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowLanguageMenu(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

export default App;
