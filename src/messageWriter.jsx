import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function MessageWriter() {
  const [sender, setSender] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');

const handleSubmit = async () => {
  console.log('handleSubmit 함수 실행됨');

  if (!sender.trim() || !content.trim()) {
    setStatus('이메일과 내용을 모두 입력하세요');
    return;
  }

  // 로그인한 사용자 (보낸 사람)
  const { data: authUser, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser?.user) {
    setStatus('로그인 정보를 불러올 수 없습니다.');
    return;
  }

  // 이메일로 수신자 UUID 조회
  const { data: receiver, error: lookupError } = await supabase
    .from('email') // 또는 'profiles' 테이블
    .select('id')
    .eq('email', sender)
    .single();

  if (lookupError || !receiver) {
    setStatus('존재하지 않는 이메일입니다.');
    return;
  }

  // 쪽지 삽입
  const { error } = await supabase.from('messages').insert([
    {
      sender: authUser.user.email,
      content,
      receiver_id: receiver.id, // 핵심
      title: '제목 없음',
    },
  ]);

  if (error) {
    console.error('Supabase 응답:', error);
    setStatus('쪽지 전송 실패: ' + error.message);
  } else {
    setStatus('쪽지를 보냈습니다!');
    setSender('');
    setContent('');
  }
};
  return (
    <div style={{ background: '#111', padding: '20px', borderRadius: '8px', width: '300px', color: '#fff' }}>
      <h4>쪽지 보내기</h4>
      <input
        type="text"
        placeholder="이메일 "
        value={sender}
        onChange={(e) => setSender(e.target.value)}
        style={{ width: '100%', marginBottom: '10px', padding: '6px' }}
      />
      <textarea
        placeholder="내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width: '100%', height: '100px', marginBottom: '10px', padding: '6px' }}
      />
      <button onClick={handleSubmit} style={{ marginRight: '10px' }}>보내기</button>
      <span>{status}</span>
    </div>
  );
}
