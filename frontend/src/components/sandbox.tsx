'use client';

import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, List, ListItem, ListItemText, Paper } from '@mui/material';

type Message = {
    text: string;
    sender: 'user' | 'bot';
};

export default function Sandbox() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');

    // aws amplify <- use this?


    const socket = new WebSocket("")


    socket.onopen = (event: Event) => {
        console.log("WebSocket connection established!");
        // You can send a message to the server immediately after connection
        socket.send("Hello from the client!");
    };

    const handleSendMessage = async (): Promise<void> => {
        const text = newMessage.trim();
        if (!text) return;
        setMessages(prev => [...prev, { text, sender: 'user' }]);
        setNewMessage('');
        const res = await fetch("/api/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: text })
        });

        const reply = await res.text();              // <-- NOT res.json()
        setMessages(prev => [...prev, { text: reply, sender: 'bot' }]);


    };

    return (
        <div>
            <Box sx={{ flexGrow: 1, p: 2 }}>
                <Paper elevation={3} sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
                    <List sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                        {messages.map((message, index) => (
                            <ListItem
                                key={index}
                                sx={{ justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start' }}
                            >
                                <Paper
                                    sx={{
                                        p: 1,
                                        bgcolor: message.sender === 'user' ? 'primary.light' : 'grey.300',
                                        color: message.sender === 'user' ? 'white' : 'black',
                                    }}
                                >
                                    <ListItemText primary={message.text} />
                                </Paper>
                            </ListItem>
                        ))}
                    </List>

                    <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', display: 'flex' }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            sx={{ mr: 1 }}
                        />
                        <Button variant="contained" onClick={handleSendMessage}>
                            Send
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </div>
    );
}