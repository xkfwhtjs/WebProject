import React, { useEffect, useState } from 'react';
import './HomePage.css';
import './App.css';
import { supabase } from './supabaseClient';
import { getFriendIds, getPostsFromFriends, getFriendEmails, deleteFriend } from './friendService';
import FriendAdder from './friendAdder';
import { useNavigate } from 'react-router-dom';
import PostCreator from './PostCreate';
import PostPopup from './PostPopup';
import PostEditor from './PostEditor';
import MessageWriter from './messageWriter';

export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [friendEmails, setFriendEmails] = useState([]);
  const [profileInfo, setProfileInfo] = useState({ avatar_url: '', intro: '' });
  const [popupPost, setPopupPost] = useState(null);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [messages, setMessages] = useState([]);
  const [popupMessage, setPopupMessage] = useState(null);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [messageSender, setMessageSender] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [messageTitle, setMessageTitle] = useState('');
  
  useEffect(() => {
  const fetchMessages = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created', { ascending: false });

    if (!error) setMessages(messages);
  };

  if (user) fetchMessages();
}, [user]);

  // 1. 유저 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) setUser(user);
    };
    fetchUser();
  }, []);

  // 2. 유저가 확인되면 모든 데이터 로딩
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;

      // 프로필 정보
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, intro')
        .eq('id', user.id)
        .single();
      if (profile) setProfileInfo(profile);

      // 내가 쓴 글
      const { data: titles } = await supabase
        .from('post')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created', { ascending: false });
      if (titles) setMyPosts(titles);

      // 친구 목록 및 게시글
      const friendIds = await getFriendIds(user.id);
      const friendPosts = await getPostsFromFriends(friendIds);
      setPosts(friendPosts);

      const emails = await getFriendEmails(user.id);
      setFriendEmails(emails);
    };
    fetchAllData();
  }, [user]);

  const handleDelete = async (postId) => {
  const confirm = window.confirm('정말 삭제하시겠습니까?');
  if (!confirm) return;

  const { error } = await supabase
    .from('post')
    .delete()
    .eq('id', postId);

  if (!error) {
    alert('삭제되었습니다.');
    setPopupPost(null); // 팝업 닫기
    // 내 글 목록 갱신
    const { data: titles } = await supabase
      .from('post')
      .select('id, title')
      .eq('user_id', user.id)
      .order('created', { ascending: false });
    if (titles) setMyPosts(titles);
  } else {
    alert('삭제 실패');
  }
};
const handleDeletePost = async (postId) => {
  const { error } = await supabase.from('post').delete().eq('id', postId);
  if (!error) {
    alert('삭제되었습니다.');
    // 목록 갱신
    const { data: titles } = await supabase
      .from('post')
      .select('id, title')
      .eq('user_id', user.id)
      .order('created', { ascending: false });
    setMyPosts(titles);
    setPopupPost(null);
  }
};

// 수정 처리 → PostCreator를 수정 모드로 재사용할 수 있게 할 예정
const handleEdit = (post) => {
  setPopupPost(null); // 기존 팝업 닫기
  setShowPostCreator({
    mode: 'edit',
    postData: post,
  });
};

