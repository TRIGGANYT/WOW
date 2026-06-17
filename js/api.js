// js/api.js — HTTP helper replacing Angular HttpClient + authInterceptor
import { getToken, logout } from './services/auth.service.js';
import { clearCache } from './services/user.service.js';
import { navigateTo } from './router.js';

export async function apiFetch(url, options = {}) {
  const token = getToken();

  if (token === 'guest_mode_token') {
    return mockApiFetch(url, options);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });

  if (response.status === 401) {
    // Token expired or invalid → clear cache, logout and redirect
    clearCache();
    logout();
    navigateTo('/');
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Request failed' }));
    const err = new Error(errorBody.message || 'Request failed');
    err.status = response.status;
    err.error = errorBody;
    throw err;
  }

  // Handle 204 No Content
  if (response.status === 204) return null;

  return response.json();
}

function mockApiFetch(url, options = {}) {
  const parsedUrl = new URL(url, window.location.origin);
  const path = parsedUrl.pathname;
  const method = options.method ? options.method.toUpperCase() : 'GET';
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : null;

  const getStorage = (key, defaultVal) => {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  };
  const setStorage = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  // 1. User profile endpoints
  if (path === '/api/auth/me') {
    if (method === 'GET') {
      const user = getStorage('guest_user', {
        _id: 'guest_user_id',
        username: 'Gast-Entdecker',
        email: 'gast@wow.ch',
        age: 25,
        hobbies: ['Programmieren', 'Lesen'],
        lifeStage: 'Entdecker',
        mentorLevel: 1,
        mentorXp: 0,
        challengeLevel: 1,
        challengeXp: 0,
        isGuest: true
      });
      return Promise.resolve(user);
    }
    if (method === 'PUT') {
      const user = getStorage('guest_user', { _id: 'guest_user_id', isGuest: true });
      const updatedUser = { ...user, ...body };
      setStorage('guest_user', updatedUser);
      return Promise.resolve(updatedUser);
    }
    if (method === 'DELETE') {
      localStorage.removeItem('guest_user');
      localStorage.removeItem('guest_conversations');
      localStorage.removeItem('guest_folders');
      return Promise.resolve({ message: 'Konto erfolgreich gelöscht' });
    }
  }

  // 2. XP Addition endpoint
  if (path === '/api/auth/add-xp') {
    const user = getStorage('guest_user', { _id: 'guest_user_id', isGuest: true, mentorXp: 0, mentorLevel: 1, challengeXp: 0, challengeLevel: 1 });
    const { type, amount } = body;
    
    const calculateLevel = (xp) => {
      let level = 1;
      let totalNeeded = 0;
      while (level < 10) {
        const needed = Math.round(100 * Math.pow(1.5, level - 1));
        if (xp < totalNeeded + needed) break;
        totalNeeded += needed;
        level++;
      }
      return level;
    };

    if (type === 'mentor') {
      user.mentorXp = (user.mentorXp || 0) + amount;
      user.mentorLevel = calculateLevel(user.mentorXp);
    } else if (type === 'challenge') {
      user.challengeXp = (user.challengeXp || 0) + amount;
      user.challengeLevel = calculateLevel(user.challengeXp);
    }
    setStorage('guest_user', user);
    return Promise.resolve({
      mentorXp: user.mentorXp,
      mentorLevel: user.mentorLevel,
      challengeXp: user.challengeXp,
      challengeLevel: user.challengeLevel
    });
  }

  // 3. Ratings history endpoint
  if (path.startsWith('/api/auth/ratings/')) {
    return Promise.resolve([]);
  }

  // 4. Conversation endpoints
  if (path === '/api/conversations') {
    if (method === 'GET') {
      const conversations = getStorage('guest_conversations', []);
      return Promise.resolve(conversations.map(c => ({
        _id: c._id,
        title: c.title,
        folder: c.folder,
        updatedAt: c.updatedAt
      })));
    }
    if (method === 'POST') {
      const conversations = getStorage('guest_conversations', []);
      const newConv = {
        _id: 'conv_' + Math.random().toString(36).substring(2, 9),
        title: body.title || 'Neuer Chat',
        messages: body.messages || [],
        folder: null,
        updatedAt: new Date().toISOString()
      };
      conversations.push(newConv);
      setStorage('guest_conversations', conversations);
      return Promise.resolve(newConv);
    }
  }

  // Conversation detail endpoints /api/conversations/:id
  const convMatch = path.match(/^\/api\/conversations\/([a-zA-Z0-9_]+)$/);
  if (convMatch) {
    const id = convMatch[1];
    const conversations = getStorage('guest_conversations', []);
    const idx = conversations.findIndex(c => c._id === id);

    if (method === 'GET') {
      if (idx === -1) return Promise.reject(new Error('Conversation nicht gefunden'));
      return Promise.resolve(conversations[idx]);
    }
    if (method === 'PUT') {
      if (idx === -1) return Promise.reject(new Error('Conversation nicht gefunden'));
      if (body.title !== undefined) conversations[idx].title = body.title;
      if (body.messages !== undefined) conversations[idx].messages = body.messages;
      if (body.folder !== undefined) conversations[idx].folder = body.folder;
      conversations[idx].updatedAt = new Date().toISOString();
      setStorage('guest_conversations', conversations);
      return Promise.resolve(conversations[idx]);
    }
    if (method === 'DELETE') {
      if (idx === -1) return Promise.reject(new Error('Conversation nicht gefunden'));
      conversations.splice(idx, 1);
      setStorage('guest_conversations', conversations);
      return Promise.resolve({ message: 'Conversation gelöscht' });
    }
  }

  // 5. Folder endpoints /api/folders
  if (path === '/api/folders') {
    if (method === 'GET') {
      return Promise.resolve(getStorage('guest_folders', []));
    }
    if (method === 'POST') {
      const folders = getStorage('guest_folders', []);
      const newFolder = {
        _id: 'folder_' + Math.random().toString(36).substring(2, 9),
        name: body.name
      };
      folders.push(newFolder);
      setStorage('guest_folders', folders);
      return Promise.resolve(newFolder);
    }
  }

  const folderMatch = path.match(/^\/api\/folders\/([a-zA-Z0-9_]+)$/);
  if (folderMatch) {
    const id = folderMatch[1];
    const folders = getStorage('guest_folders', []);
    const idx = folders.findIndex(f => f._id === id);

    if (method === 'PUT') {
      if (idx === -1) return Promise.reject(new Error('Folder nicht gefunden'));
      folders[idx].name = body.name;
      setStorage('guest_folders', folders);
      return Promise.resolve(folders[idx]);
    }
    if (method === 'DELETE') {
      if (idx === -1) return Promise.reject(new Error('Folder nicht gefunden'));
      folders.splice(idx, 1);
      setStorage('guest_folders', folders);
      // Clean up folders in conversations
      const conversations = getStorage('guest_conversations', []);
      conversations.forEach(c => {
        if (c.folder === id) c.folder = null;
      });
      setStorage('guest_conversations', conversations);
      return Promise.resolve({ message: 'Folder gelöscht' });
    }
  }

  // 6. Team-Up endpoints /api/teams
  if (path === '/api/teams') {
    const mockTeams = [
      {
        _id: 'mock_team_1',
        name: 'Design Masters',
        description: 'Hier dreht sich alles um UI/UX, Skizzen und kreatives Design.',
        icon: '🎨',
        maxMembers: 8,
        members: [{ _id: 'user_1', username: 'Sarah', mentorLevel: 6 }, { _id: 'user_2', username: 'David', mentorLevel: 4 }],
        creator: { _id: 'user_1', username: 'Sarah', mentorLevel: 6 }
      },
      {
        _id: 'mock_team_2',
        name: 'Web Dev Wizards',
        description: 'Wir bauen die WOW Web-App mit modernem Javascript!',
        icon: '💻',
        maxMembers: 5,
        members: [{ _id: 'user_3', username: 'Alex', mentorLevel: 8 }],
        creator: { _id: 'user_3', username: 'Alex', mentorLevel: 8 }
      }
    ];
    return Promise.resolve(mockTeams);
  }

  return Promise.reject(new Error('Dieser Service ist im Gast-Modus eingeschränkt.'));
}

