// ==================== AUTH CHECK ====================
if (!localStorage.getItem('token')) {
  alert('You must log in first.');
  window.location.href = 'login.html';
}
const payload = JSON.parse(atob(localStorage.getItem('token').split('.')[1]));
console.log(payload);
const username = payload.name || 'User';

// Insert username into HTML
document.getElementById('display-username').textContent = username;
// DOM Elements
const form = document.getElementById('weatherForm');
const resultDiv = document.getElementById('result');
const saveBtn = document.getElementById('saveBtn');
const toggleDisplayLogBtn = document.getElementById('toggle-display-log-btn');
const displayLogDiv = document.getElementById('displayLog');
const deleteAllLogsDiv = document.getElementById('deleteAllLogsDiv');
const logoutBtn = document.getElementById('logoutBtn');

let currentWeather = null;
const token = localStorage.getItem('token');
// ======= Handle weather form submission =======
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const city = document.getElementById('cityInput').value;

  try {
    //
    const res = await fetch(
      'https://weather-log-backend.onrender.com/api/v1/weatherLogs/display',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ city }),
      }
    );

    if (!res.ok) throw new Error('Failed to fetch weather');

    const data = await res.json();
    currentWeather = data;

    // Display weather result
    resultDiv.innerHTML = `
      <h3>${data.city}, ${data.countryCode}</h3>
      <p>Temperature: ${data.temperature}°C</p>
      <p>Condition: ${data.description}</p>
      <p> <img src="${data.iconUrl}" alt="Weather icon" style="width: 40%"></p>
      <p>Local Time: ${data.localTime}</p>
    `;
    saveBtn.style.display = 'inline-block'; // show save button
  } catch (err) {
    resultDiv.textContent = 'Error fetching weather data.';
    saveBtn.style.display = 'none';
    console.error(err);
  }
});

// SAVE LOG
// ======= Handle saving current weather =======
saveBtn.addEventListener('click', async () => {
  if (!currentWeather) return;

  const token = localStorage.getItem('token');

  try {
    const res = await fetch(
      'https://weather-log-backend.onrender.com/api/v1/weatherLogs/save',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(currentWeather),
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return;
      }
      throw new Error('Failed to save log');
    }

    alert('Weather log saved successfully!');
    saveBtn.style.display = 'none'; // hide save button after saving
  } catch (err) {
    console.error(err);
    alert('Failed to save weather log.');
  }
});

// ======= Toggle log display and set up delete buttons =======
toggleDisplayLogBtn.addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(
      'https://weather-log-backend.onrender.com/api/v1/weatherLogs',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (res.status === 401 || res.status === 403) {
      alert('Session expired or unauthorized. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      return;
    }
    const data = await res.json();

    // Clear previous delete all button if any
    deleteAllLogsDiv.textContent = '';

    // Create "Delete All" button
    const deleteAllBtn = document.createElement('button');
    deleteAllBtn.id = 'deleteAllBtn';
    deleteAllBtn.innerHTML = 'Delete All <i class="fa fa-trash-o"></i>';
    deleteAllLogsDiv.appendChild(deleteAllBtn);

    if (toggleDisplayLogBtn.textContent === 'Show Log') {
      deleteAllLogsDiv.style.display = 'block';

      if (data.length === 0) {
        displayLogDiv.textContent = 'There are no logs saved 😢';
      } else {
        // Display each log
        data.forEach((logData) => {
          const logDiv = document.createElement('div');
          // Log details
          // <img src="${data.iconUrl}" alt="Weather icon"></img>
          const icon = document.createElement('img');

          const weatherHeader = document.createElement('h3');
          weatherHeader.style.display = 'inline';
          weatherHeader.textContent = `${logData.city}, ${logData.countryCode} `;
          icon.src = logData.iconUrl;
          icon.alt = 'Weather Icon';
          icon.style.width = '40px';
          icon.style.height = '40px';
          icon.style.verticalAlign = 'middle';
          weatherHeader.appendChild(icon);

          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'deleteBtn';
          deleteBtn.dataset.id = logData._id;
          deleteBtn.style.float = 'right';
          deleteBtn.innerHTML = '<i class="fa fa-trash-o"></i>';

          const tempP = document.createElement('p');
          tempP.textContent = `Temperature: ${logData.temperature}°C`;

          const descP = document.createElement('p');
          descP.textContent = `Condition: ${logData.description}`;

          const localTimeP = document.createElement('p');
          localTimeP.textContent = `Local Time: ${logData.localTime}`;

          const hr = document.createElement('hr');

          // Build log entry view
          logDiv.appendChild(weatherHeader);
          logDiv.appendChild(deleteBtn);
          logDiv.appendChild(tempP);
          logDiv.appendChild(descP);
          logDiv.appendChild(localTimeP);
          logDiv.appendChild(hr);

          displayLogDiv.appendChild(logDiv);

          // Handle individual delete
          deleteBtn.addEventListener('click', async function () {
            const confirmed = confirm(
              'Are you sure you want to delete this weather log?'
            );
            if (!confirmed) return;

            try {
              const id = this.dataset.id;
              const res = await fetch(
                `https://weather-log-backend.onrender.com/api/v1/weatherLogs/save/${id}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
              await res.json();

              this.closest('div').remove(); // remove from UI
            } catch (err) {
              console.error('Delete failed:', err.message);
            }
          });
        });

        // ======= Handle deleting ALL logs =======
        deleteAllBtn.addEventListener('click', async function () {
          try {
            const res = await fetch(
              'https://weather-log-backend.onrender.com/api/v1/weatherLogs',
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const data = await res.json();

            if (data.length === 0) {
              alert('No logs to be deleted');
              return;
            }

            const confirmed = confirm(
              'Are you sure you want to delete ALL logs?'
            );
            if (!confirmed) return;

            const delRes = await fetch(
              'https://weather-log-backend.onrender.com/api/v1/weatherLogs/save',
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!delRes.ok) throw new Error(`Delete failed: ${delRes.status}`);
            await delRes.json();

            // Remove all logs from view
            document
              .querySelectorAll('#displayLog > div')
              .forEach((el) => el.remove());
          } catch (err) {
            console.error('Delete all failed:', err.message);
          }
        });
      }

      // Update toggle button text
      toggleDisplayLogBtn.textContent = 'Hide Log';
    } else {
      // Hide logs and button
      displayLogDiv.textContent = '';
      toggleDisplayLogBtn.textContent = 'Show Log';
      deleteAllLogsDiv.style.display = 'none';
    }
  } catch (err) {
    console.error(err);
    alert('Failed to display weather logs');
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    const res = await fetch(
      'https://weather-log-backend.onrender.com/api/v1/users/logout',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
    await res.json();

    localStorage.removeItem('token');
    window.location.href = 'login.html';
  } catch (err) {
    console.error(err);
    alert('logout failed');
  }
});
