import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function PostCreator({ userId, onClose, onPostCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    if (!title || !content) {
      setStatus('제목과 내용을 입력해주세요.');
      return;
    }

    let imageUrl = '';
    if (file) {
      const safeFileName = file.name
        .replace(/\s+/g, '_')
        .replace(/[^\w.-]/g, '')
        .toLowerCase();
      const fullPath = `public/${Date.now()}_${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fullPath, file);

      if (uploadError) {
        setStatus('이미지 업로드 실패: ' + uploadError.message);
        return;
      }

      imageUrl = supabase.storage
        .from('post-images')
        .getPublicUrl(fullPath).data.publicUrl;
    }

    const { error } = await supabase.from('post').insert([{
      user_id: userId,
      title,
      content,            // 이미지 태그 없음
      image_url: imageUrl, // 따로 저장
      created: new Date().toISOString(),
    }]);

    if (error) {
      alert('작성 실패: ' + error.message);
    } else {
      alert('게시글이 작성되었습니다!');
      onPostCreated();
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#222', color: 'white', padding: '20px',
      borderRadius: '10px', zIndex: 9999, width: '320px'
    }}>
      <h3 style={{ marginBottom: '10px' }}>게시글 작성</h3>
      <input
        type="text"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
      />
      <textarea
        placeholder="내용"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
        style={{ marginBottom: '10px' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handleSubmit}>작성 완료</button>
        <button onClick={onClose}>취소</button>
      </div>
      {status && <div style={{ marginTop: '10px', fontSize: '0.9em' }}>{status}</div>}
    </div>
  );
}
