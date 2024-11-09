// Constants for API keys
const OPENWEATHERMAP_API_KEY = "1c86a55ad041297a64544ba7c3f2d094";
const GEOAPIFY_API_KEY = "d8e390835b8e4110bf2f362e08f1049a";

// Global Variables
let currentUnit = "metric";

// Element Selectors
const searchBtn = document.getElementById("search");
const locationBtn = document.getElementById("location");
const cityInput = document.getElementById("city");
const unitSwitch = document.getElementById("unit-switch");
const unitLabel = document.getElementById("unit-label");
const forecastDiv = document.getElementById("forecast");

// Event Listeners
searchBtn.addEventListener("click", searchWeather);
locationBtn.addEventListener("click", getLocation);
cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchWeather();
  }
});

unitSwitch.addEventListener("change", handleUnitSwitch);

// Initialize autosuggest on page load
document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".search-box input");
  if (input) {
    initializeAutosuggest(input);
  }
  // Set initial unit label
  unitLabel.textContent = currentUnit === "metric" ? "°C" : "°F";
});

// Function to handle unit switch
function handleUnitSwitch() {
  currentUnit = unitSwitch.checked ? "imperial" : "metric";
  unitLabel.textContent = currentUnit === "metric" ? "°C" : "°F";

  // If weather data is already displayed, update it
  const city = cityInput.value.trim();
  const lat = cityInput.getAttribute("data-lat");
  const lon = cityInput.getAttribute("data-lon");

  if (!city && (!lat || !lon)) return;

  searchWeather();
}

// Function to search weather
function searchWeather() {
  const city = cityInput.value.trim();
  const lat = cityInput.getAttribute("data-lat");
  const lon = cityInput.getAttribute("data-lon");

  if (!city && (!lat || !lon)) return;

  const apiUrl =
    lat && lon
      ? `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${OPENWEATHERMAP_API_KEY}`
      : `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
          city
        )}&units=${currentUnit}&appid=${OPENWEATHERMAP_API_KEY}`;

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Location not found");
      }
      return response.json();
    })
    .then((data) => {
      displayForecast(data);
    })
    .catch((err) => {
      console.error("There has been a problem with your fetch operation:", err);
      forecastDiv.innerHTML = '<div class="error">Location not found</div>';
    });
}

// Function to get user's current location
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${OPENWEATHERMAP_API_KEY}`
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error("Location not found");
            }
            return response.json();
          })
          .then((data) => {
            cityInput.value = data.name;
            cityInput.setAttribute("data-lat", lat);
            cityInput.setAttribute("data-lon", lon);

            displayCurrentWeather(data);
            searchWeather();
          })
          .catch((err) => {
            console.error("Error fetching weather data:", err);
            forecastDiv.innerHTML =
              '<div class="error">Location not found</div>';
          });
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

// Function to display current weather
function displayCurrentWeather(data) {
  forecastDiv.innerHTML = `
    <div class="weather-box active">
      <div class="box">
        <div class="info-weather">
          <p class="day">Today</p>
          <div class="weather">
            <img src="https://openweathermap.org/img/wn/${
              data.weather[0].icon
            }@4x.png" alt="Weather icon">
            <p class="temperature">${Math.round(
              data.main.temp
            )}<span>${getTemperatureUnitSymbol()}</span></p>
            <p class="description">${data.weather[0].description}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Function to display forecast
function displayForecast(data) {
  forecastDiv.innerHTML = "";

  const forecasts = {};
  data.list.forEach((item) => {
    const [date, time] = item.dt_txt.split(" ");
    if (!forecasts[date] && time >= "12:00:00") {
      forecasts[date] = item;
    }
  });

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (const date in forecasts) {
    const forecastItem = forecasts[date];
    const dayForecast = document.createElement("div");
    dayForecast.className = "weather-box active";

    const dayOfWeek = new Date(date).getDay();
    const dayName = days[dayOfWeek];

    dayForecast.innerHTML = `
      <div class="box">
        <div class="info-weather">
          <p class="day">${dayName}</p>
          <div class="weather">
            <img src="https://openweathermap.org/img/wn/${
              forecastItem.weather[0].icon
            }@4x.png" alt="Weather icon">
            <p class="temperature">${Math.round(
              forecastItem.main.temp
            )}<span>${getTemperatureUnitSymbol()}</span></p>
            <p class="description">${forecastItem.weather[0].description}</p>
          </div>
        </div>
      </div>
    `;
    forecastDiv.appendChild(dayForecast);
  }
}

