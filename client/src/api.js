// Support both Google Apps Script and traditional Express backend
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('cr_token');
}

async function request(url, options = {}) {
  const token = getToken();
  
  // For Google Apps Script backend, use POST for all requests
  const isGasBackend = API_BASE.includes('script.google.com');
  const method = options.method || (isGasBackend ? 'POST' : 'GET');
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  };
  
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  
  try {
    const response = await fetch(`${API_BASE}${url}`, config);
    const data = await response.json();
    
    if (!response.ok && data.status !== 'success') {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth
export const adminLogin = async () => {
  try {
    if (API_BASE.includes('script.google.com')) {
      // Google Apps Script backend - no password needed
      const response = await request('', { 
        method: 'POST', 
        body: { action: 'adminLogin' } 
      });
      console.log('Admin login response:', response);
      return response;
    }
    // Express backend
    return request('/auth/admin/login', { method: 'POST', body: {} });
  } catch (error) {
    console.error('adminLogin error:', error);
    throw error;
  }
};

export const mentorLogin = (mentorId) => {
  if (API_BASE.includes('script.google.com')) {
    // Google Apps Script: mentorId is actually mentorName
    return request('', { 
      method: 'POST', 
      body: { action: 'mentorLogin', mentorName: mentorId } 
    });
  }
  // Express backend
  return request('/auth/mentor/login', { method: 'POST', body: { mentorId } });
};

export const verifyToken = (token) => {
  if (API_BASE.includes('script.google.com')) {
    return request('', { 
      method: 'POST', 
      body: { action: 'verify', token } 
    });
  }
  return request('/auth/verify', { 
    headers: { Authorization: `Bearer ${token}` } 
  });
};

export const getMentorsList = () => {
  if (API_BASE.includes('script.google.com')) {
    return request('', { 
      method: 'POST', 
      body: { action: 'mentors', method: 'GET' } 
    });
  }
  return request('/auth/mentors-list');
};

// Teams
export const getTeams = () => {
  if (API_BASE.includes('script.google.com')) {
    return request('?action=teams');
  }
  return request('/teams');
};

export const createTeam = (data) => {
  if (API_BASE.includes('script.google.com')) {
    return request('', { 
      method: 'POST', 
      body: { action: 'teams', method: 'POST', ...data } 
    });
  }
  return request('/teams', { method: 'POST', body: data });
};

export const deleteTeam = (name) => {
  if (API_BASE.includes('script.google.com')) {
    return request('', { 
      method: 'POST', 
      body: { action: 'deleteTeam', name } 
    });
  }
  return request(`/teams/${name}`, { method: 'DELETE' });
};

export const assignMentor = (teamName, mentorName) => {
  if (API_BASE.includes('script.google.com')) {
    return request('', { 
      method: 'POST', 
      body: { action: 'assignMentor', teamName, mentorName } 
    });
  }
  return request(`/teams/${teamName}/assign-mentor`, { method: 'PUT', body: { mentorId: mentorName } });
};

// Shortlisting
export const shortlistTeam = (teamName, isShortlisted) => {
  if (API_BASE.includes('script.google.com')) {
    return request('', { 
      method: 'POST', 
      body: { action: 'shortlistTeam', teamName, isShortlisted } 
    });
  }
  return request(`/teams/${teamName}/shortlist`, { method: 'PUT', body: { isShortlisted } });
};

export const getShortlistedTeams = () => {
  if (API_BASE.includes('script.google.com')) {
    return request('', { 
      method: 'POST', 
      body: { action: 'getShortlisted' } 
    });
  }
  return request('/teams/shortlisted');
};

// Mentors
export const getMentors = () => {
  if (API_BASE.includes('script.google.com')) {
    return request('?action=mentors');
  }
  return request('/mentors');
};

export const createMentor = (data) => {
  if (API_BASE.includes('script.google.com')) {
    return request('', { 
      method: 'POST', 
      body: { action: 'mentors', method: 'POST', name: data.name } 
    });
  }
  return request('/mentors', { method: 'POST', body: data });
};

export const deleteMentor = (name) => {
  if (API_BASE.includes('script.google.com')) {
    return request('', { 
      method: 'POST', 
      body: { action: 'deleteMentor', name } 
    });
  }
  return request(`/mentors/${name}`, { method: 'DELETE' });
};

// Scores
export const submitScore = (data) => {
  if (API_BASE.includes('script.google.com')) {
    return request('', { 
      method: 'POST', 
      body: { action: 'scores', method: 'POST', ...data } 
    });
  }
  return request('/scores', { method: 'POST', body: data });
};

export const deleteScore = (mentorName, teamName, round) => {
  if (API_BASE.includes('script.google.com')) {
    return request('', { 
      method: 'POST', 
      body: { action: 'deleteScore', mentorName, teamName, round } 
    });
  }
  return request(`/scores/${mentorName}`, { method: 'DELETE' });
};

export const getLeaderboard = (round = 'combined') => {
  if (API_BASE.includes('script.google.com')) {
    return request(`?action=leaderboard&round=${round}`);
  }
  return request(`/scores/leaderboard/${round}`);
};

export const getCombinedLeaderboard = () => {
  if (API_BASE.includes('script.google.com')) {
    return request('?action=leaderboard&round=combined');
  }
  return request('/scores/leaderboard-combined/all');
};

export const getScores = () => {
  if (API_BASE.includes('script.google.com')) {
    return request('?action=scores');
  }
  return request('/scores');
};

