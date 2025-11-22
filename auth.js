document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignupBtn = document.getElementById('showSignup');
    const showLoginBtn = document.getElementById('showLogin');

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'feed.html';
        return;
    }

    showSignupBtn.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });

    showLoginBtn.addEventListener('click', () => {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        if (name && email && password) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            if (users.find(u => u.email === email)) {
                alert('Email already registered!');
                return;
            }

            const newUser = {
                id: Date.now().toString(),
                name,
                email,
                password 
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            alert('Account created! Please log in.');
            signupForm.reset();
            showLoginBtn.click();
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            const { password, ...safeUser } = user;
            localStorage.setItem('currentUser', JSON.stringify(safeUser));
            window.location.href = 'feed.html';
        } else {
            alert('Invalid email or password!');
        }
    });
});
