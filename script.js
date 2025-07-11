// Succinct Hall of Fame – with auto-refresh after submission

let profiles = [];

const googleAppsScriptURL =
  "https://script.google.com/macros/s/AKfycbxvB56ASt2LwFAucfDO2o9JXNl7gqt-oSF02mUwpCJFohA9tdl7u4ah9kzq65cyJyvY8A/exec";

async function fetchProfilesFromSheet() {
  const sheetId = "13CDU8eg7xa48DqkrpAKb-eS3YMl1tioTw_UU8j7fM9g";
  const sheetRange = "A:B";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetRange}?alt=json&key=AIzaSyAzpfnEdZVGxjgOV7x2r6_dMpstro-D7Pg`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const rows = data.values;

    if (!rows || rows.length < 2) return;

    const [headers, ...entries] = rows;

    profiles = entries.map(([username, description]) => {
      const cleanUsername = username.replace(/^@/, "");
      return {
        username: username,
        image: `https://unavatar.io/twitter/${cleanUsername}`,
        style: "green",
        description: description,
        link: `https://x.com/${cleanUsername}`,
      };
    });

    renderProfiles(profiles);
  } catch (err) {
    console.error("Failed to fetch profiles from sheet:", err);
  }
}

const container = document.getElementById("cardContainer");

function renderProfiles(list, limit = 54) {
  container.innerHTML = "";
  list.slice(0, limit).forEach((profile) => {
    const card = document.createElement("div");
    card.className = `profile-card ${profile.style}`;
    card.onclick = () => window.open(profile.link, "_blank");
    card.innerHTML = `
      <img src="${profile.image}" alt="${profile.username}" class="profile-img" />
      <div class="username">${profile.username}</div>
      <div class="description">${profile.description}</div>
    `;
    container.appendChild(card);
  });
}

const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", (e) => {
  const keyword = e.target.value.toLowerCase();
  const filtered = profiles.filter((p) =>
    p.username.toLowerCase().includes(keyword)
  );
  renderProfiles(filtered, filtered.length);
});

fetchProfilesFromSheet();

document.getElementById("submitForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const usernameInput = document.getElementById("newUsername");
  const descInput = document.getElementById("newDescription");
  const rawUsername = usernameInput.value.trim();
  const description = descInput.value.trim();

  if (!rawUsername.startsWith("@") || rawUsername.length < 3) {
    alert(
      "Invalid X username. It must start with '@' and be at least 3 characters."
    );
    return;
  }

  const username = rawUsername.replace(/^@/, "");

  const alreadyExists = profiles.some(
    (p) => p.username.replace(/^@/, "").toLowerCase() === username.toLowerCase()
  );

  if (alreadyExists) {
    alert("This X username has already been added to the Hall of Fame!");
    return;
  }

  // Save to Google Sheet via Apps Script
  fetch(googleAppsScriptURL, {
    method: "POST",
    body: JSON.stringify({
      username: rawUsername,
      description: description,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.text())
    .then((response) => {
      console.log("Response from Google Apps Script:", response);

      // Clear input fields
      usernameInput.value = "";
      descInput.value = "";

      alert("You're now in the Hall of Fame! 🎉");

      // Refresh from Google Sheet to reflect new entry
      fetchProfilesFromSheet();
    })
    .catch((err) => {
      console.error("Error submitting profile:", err);
      alert("There was an error submitting your profile. Please try again.");
    });
});
