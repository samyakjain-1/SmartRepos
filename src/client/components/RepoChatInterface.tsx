import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { modelenceQuery } from '@modelence/react-query';
import { marked } from 'marked';
import { aiCache } from '../utils/aiCache';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  id?: number;
}

interface RepoChatInterfaceProps {
  owner: string;
  repoName: string;
}

// Configure marked for better code rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Markdown renderer component for chat messages
function MessageContent({ content }: { content: string }) {
  const htmlContent = marked(content) as string;
  
  return (
    <div 
      className="prose prose-sm prose-invert max-w-none
        prose-headings:text-white prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
        prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
        prose-p:text-gray-100 prose-p:leading-relaxed prose-p:my-2
        prose-code:bg-gray-700/50 prose-code:text-cyan-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-medium
        prose-pre:bg-gray-900/80 prose-pre:border prose-pre:border-gray-600 prose-pre:rounded-lg prose-pre:p-4 prose-pre:my-3
        prose-pre:code:bg-transparent prose-pre:code:text-gray-100 prose-pre:code:p-0
        prose-blockquote:border-l-blue-400 prose-blockquote:text-gray-300 prose-blockquote:italic
        prose-strong:text-white prose-strong:font-bold
        prose-ul:text-gray-100 prose-ul:my-2 prose-ol:text-gray-100 prose-ol:my-2
        prose-li:text-gray-100 prose-li:my-1
        prose-a:text-blue-400 prose-a:underline prose-a:decoration-1 prose-a:underline-offset-2"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

export default function RepoChatInterface({ owner, repoName }: RepoChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cachedHistory = aiCache.get('chat', owner, repoName);
    if (cachedHistory) {
      setChatHistory(cachedHistory);
    } else {
      setChatHistory([
        { 
          role: 'assistant', 
          content: `Hi there! I'm your ${repoName} assistant. Ask me anything about ${repoName}!` 
        }
      ]);
    }
  }, [owner, repoName]);

  useEffect(() => {
    if (chatHistory.length > 1) {
      aiCache.set('chat', owner, repoName, chatHistory);
    }
  }, [chatHistory, owner, repoName]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Chat mutation using our repo-chat module
  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const query = modelenceQuery('repoChat.chatWithRepository', {
        message: userMessage,
        owner,
        repoName,
        chatHistory: chatHistory.filter(msg => !msg.isLoading).slice(-6), // Last 6 messages
      });
      const result = await query.queryFn();
      return result as { response: string; success: boolean };
    },
    onSuccess: (data, userMessage) => {
      // Replace the loading message with the actual response
      setChatHistory(prev => 
        prev.map(msg => 
          msg.isLoading ? { role: 'assistant', content: data.response } : msg
        )
      );
    },
    onError: (error) => {
      console.error('Chat error:', error);
      // Replace the loading message with error
      setChatHistory(prev => 
        prev.filter(msg => !msg.isLoading)
          .concat([{ 
            role: 'assistant', 
            content: `Chat error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
          }])
      );
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;
    
    const userMessage = message.trim();
    
    // Add user message
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');
    setLoading(true);
    
    // Show immediate thinking indicator
    const typingIndicatorId = Date.now();
    setChatHistory(prev => [...prev, { 
      role: 'assistant', 
      content: 'Analyzing repository and thinking...',
      isLoading: true,
      id: typingIndicatorId
    }]);
    
    try {
      await chatMutation.mutateAsync(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Suggestion buttons (same as devora)
  const suggestions = [
    'How do I get started?',
    'What are the main features?',
    'Show me an example',
    'How do I install this?',
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-blue-950 rounded-lg overflow-hidden">
      {/* Compact Chat Header */}
      <div className="flex items-center p-4 border-b border-gray-800/50">
        <div className="relative w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
          <img 
            src={`https://github.com/${owner}.png?size=40`} 
            alt={`${owner}'s avatar`}
            className="w-8 h-8 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://via.placeholder.com/32/4f46e5/white?text=${owner.charAt(0).toUpperCase()}`;
            }}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium text-white">
            {`${repoName} Assistant`}
          </h3>
          <p className="text-blue-200 text-xs">
            Ask me anything about {repoName}
          </p>
        </div>
      </div>

      {/* Make the main content area scrollable */}
      <div className="flex-grow overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
        {/* Suggestion Buttons (shown only at start) */}
        {chatHistory.length === 1 && (
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="p-3 bg-blue-800/30 hover:bg-blue-700/40 text-blue-200 rounded-lg text-sm transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="px-6 space-y-4">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' 
                  : 'bg-gray-800/90 text-gray-100'
              } rounded-2xl px-4 py-3`}>
                {msg.isLoading ? (
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                ) : (
                  msg.role === 'user' ? (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  ) : (
                    <MessageContent content={msg.content} />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/90 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything or any task"
              className="w-full py-3 px-4 bg-gray-800/50 text-white rounded-full pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700/50"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !message.trim()}
              className="absolute right-1 top-1 p-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
