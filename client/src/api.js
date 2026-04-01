// Support both Google Apps Script and traditional Express backend
const API_BASE = import.meta.env.VITE_API_URL || '/api';

console.log('API_BASE loaded:', API_BASE);

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
    ...options,
  };
  
  // For GAS backend, use FormData to avoid CORS preflight
  if (isGasBackend) {
    const formData = new FormData();
    
    if (config.body) {
      const bodyObj = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
      Object.keys(bodyObj).forEach(key => {
        formData.append(key, bodyObj[key]);
      });
    }
    
    if (token) {
      formData.append('token', token);
    }
    
    config.body = formData;
    // Don't set Content-Type header - let browser set it automatically for FormData
    // This prevents CORS preflight requests
    delete config.headers;
  } else {
    // Traditional backend uses JSON
    config.headers = {
      'Content-Type': 'application/json',
    };
    
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }
  }
  
  console.log('API Request:', { url: `${API_BASE}${url}`, method, isGasBackend });
  console.log('Request body type:', typeof config.body);
  if (config.body && config.body instanceof FormData) {
    console.log('FormData entries:');
    for (let pair of config.body.entries()) {
      console.log(`  ${pair[0]}: ${pair[1]}`);
    }
  }
  
  try {
    const response = await fetch(`${API_BASE}${url}`, config);
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', {
      'content-type': response.headers.get('content-type'),
    });
    
    const text = await response.text();
    console.log('API Response Text:', text.substring(0, 500));
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse response as JSON:', text);
      throw new Error('Invalid response from server: ' + text.substring(0, 100));
    }
    
    console.log('API Response Data:', data);
    
    // Check for error status in the response data
    if (data && data.status === 'error') {
      throw new Error(data.message || 'Server returned an error');
    }
    
    // Also check for HTTP errors
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.message || 'Server error'}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error Details:', error.message);
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
    method: 'POST',
    body: { token }
  });
};

export const getMentorsList = () => {
  if (API_BASE.includes('script.google.com')) {
    return request('', { 
      method: 'POST', 
      body: { action: 'mentorsList' } 
    }).then(res => {
      // Ensure we return data in consistent format
      return res.data || res || [];
    });
  }
  return request('/auth/mentors-list');
};

// Teams
export const getTeams = async () => {
  if (API_BASE.includes('script.google.com')) {
    const res = await request('', {
      method: 'POST',
      body: { action: 'teams' }
    });
    return res.data || [];
  }
  const res = await request('/teams');
  return res.data || [];
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
export const getMentors = async () => {
  if (API_BASE.includes('script.google.com')) {
    const res = await request('', {
      method: 'POST',
      body: { action: 'mentors' }
    });
    return res.data || [];
  }
  const res = await request('/mentors');
  return res.data || [];
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
    return request('', { 
      method: 'POST',
      body: { action: 'leaderboard', round: round }
    });
  }
  return request(`/scores/leaderboard/${round}`);
};

export const getCombinedLeaderboard = async () => {
  if (API_BASE.includes('script.google.com')) {
    const res = await request('', {
      method: 'POST',
      body: { action: 'leaderboard', round: 'combined' }
    });
    return res.data || [];
  }
  const res = await request('/scores/leaderboard-combined/all');
  return res.data || [];
};

// Test endpoint - for debugging
export const testConnection = async () => {
  try {
    console.log('Testing connection to:', API_BASE);
    const response = await fetch(API_BASE + '?action=ping', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Test response status:', response.status);
    const data = await response.json();
    console.log('Test response data:', data);
    return data;
  } catch (error) {
    console.error('Test connection failed:', error.message);
    throw error;
  }
};

export const getScores = async () => {
  if (API_BASE.includes('script.google.com')) {
    const res = await request('', {
      method: 'POST',
      body: { action: 'scores' }
    });
    return res.data || [];
  }
  const res = await request('/scores');
  return res.data || [];
};

// ======== ROUNDS MANAGEMENT ========

export const getRounds = async () => {
  if (API_BASE.includes('script.google.com')) {
    const res = await request('', {
      method: 'POST',
      body: { action: 'getRounds' }
    });
    return res.data || [];
  }
  const res = await request('/rounds');
  return res.data || [];
};

export const addRound = async (roundData) => {
  if (API_BASE.includes('script.google.com')) {
    const res = await request('', {
      method: 'POST',
      body: {
        action: 'addRound',
        roundName: roundData.roundName,
        roundNumber: roundData.roundNumber,
        teams: JSON.stringify(roundData.teams || [])
      }
    });
    return res;
  }
  const res = await request('/rounds', {
    method: 'POST',
    body: roundData
  });
  return res;
};

export const updateRound = async (roundNumber, roundData) => {
  if (API_BASE.includes('script.google.com')) {
    const res = await request('', {
      method: 'POST',
      body: {
        action: 'updateRound',
        roundNumber: roundNumber,
        roundName: roundData.roundName,
        teams: JSON.stringify(roundData.teams || [])
      }
    });
    return res;
  }
  const res = await request(`/rounds/${roundNumber}`, {
    method: 'PUT',
    body: roundData
  });
  return res;
};

