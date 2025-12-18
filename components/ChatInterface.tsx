import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/gemini';

// SVG Components
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const IconUser = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const IconBot = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>;
const IconArrowLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;

// Helper to parse bold text (**text**)
const parseBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

// Component to render tables and formatted text
const FormattedMessage: React.FC<{ text: string; role: 'user' | 'model' }> = ({ text, role }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[] = [];
  let listItems: React.ReactNode[] = [];

  const flushTable = (keyPrefix: string) => {
    if (tableRows.length === 0) return;

    // Helper: Parse a pipe-separated row into clean cells
    const parseRow = (row: string) => {
      // Remove outer pipes if they exist (e.g. "| cell |" -> " cell ")
      let content = row.trim();
      if (content.startsWith('|')) content = content.substring(1);
      if (content.endsWith('|')) content = content.substring(0, content.length - 1);
      
      return content.split('|').map(cell => cell.trim());
    };

    const headerRow = parseRow(tableRows[0]);
    
    // Filter out separator lines (e.g. "---", ":---")
    // Also ensuring we don't accidentally filter data rows that might look like separators to a weak regex
    const bodyRows = tableRows.slice(1).filter(row => {
        // Strip pipes and whitespace
        const stripped = row.replace(/[\|\s]/g, '');
        // A separator row typically only contains dashes and colons
        // Using a check to see if it contains alphanumeric characters - if so, it's data
        const hasData = /[a-zA-Z0-9$]/.test(stripped);
        return hasData;
    }).map(parseRow);

    if (headerRow.length > 0) {
      elements.push(
        <div key={`${keyPrefix}-table`} className="overflow-x-auto my-4 rounded-lg border border-gray-200">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className={role === 'model' ? "bg-gray-100 text-black" : "bg-white/20 text-white"}>
              <tr>
                {headerRow.map((cell, i) => (
                  <th key={i} className="px-4 py-3 font-bold uppercase tracking-wider border-none">
                    {parseBold(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent"> 
              {bodyRows.map((row, rIndex) => (
                <tr key={rIndex} className={role === 'model' ? "hover:bg-gray-50" : "hover:bg-white/10"}>
                  {row.map((cell, cIndex) => (
                    <td key={cIndex} className={`px-4 py-2 border-none align-top ${role === 'model' ? 'text-black' : 'text-white'}`}>
                      {parseBold(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableRows = [];
  };

  const flushList = (keyPrefix: string) => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`${keyPrefix}-list`} className="list-disc pl-5 my-2 space-y-1">
        {listItems}
      </ul>
    );
    listItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Detect Table Rows (must start with |)
    if (trimmed.startsWith('|')) {
      flushList(`list-${i}`); // Close any open list
      tableRows.push(trimmed);
      continue; 
    } 
    
    // Check if we are inside a table block but hit an empty line
    // If the NEXT line is a table row, ignore this empty line (don't break the table)
    if (tableRows.length > 0 && trimmed === '') {
        const nextLine = lines[i+1]?.trim();
        if (nextLine && nextLine.startsWith('|')) {
            continue; // Skip the empty line, keep accumulating table
        }
    }

    // If we reach here, the table block is definitely over
    flushTable(`table-${i}`);

    // 2. Detect Bullet Lists (- item or * item)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const content = trimmed.substring(2);
      listItems.push(<li key={`li-${i}`}>{parseBold(content)}</li>);
      continue;
    } else {
      flushList(`list-${i}`); // Close any open list
    }

    // 3. Detect Headers (### Header)
    if (trimmed.startsWith('###')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg font-bold mt-4 mb-2">
          {parseBold(trimmed.replace(/^#+\s*/, ''))}
        </h3>
      );
      continue;
    }

    // 4. Standard Paragraph
    if (trimmed.length > 0) {
      elements.push(
        <p key={`p-${i}`} className="leading-relaxed min-h-[1.2em]">
          {parseBold(trimmed)}
        </p>
      );
    }
  }

  // Flush remainders
  flushTable('end');
  flushList('end');

  return <div className="space-y-1">{elements}</div>;
};

interface ChatInterfaceProps {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onMouseEnter, onMouseLeave, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello! I am your University Housing Assistant. How can I help you today?', isLoading: false }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Placeholder for AI response
    const botMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: botMessageId, role: 'model', text: '', isLoading: true }]);

    let fullResponse = "";

    await sendMessageToGemini(userMessage.text, (chunk) => {
      fullResponse += chunk;
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, text: fullResponse, isLoading: false } 
            : msg
        )
      );
    });

    setIsTyping(false);
  };

  return (
    <div 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-cursor="maroon" // Elements inside have white bg -> maroon cursor
      className="w-full h-[90vh] md:h-[85vh] max-w-[1200px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200"
    >
      {/* Header */}
      <div 
        data-cursor="yellow" // Header is maroon -> yellow cursor
        className="bg-[#2B0000] p-4 flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-3">
          <button 
             onClick={onBack}
             className="text-[#FFC72C] hover:text-white transition-colors"
             data-cursor="yellow"
          >
             <IconArrowLeft />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#FFC72C] flex items-center justify-center text-[#2B0000]">
            <IconBot />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Polydeskbot.ai</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-gray-300 text-xs">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="font-bold font-[Arial] text-[#FFC72C]">ASU</span>
        </div>
      </div>

      {/* Messages Area */}
      <div 
         className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
            <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
                <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                    msg.role === 'user' ? 'bg-[#2B0000] text-white' : 'bg-[#FFC72C] text-[#2B0000]'
                }`}
                >
                {msg.role === 'user' ? <IconUser /> : <IconBot />}
                </div>
                
                <div
                data-cursor={msg.role === 'user' ? 'yellow' : 'maroon'}
                className={`relative px-5 py-3 rounded-2xl max-w-[85%] shadow-sm text-sm md:text-base ${
                    msg.role === 'user' 
                    ? 'bg-[#2B0000] text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}
                >
                  {/* Use the new FormattedMessage component */}
                  {msg.isLoading && !msg.text ? (
                      <span className="animate-pulse">Thinking...</span>
                  ) : (
                      <FormattedMessage text={msg.text} role={msg.role} />
                  )}
                </div>
            </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-gray-100 shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about housing..."
            className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#FFC72C]/50 transition-all"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            data-cursor="maroon"
            className="p-4 rounded-full bg-[#FFC72C] text-[#2B0000] font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <IconSend />
          </button>
        </form>
        <div className="text-center mt-2">
             <p className="text-xs text-gray-400">Polydeskbot can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;