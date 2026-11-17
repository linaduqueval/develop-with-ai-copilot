document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.querySelectorAll('option:not([value=""])').forEach((option) => {
        option.remove();
      });

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>
              Participants
              <span class="participant-count">${details.participants.length}</span>
            </h5>
            <ul class="participant-list"></ul>
          </div>
        `;

        const participantList = activityCard.querySelector(".participant-list");
        const participantCount = activityCard.querySelector(".participant-count");
        const availability = activityCard.querySelector(".activity-availability");
        details.participants.forEach((email) => {
          const participant = document.createElement("li");
          participant.dataset.email = email;

          const participantEmail = document.createElement("span");
          participantEmail.textContent = email;

          const removeButton = document.createElement("button");
          removeButton.className = "remove-participant";
          removeButton.type = "button";
          removeButton.setAttribute("aria-label", `Unregister ${email}`);
          removeButton.title = "Unregister participant";
          removeButton.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
            </svg>
          `;

          removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (!response.ok) {
                showMessage(result.detail || "Unable to unregister participant.", "error");
                return;
              }

              participantList.querySelectorAll("li[data-email]").forEach((item) => {
                if (item.dataset.email === email) {
                  item.remove();
                }
              });

              const remainingCount = participantList.querySelectorAll("li[data-email]").length;
              participantCount.textContent = remainingCount;
              availability.innerHTML = `<strong>Availability:</strong> ${
                details.max_participants - remainingCount
              } spots left`;

              if (remainingCount === 0) {
                const emptyState = document.createElement("li");
                emptyState.className = "empty-state";
                emptyState.textContent = "No participants yet.";
                participantList.appendChild(emptyState);
              }

              showMessage(result.message, "success");
            } catch (error) {
              showMessage("Failed to unregister participant. Please try again.", "error");
              console.error("Error unregistering participant:", error);
            } finally {
              removeButton.disabled = false;
            }
          });

          participant.append(participantEmail, removeButton);
          participantList.appendChild(participant);
        });

        if (details.participants.length === 0) {
          const emptyState = document.createElement("li");
          emptyState.className = "empty-state";
          emptyState.textContent = "No participants yet.";
          participantList.appendChild(emptyState);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
