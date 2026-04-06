import React, { useEffect, useState, createContext } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

export const ChatContext = createContext();

const AIChat = () => {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // Load messages from the Supabase database or any source
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*');
            setMessages(data);
        };

        fetchMessages();
    }, []);

    const sendMessage = async (message) => {
        // Supabase function invocation
        const { data, error } = await supabase.functions.invoke('ai-chat', { body: { message } });
        if (data) {
            setMessages([...messages, data]);
        } else if (error) {
            console.error('Error:', error);
        }
    };

    return (
        <ChatContext.Provider value={{ sendMessage }}>
            <motion.div
                className="chat-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="message-history">
                    {messages.map((msg, index) => (
                        <motion.div key={index} layout className="message">
                            {msg.content}
                        </motion.div>
                    ))}
                </div>
                <div className="floating-button" onClick={() => sendMessage('Hello AI!')}>+
                </div>
            </motion.div>
        </ChatContext.Provider>
    );
};

export default AIChat;