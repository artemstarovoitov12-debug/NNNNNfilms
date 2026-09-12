(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function showMessage(text, type) {
    var authMessage = byId('authMessage');
    if (!authMessage) return;

    authMessage.textContent = text;
    authMessage.className = 'message';

    if (type === 'error') {
      authMessage.className += ' error';
    }

    if (type === 'success') {
      authMessage.className += ' success';
    }
  }

  function saveCurrentUser(user) {
    try {
      localStorage.setItem('videoHubCurrentUser', JSON.stringify(user));
    } catch (e) {}
  }

  function updateAuthState(user) {
    var authSection = byId('authSection');
    var appSection = byId('appSection');
    var userBlock = byId('userBlock');
    var currentUserLabel = byId('currentUserLabel');

    if (!authSection || !appSection || !userBlock) return;

    if (user) {
      authSection.className = 'auth-section hidden';
      appSection.className = 'app-section';
      userBlock.className = 'user-block';

      if (currentUserLabel) {
        currentUserLabel.textContent = 'Вы вошли как: ' + user.nickname;
      }
    }
  }

  function requestRpc(functionName, nickname, password, callback) {
    var xhr = new XMLHttpRequest();

    xhr.open(
      'POST',
      'https://cpngyotbjpdmiocoutla.supabase.co/rest/v1/rpc/' + functionName,
      true
    );

    xhr.setRequestHeader(
      'apikey',
      'sb_publishable_41RYlW2KJXoxCmtVCtO0xQ_CsWWlhPN'
    );

    xhr.setRequestHeader(
      'Authorization',
      'Bearer sb_publishable_41RYlW2KJXoxCmtVCtO0xQ_CsWWlhPN'
    );

    xhr.setRequestHeader(
      'Content-Type',
      'application/json'
    );

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          callback(null, JSON.parse(xhr.responseText));
        } catch (e) {
          callback('Ошибка ответа сервера');
        }
      } else {
        callback('Ошибка сервера: ' + xhr.status);
      }
    };

    var body = JSON.stringify({
      p_nickname: nickname,
      p_password: password
    });

    xhr.send(body);
  }

  var registerForm = byId('registerForm');

  if (registerForm) {
    registerForm.onsubmit = function () {
      var nickname = byId('registerNickname').value;
      var password = byId('registerPassword').value;

      if (!nickname || !password) {
        showMessage('Заполните все поля для регистрации.', 'error');
        return false;
      }

      showMessage('Регистрация...', 'info');

      requestRpc(
        'register_user',
        nickname,
        password,
        function (error, data) {
          if (error) {
            showMessage(error, 'error');
            return;
          }

          if (!data || !data.ok) {
            showMessage(
              data && data.message ? data.message : 'Не удалось зарегистрироваться.',
              'error'
            );
            return;
          }

          registerForm.reset();

          showMessage(
            'Регистрация успешно выполнена. Теперь можно войти.',
            'success'
          );
        }
      );

      return false;
    };
  }

  var loginForm = byId('loginForm');

  if (loginForm) {
    loginForm.onsubmit = function () {
      var nickname = byId('loginNickname').value;
      var password = byId('loginPassword').value;

      if (!nickname || !password) {
        showMessage('Введите никнейм и пароль.', 'error');
        return false;
      }

      showMessage('Вход...', 'info');

      requestRpc(
        'login_user',
        nickname,
        password,
        function (error, data) {
          if (error) {
            showMessage(error, 'error');
            return;
          }

          if (!data || !data.ok) {
            showMessage(
              data && data.message ? data.message : 'Неверный никнейм или пароль.',
              'error'
            );
            return;
          }

          var user = {
            nickname: data.nickname
          };

          saveCurrentUser(user);
          updateAuthState(user);

          loginForm.reset();
          showMessage('', 'info');
        }
      );

      return false;
    };
  }
})();
