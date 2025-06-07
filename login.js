const loginForm = document.getElementById('loginForm');
const spinner = document.getElementById('spinner');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  spinner.style.display = 'block';

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(
      'https://weather-log-backend.onrender.com/api/v1/users/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await res.json();
    spinner.style.display = 'none';

    if (!res.ok) throw new Error(data.message || 'Login failed');

    alert('Login successful!');
    localStorage.setItem('token', data.token);
    window.location.href = 'index.html'; // or redirect to your main app
  } catch (err) {
    spinner.style.display = 'none';
    alert(err.message);
  }
});
