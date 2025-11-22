document.addEventListener('DOMContentLoaded', () => {

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }

  const userNameDisplay = document.getElementById('userName');
  const logoutBtn = document.getElementById('logoutBtn');
  const themeToggle = document.getElementById('themeToggle');
  const postContent = document.getElementById('postContent');
  const postImage = document.getElementById('postImage');
  const createPostBtn = document.getElementById('createPostBtn');
  const feedContainer = document.getElementById('feedContainer');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');

  let posts = JSON.parse(localStorage.getItem('posts') || '[]');
  let darkMode = localStorage.getItem('darkMode') === 'true';

  userNameDisplay.textContent = `Welcome, ${currentUser.name}`;
  if (darkMode) document.body.classList.add('dark-mode');
  renderPosts();

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  });

  themeToggle.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', darkMode);
    themeToggle.textContent = darkMode ? '☀️' : '🌙';
  });

  createPostBtn.addEventListener('click', () => {
    const content = postContent.value.trim();
    const imageUrl = postImage.value.trim();

    if (!content && !imageUrl) {
      alert('Please write something or add an image!');
      return;
    }

    const newPost = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      content,
      imageUrl,
      timestamp: new Date().toISOString(),
      likes: 0,
      likedBy: [], 
      comments: []
    };

    posts.unshift(newPost);
    savePosts();
    renderPosts();

    
    postContent.value = '';
    postImage.value = '';
  });

  function renderPosts() {
    let filteredPosts = [...posts];

    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
      filteredPosts = filteredPosts.filter(post =>
        post.content.toLowerCase().includes(searchTerm) ||
        post.authorName.toLowerCase().includes(searchTerm)
      );
    }

    const sortBy = sortSelect.value;
    filteredPosts.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.timestamp) - new Date(a.timestamp);
      if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
      if (sortBy === 'mostLiked') return b.likes - a.likes;
    });

    feedContainer.innerHTML = '';

    if (filteredPosts.length === 0) {
      feedContainer.innerHTML = '<div class="card" style="text-align: center; color: var(--text-muted);">No posts found.</div>';
      return;
    }

    filteredPosts.forEach(post => {
      const isLiked = post.likedBy.includes(currentUser.id);
      const isAuthor = post.authorId === currentUser.id;
      const date = new Date(post.timestamp).toLocaleString();

      const postEl = document.createElement('div');
      postEl.className = 'card post-card';
      postEl.innerHTML = `
                <div class="post-header">
                    <div class="post-meta">
                        <strong>${post.authorName}</strong>
                        <span class="text-muted" style="font-size: 0.8rem;"> • ${date}</span>
                    </div>
                    ${isAuthor ? `
                        <div>
                            <button class="btn btn-ghost edit-btn" data-id="${post.id}">✏️</button>
                            <button class="btn btn-ghost text-danger delete-btn" data-id="${post.id}">🗑️</button>
                        </div>
                    ` : ''}
                </div>
                <div class="post-body">
                    <p>${escapeHtml(post.content)}</p>
                    ${post.imageUrl ? `<img src="${escapeHtml(post.imageUrl)}" alt="Post image" class="post-image">` : ''}
                </div>
                <div class="post-footer">
                    <button class="btn btn-ghost like-btn ${isLiked ? 'liked' : ''}" data-id="${post.id}">
                        ${isLiked ? '❤️' : '🤍'} <span class="like-count">${post.likes}</span>
                    </button>
                    <button class="btn btn-ghost comment-toggle-btn" data-id="${post.id}">
                        💬 ${post.comments ? post.comments.length : 0}
                    </button>
                </div>
                <div class="comments-section hidden" id="comments-${post.id}">
                    <div class="comments-list">
                        ${(post.comments || []).map(comment => `
                            <div class="comment">
                                <strong>${comment.authorName}</strong>: ${escapeHtml(comment.text)}
                            </div>
                        `).join('')}
                    </div>
                    <div class="add-comment">
                        <input type="text" class="form-input comment-input" placeholder="Write a comment..." data-id="${post.id}">
                        <button class="btn btn-primary btn-sm submit-comment-btn" data-id="${post.id}">Send</button>
                    </div>
                </div>
            `;
      feedContainer.appendChild(postEl);
    });

    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', (e) => toggleLike(e.currentTarget.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => deletePost(e.currentTarget.dataset.id));
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => editPost(e.currentTarget.dataset.id));
    });

    document.querySelectorAll('.comment-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.currentTarget.dataset.id;
        document.getElementById(`comments-${postId}`).classList.toggle('hidden');
      });
    });

    document.querySelectorAll('.submit-comment-btn').forEach(btn => {
      btn.addEventListener('click', (e) => addComment(e.currentTarget.dataset.id));
    });
  }

  function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const userIndex = post.likedBy.indexOf(currentUser.id);
    if (userIndex === -1) {
      post.likedBy.push(currentUser.id);
      post.likes++;
    } else {
      post.likedBy.splice(userIndex, 1);
      post.likes--;
    }

    savePosts();
    renderPosts();
  }

  function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
      posts = posts.filter(p => p.id !== postId);
      savePosts();
      renderPosts();
    }
  }

  function editPost(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newContent = prompt('Edit your post:', post.content);
    if (newContent !== null && newContent.trim() !== '') {
      post.content = newContent.trim();
      savePosts();
      renderPosts();
    }
  }

  function addComment(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const input = document.querySelector(`.comment-input[data-id="${postId}"]`);
    const text = input.value.trim();

    if (text) {
      if (!post.comments) post.comments = [];

      post.comments.push({
        id: Date.now().toString(),
        authorId: currentUser.id,
        authorName: currentUser.name,
        text,
        timestamp: new Date().toISOString()
      });

      savePosts();
      renderPosts();

      setTimeout(() => {
        const commentSection = document.getElementById(`comments-${postId}`);
        if (commentSection) commentSection.classList.remove('hidden');
      }, 0);
    }
  }

  function savePosts() {
    localStorage.setItem('posts', JSON.stringify(posts));
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  searchInput.addEventListener('input', renderPosts);
  sortSelect.addEventListener('change', renderPosts);
});
