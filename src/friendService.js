import { supabase } from './supabaseClient';

//  친구 ID 목록 가져오기 (유지)
export async function getFriendIds(userId) {
  const { data, error } = await supabase
    .from('friends')
    .select('friend_id')
    .eq('user_id', userId);
    

  if (error) {
    console.error('친구 목록 불러오기 오류:', error);
    return [];
  }

  return data ? data.map(f => f.friend_id) : [];
}

// 친구 게시글 가져오기 (유지)
export async function getPostsFromFriends(friendIds) {
  if (friendIds.length === 0) return [];

  // 친구들의 게시글 가져오기
  const { data: posts, error: postError } = await supabase
    .from('post')
    .select('*')
    .in('user_id', friendIds)
    .order('created', { ascending: false });

  if (postError) {
    console.error('친구 게시글 불러오기 오류:', postError);
    return [];
  }

 
  // 작성자 이메일 가져오기
  const { data: emailData, error: emailError } = await supabase
    .from('email')
    .select('id, email')
    .in('id', friendIds);

  if (emailError) {
    console.error('이메일 조회 오류:', emailError);
    return posts.map(post => ({ ...post, email: '알 수 없음', isMine: false }));
  }

  // 이메일 매핑
  const emailMap = Object.fromEntries(emailData.map(e => [e.id, e.email]));

  return posts.map(post => ({
    ...post,
    email: emailMap[post.user_id] || '알 수 없음',
    isMine: false,
  }));
}

// ✅ 친구 추가 (유지)
export async function addFriend(userId, friendId) {
  const { error } = await supabase
    .from('friends')
    .insert([{ user_id: userId, friend_id: friendId }]);

  if (error) {
    console.error('친구 추가 오류:', error);
    return false;
  }

  return true;
}

//추가: 친구 이메일 리스트 가져오기
export async function getFriendEmails(userId) {
  const friendIds = await getFriendIds(userId);

  if (friendIds.length === 0) return [];

  const { data, error } = await supabase
    .from('email')
    .select('email')
    .in('id', friendIds);

  if (error) {
    console.error('친구 이메일 가져오기 오류:', error);
    return [];
  }

  return data.map(d => d.email);
}

export async function deleteFriend(userId, friendEmail) {
  // friendEmail에 해당하는 ID 조회
  const { data: friendUser, error: findError } = await supabase
    .from('email')
    .select('id')
    .eq('email', friendEmail)
    .single();

  if (findError || !friendUser) {
    return { error: findError || new Error('해당 이메일 사용자를 찾을 수 없습니다.') };
  }

  // friends 테이블에서 삭제
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('user_id', userId)
    .eq('friend_id', friendUser.id);

  return { error };
}
