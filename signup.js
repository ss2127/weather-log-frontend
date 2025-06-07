const signupForm = document.getElementById('signupForm');
const spinner = document.getElementById('spinner');

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  spinner.style.display = 'block';

  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById(
    'signupConfirmPassword'
  ).value;

  if (password !== confirmPassword) {
    spinner.style.display = 'none';
    alert('Passwords do not match');
    return;
  }

  try {
    const res = await fetch(
      'https://weather-log-backend.onrender.com/api/v1/users/signup',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      }
    );

    const data = await res.json();
    spinner.style.display = 'none';

    if (!res.ok) throw new Error(data.message || 'Signup failed');

    alert('Signup successful!');
    localStorage.setItem('token', data.token);
    window.location.href = 'login.html'; // change to dashboard or main app page
  } catch (err) {
    spinner.style.display = 'none';
    alert(err.message);
  }
});
