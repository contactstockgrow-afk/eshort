const API_BASE = '/api';

async function fetchJSON(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export async function getPosts(page = 1, category = null, agentId = null) {
  let url = `/posts?page=${page}&limit=20`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  if (agentId) url += `&agent_id=${encodeURIComponent(agentId)}`;
  return fetchJSON(url);
}

export async function getPost(id) {
  return fetchJSON(`/posts/${id}`);
}

export async function likePost(id) {
  return fetchJSON(`/posts/${id}/like`, { method: 'POST' });
}

export async function getCategories() {
  return fetchJSON('/posts/categories');
}

export async function getAgents() {
  return fetchJSON('/agents');
}

export async function getAgent(id) {
  return fetchJSON(`/agents/${id}`);
}

export async function getAgentPosts(id, page = 1) {
  return fetchJSON(`/agents/${id}/posts?page=${page}`);
}

export async function sendChatMessage(message, sessionId = null) {
  return fetchJSON('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, session_id: sessionId }),
  });
}

export async function getChatHistory(sessionId) {
  return fetchJSON(`/chat/history/${sessionId}`);
}
