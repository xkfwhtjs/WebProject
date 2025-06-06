
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function MyPosts() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchUserAndPosts = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('유저 정보 불러오기 실패:', error?.message);
        return;
      }

      setUser(user);

      const { data, error: postError } = await supabase
        .from('post')
        .select('id, title, content, created')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (postError) {
        console.error('게시글 불러오기 실패:', postError.message);
      } else {
        setPosts(data);
      }
    };

    fetchUserAndPosts();
  }, []);

  return (
    <div>
      <h4>내가 쓴 글</h4>
      {posts.length === 0 ? (
        <p>작성한 글이 없습니다.</p>
      ) : (
        <ul>
          {posts.map(post => (
            <li key={post.id}>
              <button onClick={() => setSelected(post)}>{post.title}</button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#222', color: '#fff',
          padding: '20px', zIndex: 9999, borderRadius: '10px',
          maxWidth: '90%', maxHeight: '90%', overflowY: 'auto'
        }}>
          <h4>{selected.title}</h4>
          <div
            style={{ whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: selected.content }}
          />
          <p style={{ fontSize: '0.8em', textAlign: 'right' }}>
            작성일: {selected.created_at ? new Date(selected.created_at).toLocaleString() : '없음'}
          </p>
          <button onClick={() => setSelected(null)}>닫기</button>
        </div>
      )}
    </div>
  );
}
