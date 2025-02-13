export type UserRole = 'admin' | 'trainer' | 'trainee';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  created_at: string;
}
  const { user } = useAuthStore();
  const [isRecording, setIsRecording] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{ scores: Record<string, number>; comments: string } | null>(null);
  
  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchScenarios();
    // Initialize audio context
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .order('type');

      if (error) throw error;
      setScenarios(data || []);
    } catch (err) {
      setError('Failed to load scenarios');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          const transcription = await transcribeAudio(audioBlob);
          setUserInput(transcription);
          await handleSendMessage(transcription);
        } catch (err) {
          console.error('Transcription error:', err);
          setError('Failed to transcribe audio');
        }
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const playResponse = async (text: string) => {
    if (!audioEnabled || !audioContextRef.current) return;

    try {
      const audioData = await generateSpeech(text);
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);
    } catch (err) {
      console.error('Speech synthesis error:', err);
      setError('Failed to play audio response');
    }
  };

  const handleStartCall = async () => {
    if (!selectedScenario || !selectedEmotion) {
      setError('Please select both a scenario and emotional state');
      return;
    }

    try {
      setIsRecording(true);
      setError('');
      setMessages([]);

      // Start timer
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      setTimer(interval);

      // Create call session
      const { error: sessionError } = await supabase
        .from('call_sessions')
        .insert({
          trainee_id: user?.id,
          scenario_type: selectedScenario,
          emotional_state: selectedEmotion,
        });

      if (sessionError) throw sessionError;

      // Generate initial response
      const currentScenario = scenarios.find(s => s.type === selectedScenario);
      if (currentScenario) {
        setIsProcessing(true);
        const initialResponse = await generateResponse(
          currentScenario.description,
          selectedEmotion,
          "Hello, how can I help you today?",
          []
        );
        const newMessage = {
          role: 'assistant' as const,
          content: initialResponse,
          timestamp: new Date()
        };
        setMessages([newMessage]);
        if (audioEnabled) {
          await playResponse(initialResponse);
        }
        setIsProcessing(false);
      }

    } catch (err) {
      setError('Failed to start call session');
      console.error('Error:', err);
      handleEndCall();
    }
  };

  const handleEndCall = async () => {
    try {
      setIsRecording(false);
      stopRecording();
      setIsProcessing(true);
      
      // Generate automatic feedback if there are messages
      if (messages.length > 0) {
        const currentScenario = scenarios.find(s => s.type === selectedScenario);
        if (currentScenario) {
          const feedbackResult = await generateFeedback(
            messages,
            currentScenario.description,
            selectedEmotion
          );

          setFeedbackData(feedbackResult);
          setShowFeedback(true);

          // Save feedback
          const { error: feedbackError } = await supabase
            .from('call_feedback')
            .insert({
              call_session_id: user?.id,
              scores: feedbackResult.scores,
              comments: feedbackResult.comments,
              is_automated: true
            });

          if (feedbackError) {
            console.error('Error saving automated feedback:', feedbackError);
          }
        }
      }
      
      // Stop timer
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }

      // Update call session with duration
      const { error: updateError } = await supabase
        .from('call_sessions')
        .update({ duration: callDuration })
        .eq('trainee_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) throw updateError;

      // Reset state
      setIsProcessing(false);
      setShowFeedback(false);
      setFeedbackData(null);

    } catch (err) {
      setError('Failed to end call session');
      console.error('Error:', err);
      setIsProcessing(false);
    }
  };

  const handleCloseFeedback = () => {
    setFeedbackData(null);
    setCallDuration(0);
    setSelectedScenario('');
    setSelectedEmotion('');
    setMessages([]);
    setUserInput('');
  };

  const handleSendMessage = async (text?: string) => {
    const messageToSend = text || userInput;
    if (!messageToSend.trim() || !isRecording || isProcessing) return;

    try {
      const newUserMessage = {
        role: 'user' as const,
        content: messageToSend.trim(),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newUserMessage]);
      setUserInput('');
      setIsProcessing(true);

      const currentScenario = scenarios.find(s => s.type === selectedScenario);
      if (currentScenario) {
        // Convert messages to format expected by OpenAI
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const response = await generateResponse(
          currentScenario.description,
          selectedEmotion,
          messageToSend,
          conversationHistory
        );

        const newAssistantMessage = {
          role: 'assistant' as const,
          content: response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newAssistantMessage]);

        if (audioEnabled) {
          await playResponse(response);
        }
      }
    } catch (err) {
      setError('Failed to generate response');
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentScenario = scenarios.find(s => s.type === selectedScenario);

  return (
    <div className="container mx-auto px-4">
      <div className="bg-white shadow rounded-lg p-6">
        {/* Quick Tips - Show during active calls */}
        {isRecording && !feedbackData && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Quick Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Stay calm and professional</li>
              <li>• Listen actively and empathize</li>
              <li>• Ask clarifying questions</li>
              <li>• Provide clear and concise information</li>
            </ul>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Call Simulator</h2>
            <p className="mt-1 text-sm text-gray-500">Practice handling different scenarios</p>
          </div>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            {audioEnabled ? (
              <Volume2 className="w-5 h-5 text-gray-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scenario Type
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              disabled={isRecording || loading}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="">Select a scenario</option>
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.type}>
                  {scenario.type} ({scenario.difficulty})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emotional State
            </label>
            <select
              value={selectedEmotion}
              onChange={(e) => setSelectedEmotion(e.target.value)}
              disabled={isRecording || !selectedScenario}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="">Select emotional state</option>
              {currentScenario?.emotional_states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentScenario && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Scenario Description</h3>
            <p className="text-sm text-gray-600">{currentScenario.description}</p>
          </div>
        )}

        {/* Chat Interface */}
        {isRecording && (
          <div className="mb-6 border rounded-lg h-96 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-indigo-100 text-indigo-900 shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start">
                      {message.role === 'assistant' && (
                        <Phone className="h-4 w-4 mt-1 mr-2 text-gray-400" />
                      )}
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  aria-label="Message input"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  disabled={isProcessing || isListening}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
                <button
                  onClick={() => isListening ? stopRecording() : startRecording()}
                  disabled={isProcessing}
                  aria-label={isListening ? "Stop recording" : "Start recording"}
                  className={`px-4 py-2 rounded-md hover:bg-gray-100 ${
                    isListening ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!userInput.trim() || isProcessing || isListening}
                  aria-label="Send message"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center space-y-6 py-12">
          <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center relative">
            <Phone className="w-16 h-16 text-indigo-600" />
            {isRecording && !isProcessing && (
              <div className="absolute -top-2 -right-2 w-4 h-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </div>
            )}
            {isProcessing && (
              <div className="absolute -top-2 -right-2 w-4 h-4">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
              </div>
            )}
          </div>

          {isRecording && (
            <div className="text-2xl font-mono">{formatDuration(callDuration)}</div>
          )}

          {!isRecording ? (
            <button
              onClick={handleStartCall}
              disabled={!selectedScenario || !selectedEmotion}
              className={`px-6 py-3 rounded-full text-white font-medium flex items-center space-x-2 ${
                selectedScenario && selectedEmotion
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <Mic className="w-5 h-5" />
              <span>Start Call</span>
            </button>
          ) : (
            <button
              onClick={handleEndCall}
              className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium flex items-center space-x-2"
            >
              <MicOff className="w-5 h-5" />
              <span>End Call</span>
            </button>
          )}
        </div>

        {isRecording && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="animate-pulse flex space-x-4 items-center justify-center">
              <div className="h-3 w-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Call in progress...</span>
            </div>
          </div>
        )}
      </div>
      
      {feedbackData && (
        <ImmediateFeedback
          scores={feedbackData.scores}
          comments={feedbackData.comments}
          onClose={handleCloseFeedback}
        />
      )}
    </div>
  );
};

export default CallSimulator;