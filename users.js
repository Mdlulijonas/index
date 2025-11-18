let users = [
    { username: 'admin', password: 'password', team: 'Administrator', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'dev', password: 'password', team: 'Full-Stack', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'designer', password: 'password', team: 'UI/UX', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'marketer', password: 'password', team: 'Marketing', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'support', password: 'password', team: 'Support', isOnline: false, lastLogin: null, lastLogout: null },
    { username: 'writer', password: 'password', team: 'Content', isOnline: false, lastLogin: null, lastLogout: null }
];

const ADMIN_CODE = '212259497';

function getUsers() {
    return users;
}

function updateUser(username, updates) {
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
        throw new Error('User not found');
    }
    users[userIndex] = { ...users[userIndex], ...updates };
    return users[userIndex];
}

function loginUser(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        throw new Error('Invalid credentials');
    }
    return user;
}

function registerUser(userData, adminCode) {
    if (adminCode !== ADMIN_CODE) {
        throw new Error('Invalid admin code');
    }
    
    if (users.find(u => u.username === userData.username)) {
        throw new Error('Username already exists');
    }
    
    const newUser = {
        ...userData,
        isOnline: false,
        lastLogin: null,
        lastLogout: null
    };
    users.push(newUser);
    return newUser;
}

module.exports = {
    getUsers,
    updateUser,
    loginUser,
    registerUser
};
