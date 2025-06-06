import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function FriendAdder({ onFriendAdded }) {
  const [friendEmail, setFriendEmail] = useState('');
  const [status, setStatus] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const handleAdd = async () => {
    setStatus('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !friendEmail) {
      setStatus('로그인 정보가 없거나 이메일이 비어 있음');
      return;
    }

    const { data: result, error: searchError } = await supabase
      .from('email')
      .select('id')
      .eq('email', friendEmail)
      .single();

    if (searchError || !result) {
      setStatus('해당 이메일을 가진 사용자를 찾을 수 없습니다.');
      return;
    }

    const friendId = result.id;

    const { error: insertError } = await supabase.from('friends').insert([
      {
        user_id: user.id,
        friend_id: friendId,
      },
    ]);

    if (insertError) {
      setStatus('친구 추가 실패: ' + insertError.message);
    } else {
      setStatus('친구 추가 성공!');
      setFriendEmail('');
      if (onFriendAdded) await onFriendAdded(); // ✅ 핵심 추가
    }
  };

  return (
    <>
      <button onClick={() => setShowPopup(true)} style={{ display: 'none' }} id="friend-popup-trigger" />

      {showPopup && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#111',
            color: '#fff',
            padding: '20px',
            borderRadius: '10px',
            zIndex: 2000,
          }}
        >
          <h4 style={{ marginBottom: '10px' }}>친구 추가 (이메일)</h4>
          <input
            type="email"
            placeholder="친구 이메일 입력"
            value={friendEmail}
            onChange={(e) => setFriendEmail(e.target.value)}
            style={{ marginBottom: '10px', width: '100%' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleAdd}>추가</button>
            <button onClick={() => setShowPopup(false)}>닫기</button>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.9em' }}>{status}</div>
        </div>
      )}
    </>
  );
}
