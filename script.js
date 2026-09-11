const STORAGE_KEYS = {
  users: 'videoHubUsers',
  videos: 'videoHubVideos',
  currentUser: 'videoHubCurrentUser'
};

const ADMIN_NAMES = ['admin', 'admin1', 'admin2', 'admin3', 'admin4', 'admin5'];

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const authMessage = document.getElementById('authMessage');
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const userBlock = document.getElementById('userBlock');
const currentUserLabel = document.getElementById('currentUserLabel');
const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const videosList = document.getElementById('videosList');
const adminToggleBtn = document.getElementById('adminToggleBtn');
const adminModal = document.getElementById('adminModal');
const closeAdminModal = document.getElementById('closeAdminModal');
const adminVideoForm = document.getElementById('adminVideoForm');
const videoUrlInput = document.getElementById('videoUrl');
const videoIconInput = document.getElementById('videoIcon');
const filmModal = document.getElementById('filmModal');
const filmTitle = document.getElementById('filmTitle');
const filmDescription = document.getElementById('filmDescription');
const filmPlayer = document.getElementById('filmPlayer');
const filmWatchLink = document.getElementById('filmWatchLink');
const closeFilmModal = document.getElementById('closeFilmModal');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users)) || [];
let videos = JSON.parse(localStorage.getItem(STORAGE_KEYS.videos)) || [];
let currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser)) || null;

if (!localStorage.getItem(STORAGE_KEYS.users)) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

if (!localStorage.getItem(STORAGE_KEYS.videos)) {
  localStorage.setItem(STORAGE_KEYS.videos, JSON.stringify(videos));
}

function showMessage(text, type = 'info') {
  authMessage.textContent = text;
  authMessage.className = 'message';
  if (type === 'error') authMessage.classList.add('error');
  if (type === 'success') authMessage.classList.add('success');
}

function saveUsers() {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function saveVideos() {
  localStorage.setItem(STORAGE_KEYS.videos, JSON.stringify(videos));
}

function saveCurrentUser() {
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));
}

function normalizeNickname(value) {
  return value.trim();
}

function isAdminNickname(nickname) {
  return ADMIN_NAMES.includes(String(nickname || '').toLowerCase());
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}

function highlightMatches(text, query) {
  if (!query || !text) return text;

  const phrases = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => part.length > 0);

  if (!phrases.length) return text;

  let result = text;
  phrases.forEach((phrase) => {
    const regex = new RegExp(`(${escapeHtml(phrase)})`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  });

  return result;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getDescriptionPreview(description, query = '') {
  const plainText = description.trim();
  const lowerText = plainText.toLowerCase();
  const lowerQuery = query.trim().toLowerCase();

  if (!plainText) {
    return 'Описание отсутствует.';
  }

  if (plainText.length <= 100 && plainText.split(/\s+/).length <= 16 && !lowerQuery) {
    return plainText;
  }

  const summary = plainText.length > 100 ? plainText.slice(0, 100).trim() + '…' : plainText;
  return summary;
}

function renderVideoCard(video) {
  const query = searchInput.value.trim();
  const descriptionText = getDescriptionPreview(video.description, query);
  const highlightedDescription = highlightMatches(descriptionText, query);
  const iconMarkup = video.iconDataUrl
    ? `<img class="video-icon" src="${video.iconDataUrl}" alt="Иконка фильма" />`
    : `<div class="video-icon" style="background: linear-gradient(135deg, #d7d7d7, #4a4a4a); display: grid; place-items: center; color: #111; font-weight: 700;">FILM</div>`;

  const needsDetails = video.description.length > 100 || video.description.split(/\s+/).length > 16;
  const detailsButton = needsDetails
    ? `<button type="button" class="open-film-btn" data-film-id="${video.id}">Открыть фильм</button>`
    : '';

  const deleteButton = currentUser && isAdminNickname(currentUser.nickname)
    ? `<button type="button" class="delete-film-btn" data-delete-id="${video.id}">Удалить</button>`
    : '';

  return `
    <article class="video-card" data-film-id="${video.id}">
      <div class="video-media">
        ${iconMarkup}
      </div>
      <div class="video-info">
        <h3>${video.title}</h3>
        <p class="video-description-text">${highlightedDescription}</p>
        ${detailsButton}
        ${deleteButton}
        <span class="video-meta">Добавил: ${video.addedBy}</span>
      </div>
    </article>
  `;
}

function renderVideos() {
  const query = searchInput.value.trim().toLowerCase();
  const filteredVideos = videos.filter((video) => {
    const inTitle = video.title.toLowerCase().includes(query);
    const inDescription = video.description.toLowerCase().includes(query);
    return !query || inTitle || inDescription;
  });

  if (!filteredVideos.length) {
    videosList.innerHTML = '<div class="empty-state">Фильм не найден. Попробуйте другой запрос.</div>';
    return;
  }

  videosList.innerHTML = filteredVideos.map(renderVideoCard).join('');

  videosList.querySelectorAll('.video-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('.delete-film-btn') || event.target.closest('.open-film-btn')) {
        return;
      }

      const film = videos.find((item) => String(item.id) === card.dataset.filmId);
      if (!film) return;

      openFilmDetails(film);
    });
  });

  videosList.querySelectorAll('.open-film-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const film = videos.find((item) => String(item.id) === button.dataset.filmId);
      if (!film) return;

      openFilmDetails(film);
    });
  });

  videosList.querySelectorAll('.delete-film-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const filmId = Number(button.dataset.deleteId);
      openDeleteConfirm(filmId);
    });
  });
}

