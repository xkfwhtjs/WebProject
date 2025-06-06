
import React from 'react';

export default function PostPopup({ post, onClose, onEdit, onDelete }) {
  if (!post) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#333',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      zIndex: 10000,
      width: '350px',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)'
    }}>
      {/* 제목 */}
      <h3>{post.title}</h3>

      {/* 작성자 정보 */}
      {post.email && (
        <div style={{ fontSize: '0.85em', marginBottom: '5px', color: '#aaa' }}>
          작성자: {post.email === '나' ? '나' : post.email}
        </div>
      )}

      {/* 본문 */}
      <div
        style={{ whiteSpace: 'pre-wrap', margin: '10px 0' }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* 이미지 */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="첨부 이미지"
          style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      {/* 작성일 */}
      <div style={{ fontSize: '0.8em', textAlign: 'right', marginTop: '10px' }}>
        작성일: {post.created ? new Date(post.created).toLocaleString() : ''}
      </div>

      {/* 버튼 영역 */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '20px'
      }}>
        {post.isMine && (
          <>
            <button onClick={() => onEdit(post)}>수정</button>
            <button onClick={() => onDelete(post.id)} style={{ color: 'red' }}>삭제</button>
          </>
        )}
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