// Function to get temperature unit symbol
function getTemperatureUnitSymbol() {
  return currentUnit === "metric" ? "°C" : "°F";
}

// Autosuggest functionality
function initializeAutosuggest(input) {
  const searchBox = input.parentElement;
  const suggestionsContainer = createSuggestionsContainer(searchBox);

  // Loading indicator
  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "loading-indicator";
  loadingIndicator.innerHTML = '<div class="spinner"></div>';
  searchBox.appendChild(loadingIndicator);

  const updateSuggestions = debounce(async (query) => {
    if (!query) {
      suggestionsContainer.innerHTML = "";
      suggestionsContainer.style.display = "none";
      loadingIndicator.style.display = "none";
      return;
    }

    loadingIndicator.style.display = "block";
    const suggestions = await getCitySuggestions(query);
    loadingIndicator.style.display = "none";

    suggestionsContainer.innerHTML = "";

    if (suggestions.length > 0) {
      suggestions.forEach((suggestion) => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.textContent = formatLocation(suggestion);

        div.addEventListener("click", () => {
          handleSuggestionSelect(suggestion, input, suggestionsContainer);
          searchWeather();
        });

        suggestionsContainer.appendChild(div);
      });
      suggestionsContainer.style.display = "block";
    } else {
      suggestionsContainer.style.display = "none";
    }
  }, 300);

  // Event listeners
  input.addEventListener("input", (e) => updateSuggestions(e.target.value));

  // Close suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchBox.contains(e.target)) {
      suggestionsContainer.style.display = "none";
    }
  });

  // Handle keyboard navigation
  input.addEventListener("keydown", (e) => {
    const suggestions =
      suggestionsContainer.querySelectorAll(".suggestion-item");
    let currentIndex = Array.from(suggestions).findIndex((el) =>
      el.classList.contains("active")
    );

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (currentIndex < suggestions.length - 1) {
          if (currentIndex >= 0)
            suggestions[currentIndex].classList.remove("active");
          suggestions[++currentIndex].classList.add("active");
          suggestions[currentIndex].scrollIntoView({ block: "nearest" });
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (currentIndex > 0) {
          suggestions[currentIndex].classList.remove("active");
          suggestions[--currentIndex].classList.add("active");
          suggestions[currentIndex].scrollIntoView({ block: "nearest" });
        }
        break;
      case "Enter":
        e.preventDefault();
        const activeItem = suggestionsContainer.querySelector(
          ".suggestion-item.active"
        );
        if (activeItem) {
          activeItem.click();
        }
        break;
      default:
        currentIndex = -1;
        suggestions.forEach((el) => el.classList.remove("active"));
        break;
    }
  });
}

// Function to create suggestions container
function createSuggestionsContainer(searchBox) {
  const suggestionsContainer = document.createElement("div");
  suggestionsContainer.className = "suggestions-container";
  searchBox.appendChild(suggestionsContainer);
  return suggestionsContainer;
}

// Function to get city suggestions from Geoapify API
async function getCitySuggestions(query) {
  if (query.length < 3) return [];

  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        query
      )}&type=city&format=json&apiKey=${GEOAPIFY_API_KEY}`
    );
    const data = await response.json();

    return data.results.map((place) => ({
      name: place.city || place.name,
      state: place.state,
      country: place.country,
      formatted: place.formatted,
      lat: place.lat,
      lon: place.lon,
    }));
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }
}

// Function to format location display
function formatLocation(suggestion) {
  const parts = [];
  if (suggestion.name) parts.push(suggestion.name);
  if (suggestion.state) parts.push(suggestion.state);
  if (suggestion.country) parts.push(suggestion.country);
  return parts.join(", ");
}

// Function to handle suggestion selection
function handleSuggestionSelect(suggestion, input, suggestionsContainer) {
  input.setAttribute("data-lat", suggestion.lat);
  input.setAttribute("data-lon", suggestion.lon);
  input.value = suggestion.name;
  suggestionsContainer.innerHTML = "";
  suggestionsContainer.style.display = "none";
}

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}