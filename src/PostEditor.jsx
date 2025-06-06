import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function PostEditor({ post, onClose, onUpdate }) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleUpdate = async () => {
    if (!title || !content) {
      setStatus('제목과 내용을 모두 입력해주세요.');
      return;
    }

    let imageUrl = post.image_url || '';

    // 새 파일이 있으면 업로드
    if (file) {
      const safeFileName = file.name
        .replace(/\s+/g, '_')
        .replace(/[^\w.-]/g, '')
        .toLowerCase();

      const fullPath = `public/${Date.now()}_${safeFileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('post-images')
        .upload(fullPath, file, { upsert: true });

      if (uploadError) {
        setStatus('이미지 업로드 실패: ' + uploadError.message);
        return;
      }

      imageUrl = supabase.storage
        .from('post-images')
        .getPublicUrl(fullPath).data.publicUrl;
    }

    const { error } = await supabase
      .from('post')
      .update({ title, content, image_url: imageUrl })
      .eq('id', post.id);

    if (error) {
      alert('수정 실패: ' + error.message);
    } else {
      alert('게시글이 수정되었습니다.');
      onUpdate(); // 목록 새로고침
      onClose();  // 팝업 닫기
    }
  };

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#222', color: 'white', padding: '20px',
      borderRadius: '10px', zIndex: 9999, width: '340px'
    }}>
      <h3>게시글 수정</h3>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
      />
      <textarea
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
      {status && <div style={{ color: 'tomato', marginBottom: '10px' }}>{status}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handleUpdate}>수정 완료</button>
        <button onClick={onClose}>취소</button>
      </div>
    </div>
  );
}