const handleSendMessage = async () => {
  if (!messageTitle.trim() || !messageContent.trim()) {
    setMessageStatus('제목과 내용을 입력하세요.');
    return;
  }

  // 1. 입력한 이메일로 Supabase에서 사용자 UUID 조회
  const { data: targetUser, error: targetError } = await supabase
    .from('email') // ← 여기에 email-uuid 매핑 테이블명 입력
    .select('id')   // ← 해당 테이블에서 uuid 컬럼
    .eq('email', messageSender)
    .single();

  if (targetError || !targetUser) {
    setMessageStatus('해당 이메일을 가진 사용자가 없습니다.');
    return;
  }

  // 2. 현재 로그인한 사용자 정보 가져오기
  const { data: sessionData, error: userError } = await supabase.auth.getUser();
  const currentUser = sessionData?.user;
  if (userError || !currentUser) {
    setMessageStatus('유저 인증 실패');
    return;
  }

  // 3. 쪽지 전송
  const { error } = await supabase.from('messages').insert([
    {
      sender: currentUser.email,
      title: messageTitle,
      content: messageContent,
      user_id: targetUser.id  // 받는 사람의 UUID
    },
  ]);

  if (error) {
    setMessageStatus('쪽지 전송 실패: ' + error.message);
  } else {
    setMessageStatus('쪽지를 보냈습니다!');
    setTimeout(() => {
      setShowMessagePopup(false);
      setMessageSender('');
      setMessageTitle('');
      setMessageContent('');
      setMessageStatus('');
    }, 1500);
  }
};

  return (
    <>
      {/* 우측 메뉴 */}
      <div className="right-floating-menu">
        <button onClick={() => navigate('/home')}>홈</button>
        <button onClick={() => document.getElementById('friend-popup-trigger')?.click()}>친구추가</button>
        <button onClick={() => navigate('/profile')}>프로필</button>
      </div>

      {/* 메인 페이지 */}
      <div className="homepage-root">
        <div className="sidebar">
          <div className="profile-img-box">
            <img
              src={profileInfo.avatar_url ? `${profileInfo.avatar_url}?t=${Date.now()}` : ''}
              alt="프로필"
              style={{ width: '250px', height: '250px', objectFit: 'cover', borderRadius: '8px' }}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/250'; }}
            />
          </div>
          <div className="intro-box">
            {profileInfo.intro || '자기소개가 없습니다.'}
          </div>
         <FriendAdder
  onFriendAdded={async () => {
    const friendIds = await getFriendIds(user.id);
    const friendPosts = await getPostsFromFriends(friendIds);
    setPosts(friendPosts); // ✅ 최근 게시글 다시 불러오기

    const emails = await getFriendEmails(user.id);
    setFriendEmails(emails); // 친구 목록도 갱신
  }}
/>
        </div>

        {/* 메인 그리드 */}
        <div className="main-area">
          <div className="main-grid">
            {/* 최근 게시글 */}
            <div className="main-box">
              <div className="main-box-title">최근 게시글</div>
              <div className="main-box-content">
                {posts.length > 0 ? (
                  <ul>
                    {posts.map(post => (
                      <li key={post.id}>
                        <span
                          style={{ textDecoration: 'underline', cursor: 'pointer' }}
                          onClick={() => setPopupPost({ ...post, isMine: false })}
                        >
                          {post.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : <p>게시글이 없습니다.</p>}
              </div>
            </div>

            {/* 내가 쓴 글 */}
            <div className="main-box">
             <div className="main-box-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    내가 쓴 글
    <button
      onClick={() => setShowPostCreator(true)}
      style={{
        fontSize: '0.9em',
        padding: '2px 8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#222',
        color: 'white',
        cursor: 'pointer'
      }}
    >
      게시글 작성하기
    </button>
  </div>
              <div className="main-box-content">
                {myPosts.length > 0 ? (
                  <ul>
                    {myPosts.map(post => (
                      <li key={post.id}>
                        <span
                          style={{ textDecoration: 'underline', cursor: 'pointer' }}
                          onClick={async () => {
                            const { data } = await supabase
                              .from('post')
                              .select('*')
                              .eq('id', post.id)
                              .single();
                            if (data) setPopupPost({ ...data, email: '나', isMine: true });
                          }}
                        >
                          {post.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : <p>작성한 글이 없습니다.</p>}
              </div>
            </div>

          <div className="main-box">
  <div className="main-box-title">친구 목록</div>
  <div className="main-box-content">
    {friendEmails.length > 0 ? (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {friendEmails.map((email, idx) => (
          <li key={idx} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 0',
            borderBottom: '1px solid #444'
          }}>
            <span>{email}</span>
            <button
              onClick={async () => {
                const confirm = window.confirm(`${email}을(를) 친구 목록에서 삭제하시겠습니까?`);
                if (!confirm) return;
                const { error } = await deleteFriend(user.id, email);
                if (!error) {
                  alert('삭제 완료');
                  setFriendEmails(prev => prev.filter(e => e !== email));
                  const updatedFriendIds = await getFriendIds(user.id);
                  const updatedPosts = await getPostsFromFriends(updatedFriendIds);
                  setPosts(updatedPosts);
                } else {
                  alert('삭제 실패: ' + error.message);
                }
              }}
              style={{
                background: 'none',
                color: 'red',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              X
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p>친구가 없습니다.</p>
    )}
  </div>
</div>

            {/* 쪽지 */}
<div className="main-box">
  <div
    className="main-box-title"
    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
  >
    쪽지
    <button
      onClick={() => setShowMessagePopup(true)}
      style={{
        fontSize: '0.9em',
        padding: '2px 8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#222',
        color: 'white',
        cursor: 'pointer'
      }}
    >
      보내기
    </button>
  </div>
  <div className="main-box-content">
    {messages.length > 0 ? (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {messages.map((msg) => (
          <li
            key={msg.id}
            onClick={() => setPopupMessage(msg)}
            style={{
              padding: '4px 0',
              borderBottom: '1px solid #444',
              cursor: 'pointer',
            }}
          >
            <b>{msg.sender || '익명'}</b>: {msg.title || '(제목 없음)'}
          </li>
        ))}
      </ul>
    ) : (
      <p>받은 쪽지가 없습니다.</p>
    )}
  </div>
</div>
          </div>
        </div>
      </div>

      {/* 팝업 영역들 (가장 아래에 위치) */}
      {showPostCreator && user && (
        <PostCreator
          userId={user.id}
          onClose={() => setShowPostCreator(false)}
          onPostCreated={async () => {
            const { data: titles } = await supabase
              .from('post')
              .select('id, title')
              .eq('user_id', user.id)
              .order('created', { ascending: false });
            if (titles) setMyPosts(titles);
          }}
        />
      )}
{popupPost && (
  <PostPopup
    post={popupPost}
    onClose={() => setPopupPost(null)}
    onEdit={(post) => {
      setPopupPost(null);
      setShowPostCreator(true);
      setEditingPost(post); // 수정용 상태 따로 생성
    }}
    onDelete={async (postId) => {
      const { error } = await supabase.from('post').delete().eq('id', postId);
      if (!error) {
        alert('삭제 완료');
        setMyPosts(prev => prev.filter(p => p.id !== postId));
        setPopupPost(null);
      }
    }}
  />
)}
{showPostCreator && user && (
  <PostCreator
    userId={user.id}
    existingPost={editingPost} // 수정 모드로 전달
    onClose={() => {
      setShowPostCreator(false);
      setEditingPost(null);
    }}
    onPostCreated={async () => {
      const { data: titles, error } = await supabase
        .from('post')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created', { ascending: false });
      if (!error && titles) setMyPosts(titles);
    }}
  />
)}
{popupPost && (
  <PostPopup
    post={popupPost}
    onClose={() => setPopupPost(null)}
    onEdit={(post) => {
      setPopupPost(null);
      setEditingPost(post);
    }}
    onDelete={handleDeletePost}
  />
)}

{showMessagePopup && (
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
      zIndex: 3000,
      width: '300px',
    }}
  >
    <h4>쪽지 보내기</h4>

<input
  type="text"
  placeholder="이메일"
  value={messageSender}
  onChange={(e) => setMessageSender(e.target.value)}
  style={{ width: '100%', marginBottom: '10px' }}
/>

<input
  type="text"
  placeholder="제목"
  value={messageTitle}
  onChange={(e) => setMessageTitle(e.target.value)}
  style={{ width: '100%', marginBottom: '10px' }}
/>

<textarea
  placeholder="내용을 입력하세요"
  value={messageContent}
  onChange={(e) => setMessageContent(e.target.value)}
  style={{ width: '100%', height: '100px', marginBottom: '10px' }}
/>

<div style={{ display: 'flex', gap: '10px' }}>
  <button
    onClick={async () => {
  if (!messageTitle.trim() || !messageContent.trim()) {
    setMessageStatus('제목과 내용을 입력하세요.');
    return;
  }

  // 수신자 UUID 조회
  const { data: receiver, error: lookupError } = await supabase
    .from('email')
    .select('id')
    .eq('email', messageSender)
    .single();

  if (lookupError || !receiver) {
    setMessageStatus('존재하지 않는 사용자입니다.');
    return;
  }

  // 로그인 유저 정보
  const { data: session, error: sessionError } = await supabase.auth.getUser();
  const user = session?.user;
  if (sessionError || !user) {
    setMessageStatus('로그인이 필요합니다.');
    return;
  }

  const { error } = await supabase.from('messages').insert([
    {
      sender: user.email,               // ✅ 로그인 유저 이메일
      title: messageTitle,
      content: messageContent,
      receiver_id: receiver.id,         // ✅ uuid 타입
      created: new Date(),              // ✅ 수동 삽입 (권장)
    },
  ]);

  if (error) {
    setMessageStatus('쪽지 전송 실패: ' + error.message);
  } else {
    setMessageStatus('쪽지를 보냈습니다!');
    setTimeout(() => {
      setShowMessagePopup(false);
      setMessageSender('');
      setMessageTitle('');
      setMessageContent('');
      setMessageStatus('');
    }, 1500);
  }
}}
  >
    보내기
  </button>
  <button onClick={() => setShowMessagePopup(false)}>닫기</button>
</div>

<div style={{ marginTop: '10px' }}>{messageStatus}</div>
  </div>
)}

{popupMessage && (
  <div
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#222',
      color: '#fff',
      padding: '20px',
      borderRadius: '12px',
      zIndex: 3000,
      width: '300px',
    }}
  >
    {/* 제목 출력 */}
    <h3 style={{ marginBottom: '10px' }}>{popupMessage.title || '(제목 없음)'}</h3>

    {/* 보낸 사람 */}
    <p style={{ color: '#aaa', marginBottom: '10px' }}>
      From: <b>{popupMessage.sender || '익명'}</b>
    </p>

    {/* 본문 내용 */}
    <div style={{ whiteSpace: 'pre-wrap', marginBottom: '10px' }}>
      {popupMessage.content}
    </div>

    {/* 받은 시각 */}
    <p style={{ fontSize: '0.8em', color: '#888' }}>
      받은 시각: {new Date(popupMessage.created).toLocaleString()}
    </p>

    {/* 닫기 버튼 */}
    <button
      onClick={() => setPopupMessage(null)}
      style={{
        background: '#444',
        color: '#fff',
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        marginTop: '10px',
      }}
    >
      닫기
    </button>
  </div>
)}

{editingPost && (
  <PostEditor
    post={editingPost}
    onClose={() => setEditingPost(null)}
    onUpdate={async () => {
      const { data: titles } = await supabase
        .from('post')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created', { ascending: false });
      setMyPosts(titles);
    }}
  />
)}
    </>
  );
}
