import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function MessageList() {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        setUser(user);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user.id) //  받은 쪽지 필터링
        .order('created', { ascending: false });

      if (!error && data) setMessages(data);
    };
    fetchMessages();
  }, [user]);

  return (
    <div>
      <h4>받은 쪽지</h4>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {messages.map(msg => (
          <li
            key={msg.id}
            onClick={() => setSelectedMessage(msg)}
            style={{ cursor: 'pointer', borderBottom: '1px solid #444', padding: '6px 0' }}
          >
            <b>{msg.title || '(제목 없음)'}</b>
          </li>
        ))}
      </ul>

      {selectedMessage && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#111',
            color: '#fff',
            padding: '20px',
            borderRadius: '10px',
            width: '300px',
            zIndex: 2000,
          }}
        >
          <h4>{selectedMessage.title || '제목 없음'}</h4>
          <p><b>보낸 사람:</b> {selectedMessage.sender || '익명'}</p>
          <p><b>내용:</b><br />{selectedMessage.content}</p>
          <p style={{ fontSize: '0.8em', color: '#aaa' }}>
            받은 시각: {new Date(selectedMessage.created).toLocaleString()}
          </p>
          <button onClick={() => setSelectedMessage(null)}>닫기</button>
        </div>
      )}
    </div>
  );
}
