import React, { useEffect, useRef, useState } from 'react';
import { ai, createPcmBlob, decodeAudioData } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Volume2, Waveform } from 'lucide-react';

const VoiceAssistant: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null); // Keeping session type loose for now to avoid complexity in types
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Function to stop everything
  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsConnected(false);
    setIsSpeaking(false);
  };

  const startSession = async () => {
    try {
      // 1. Setup Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      
      // 2. Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 3. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: "You are a helpful AI assistant for the 'Hospital Affairs' department. You help the secretary track department performance, visits, and meeting minutes. Answer briefly and professionally in Arabic."
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            
            // Setup Input Processing
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
                setIsSpeaking(true);
                // Ensure audio context is running (browser policy)
                if (outputCtx.state === 'suspended') {
                    await outputCtx.resume();
                }

                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                
                const audioBuffer = await decodeAudioData(audioData, outputCtx);
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                
                source.onended = () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) setIsSpeaking(false);
                };
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }
          },
          onclose: () => {
             setIsConnected(false);
             setIsSpeaking(false);
          },
          onerror: (err) => {
              console.error("Live API Error", err);
              stopSession();
          }
        }
      });
      
      // Store the session for cleanup
      // Note: we can't easily await the session promise here and store the result synchronously
      // but the cleanup logic handles closing via references if needed, mainly relying on stopSession cleaning up the stream/context which kills the connection indirectly or explicit close if we stored it.
      // For this implementation, we rely on the `onclose` callback and explicit cleanup of AudioContexts.
      sessionRef.current = await sessionPromise;

    } catch (e) {
      console.error("Failed to start session", e);
      alert("Could not start voice session. Check permissions.");
      setIsConnected(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className={`flex items-center gap-4 bg-white p-3 rounded-full shadow-2xl border transition-all duration-300 ${isConnected ? 'border-red-200 pr-6' : 'border-indigo-100'}`}>
        
        {isConnected && (
            <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-500 mb-1">المساعد الصوتي</span>
                <div className="flex items-center gap-1">
                    {isSpeaking ? (
                        <span className="flex gap-0.5 h-3 items-end">
                            <span className="w-1 bg-indigo-500 animate-[bounce_1s_infinite] h-2"></span>
                            <span className="w-1 bg-indigo-500 animate-[bounce_1.2s_infinite] h-3"></span>
                            <span className="w-1 bg-indigo-500 animate-[bounce_0.8s_infinite] h-1.5"></span>
                        </span>
                    ) : (
                        <span className="text-xs text-green-600 font-medium">متصل...</span>
                    )}
                </div>
            </div>
        )}

        <button
          onClick={isConnected ? stopSession : startSession}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            isConnected 
              ? 'bg-red-50 text-red-600 hover:bg-red-100 rotate-0' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'
          }`}
        >
          {isConnected ? (
             <MicOff className="w-6 h-6" />
          ) : (
             <Mic className="w-6 h-6" />
          )}
          
          {/* Pulse effect when active */}
          {isConnected && (
            <span className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-ping"></span>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceAssistant;
