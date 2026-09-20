
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export const AIAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your GeoLabs Pro assistant. I can help you with mapping, environmental analysis, mining data, reports, and time series analysis. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Rule-based responses for geospatial workflow
  const generateResponse = async (userInput: string): Promise<string> => {
    const input = userInput.toLowerCase();
    
    // Map-related queries
    if (input.includes('map') || input.includes('location') || input.includes('coordinates')) {
      return 'I can help you with mapping! You can:\n• Search for locations using the search bar\n• Upload shapefiles and GeoJSON data\n• Draw shapes and polygons on the map\n• Switch between different map layers\n• Export your map data as PNG, PDF, or GeoJSON\n\nTry searching for a location or uploading your geospatial data!';
    }
    
    // Environmental analysis
    if (input.includes('environment') || input.includes('air quality') || input.includes('water') || input.includes('vegetation')) {
      return 'Our Environmental Dashboard offers:\n• Air quality monitoring and alerts\n• Water quality analysis\n• Vegetation health assessment\n• Predictive environmental analytics\n• Real-time monitoring point management\n\nNavigate to the Environmental tab to start analyzing environmental data for your area of interest.';
    }
    
    // Mining operations
    if (input.includes('mining') || input.includes('geological') || input.includes('equipment') || input.includes('safety')) {
      return 'GeoLabs Pro supports comprehensive mining operations:\n• Geological analysis and mineral identification\n• Equipment tracking and fleet management\n• Safety monitoring and compliance\n• Environmental impact assessment\n• Mining operation optimization\n\nCheck out the Mining Dashboard for detailed analytics and monitoring tools.';
    }
    
    // Time series and spectral analysis
    if (input.includes('time series') || input.includes('spectral') || input.includes('change detection') || input.includes('historical')) {
      return 'Our Time Series Analysis provides:\n• Historical trend analysis using Landsat and Sentinel data\n• Spectral analysis for mineral identification\n• Change detection over time\n• Custom data upload and processing\n• Multi-temporal comparison tools\n\nUse the Time Series tab to analyze how your area has changed over time.';
    }
    
    // Reports and analytics
    if (input.includes('report') || input.includes('analytics') || input.includes('export') || input.includes('business intelligence')) {
      return 'Generate comprehensive reports with:\n• Executive summaries and business intelligence\n• Trend analysis and forecasting\n• Custom report generation\n• Data export in multiple formats (PDF, CSV, GeoJSON)\n• Professional map exports\n\nVisit the Reports section to create detailed analytical reports.';
    }
    
    // Data upload and formats
    if (input.includes('upload') || input.includes('data') || input.includes('file') || input.includes('format')) {
      return 'GeoLabs Pro supports various data formats:\n• Shapefiles (.shp, .dbf, .shx)\n• GeoJSON files\n• CSV with coordinates\n• KML/KMZ files\n• Satellite imagery\n\nUse the Upload button in the header to import your geospatial data and start analyzing!';
    }
    
    // Features and capabilities
    if (input.includes('feature') || input.includes('capability') || input.includes('what can') || input.includes('help')) {
      return 'GeoLabs Pro is your complete geospatial analysis platform:\n\n🗺️ **Interactive Mapping**: Search, draw, and analyze geographic data\n🌱 **Environmental Monitoring**: Track air/water quality and vegetation health\n⛏️ **Mining Operations**: Geological analysis and equipment tracking\n📊 **Time Series Analysis**: Historical trends and change detection\n📋 **Professional Reports**: Generate comprehensive analytical reports\n\nWhat specific area would you like to explore?';
    }
    
    // Getting started
    if (input.includes('start') || input.includes('begin') || input.includes('how to') || input.includes('tutorial')) {
      return 'Getting started with GeoLabs Pro:\n\n1. **Search for your area**: Use the search bar to find your location of interest\n2. **Upload data**: Click the Upload button to import your geospatial files\n3. **Choose your analysis**: Navigate between Map, Environmental, Mining, Time Series, or Reports tabs\n4. **Draw and analyze**: Use map tools to create shapes and analyze specific areas\n5. **Export results**: Generate reports and export your findings\n\nStart by searching for a location or exploring the different dashboard tabs!';
    }
    
    // Default response
    return 'I\'m here to help you navigate GeoLabs Pro! I can assist with:\n• Mapping and location services\n• Environmental analysis\n• Mining operations\n• Time series and spectral analysis\n• Report generation\n• Data upload and formats\n\nPlease ask me about any specific feature or tell me what you\'d like to accomplish!';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const response = await generateResponse(inputValue);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-110"
        size="lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Interface */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-96 h-[500px] shadow-2xl backdrop-blur-xl bg-white/95 border border-white/30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <h3 className="font-semibold">GeoLabs Assistant</h3>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 h-[360px]">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.type === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-white/50">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about GeoLabs features..."
                className="flex-1 border-gray-200 focus:border-blue-500"
                disabled={isProcessing}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