function openFilmDetails(film) {
  filmTitle.textContent = film.title;
  filmDescription.innerHTML = highlightMatches(film.description, searchInput.value.trim(), true);
  filmWatchLink.href = film.videoUrl || film.videoDataUrl || '#';
  filmModal.classList.remove('hidden');
}

function closeFilmDetails() {
  filmModal.classList.add('hidden');
  filmWatchLink.href = '#';
}

let filmToDeleteId = null;

function openDeleteConfirm(id) {
  filmToDeleteId = id;
  deleteConfirmModal.classList.remove('hidden');
}

function closeDeleteConfirm() {
  filmToDeleteId = null;
  deleteConfirmModal.classList.add('hidden');
}

function updateAuthState() {
  const loggedIn = Boolean(currentUser);
  authSection.classList.toggle('hidden', loggedIn);
  appSection.classList.toggle('hidden', !loggedIn);
  userBlock.classList.toggle('hidden', !loggedIn);

  if (loggedIn) {
    currentUserLabel.textContent = `Вы вошли как: ${currentUser.nickname}`;
    adminToggleBtn.classList.toggle('hidden', !isAdminNickname(currentUser.nickname));
  } else {
    adminToggleBtn.classList.add('hidden');
    currentUserLabel.textContent = '';
  }
}

function openAdminModal() {
  adminModal.classList.remove('hidden');
}

function closeAdminModalWindow() {
  adminModal.classList.add('hidden');
  adminVideoForm.reset();
  if (videoUrlInput) videoUrlInput.value = '';
  if (videoIconInput) videoIconInput.value = '';
}

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const nickname = normalizeNickname(document.getElementById('registerNickname').value);
  const password = document.getElementById('registerPassword').value;

  if (!nickname || !password) {
    showMessage('Заполните все поля для регистрации.', 'error');
    return;
  }

  const duplicate = users.some(
    (user) => user.nickname.toLowerCase() === nickname.toLowerCase()
  );

  if (duplicate) {
    showMessage('Такой никнейм уже занят. Выберите другой.', 'error');
    return;
  }

  users.push({ nickname, password });
  saveUsers();

  registerForm.reset();
  showMessage('Регистрация успешно выполнена. Теперь можно войти в систему.', 'success');
});

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const nickname = normalizeNickname(document.getElementById('loginNickname').value);
  const password = document.getElementById('loginPassword').value;

  const foundUser = users.find(
    (user) =>
      user.nickname.toLowerCase() === nickname.toLowerCase() &&
      user.password === password
  );

  if (!foundUser) {
    showMessage('Неверный никнейм или пароль.', 'error');
    return;
  }

  currentUser = { nickname: foundUser.nickname };
  saveCurrentUser();
  updateAuthState();
  renderVideos();
  loginForm.reset();
  showMessage('', 'info');
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  updateAuthState();
  renderVideos();
  showMessage('Вы вышли из аккаунта.', 'success');
});

searchInput.addEventListener('input', renderVideos);
adminToggleBtn.addEventListener('click', openAdminModal);
closeAdminModal.addEventListener('click', closeAdminModalWindow);
closeFilmModal.addEventListener('click', closeFilmDetails);
cancelDeleteBtn.addEventListener('click', closeDeleteConfirm);
confirmDeleteBtn.addEventListener('click', () => {
  if (filmToDeleteId === null) return;

  videos = videos.filter((item) => item.id !== filmToDeleteId);
  saveVideos();
  renderVideos();
  closeDeleteConfirm();
  showMessage('Фильм удалён.', 'success');
});
adminModal.addEventListener('click', (event) => {
  if (event.target === adminModal) {
    closeAdminModalWindow();
  }
});

filmModal.addEventListener('click', (event) => {
  if (event.target === filmModal) {
    closeFilmDetails();
  }
});

deleteConfirmModal.addEventListener('click', (event) => {
  if (event.target === deleteConfirmModal) {
    closeDeleteConfirm();
  }
});

adminVideoForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!currentUser || !isAdminNickname(currentUser.nickname)) {
    showMessage('Только администратор может добавлять видео.', 'error');
    return;
  }

  const title = document.getElementById('videoTitle').value.trim();
  const description = document.getElementById('videoDescription').value.trim();
  const videoUrl = videoUrlInput.value.trim();
  const iconFile = videoIconInput.files[0];

  if (!title || !description || !videoUrl) {
    showMessage('Название, описание и ссылка на фильм обязательны.', 'error');
    return;
  }

  try {
    new URL(videoUrl);
  } catch (error) {
    showMessage('Введите корректную ссылку на фильм.', 'error');
    return;
  }

  if (iconFile && !iconFile.type.startsWith('image/')) {
    showMessage('Иконка должна быть изображением.', 'error');
    return;
  }

  try {
    const iconDataUrl = await readFileAsDataURL(iconFile);

    videos.unshift({
      id: Date.now(),
      title,
      description,
      videoUrl,
      iconDataUrl,
      addedBy: currentUser.nickname
    });

    saveVideos();
    renderVideos();
    closeAdminModalWindow();
    showMessage('Видео успешно добавлено в общий список.', 'success');
  } catch (error) {
    showMessage('Не удалось загрузить файлы. Попробуйте ещё раз.', 'error');
  }
});

updateAuthState();
renderVideos();
