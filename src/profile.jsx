import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [intro, setIntro] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [profileId, setProfileId] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate('/login');
        return;
      }

      setProfileId(user.id);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        await supabase.from('profiles').insert([{ id: user.id, intro: '' }]);
        setIntro('');
        setProfileImage('');
        return;
      }

      setIntro(profileData.intro || '');
      setProfileImage(profileData.avatar_url || '');
    };

    fetchProfile();
  }, [navigate]);

  const uploadProfileImage = async (file) => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) return alert("유저 정보 없음");

    const uniqueFileName = `profile_${user.id}.png`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(`profileImages/${uniqueFileName}`, file, { upsert: true });

    if (uploadError) {
      alert('업로드 실패: ' + uploadError.message);
      return;
    }

    const { data } = await supabase.storage
      .from('avatars')
      .getPublicUrl(`profileImages/${uniqueFileName}`);

    const url = data?.publicUrl;

    if (url) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id);

      if (updateError) {
        console.error('DB update 실패:', updateError.message);
      } else {
        setProfileImage(url + '?' + Date.now());
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadProfileImage(file);
    }
  };

  const handleSave = async () => {
    if (!profileId) {
      alert("유저 정보가 없습니다.");
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ intro })
      .eq('id', profileId);

    if (!error) alert('자기소개 저장 완료!');
    else alert('저장 실패: ' + error.message);
  };

  return (
  <>
    <div className="profile-page">
      <div className="right-floating-menu">
        <button onClick={() => navigate('/home')}>홈</button>
        <button onClick={() => document.getElementById('friend-popup-trigger')?.click()}>친구추가</button>
        <button onClick={() => navigate('/profile')}>프로필</button>
      </div>
      
      <div className="container mt-4">
        <h2>프로필</h2>
        <div className="mb-3">
          <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', background: '#eee', marginBottom: 8 }}>
            <img
              src={profileImage || '/default-profile.png'}
              alt="프로필 이미지"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.currentTarget.src = '/default-profile.png'; }}
            />
          </div>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current.click()}
          >
            이미지 변경
          </button>
        </div>

        <div className="mb-3">
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="자기소개를 입력하세요"
            className="form-control"
            rows={5}
          />
        </div>
        <button onClick={handleSave} className="btn btn-primary">저장</button>
      </div>
    </div>
  </>
);
}