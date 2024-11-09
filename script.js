// Element Selectors
const container = document.querySelector(".container");
const searchBtn = document.getElementById("search");
const input = document.querySelector(".search-box input");
const weatherBox = document.querySelector(".weather-box");
const weatherDetails = document.querySelector(".weather-details");
const error404 = document.querySelector(".not-found");
const geolocationBtn = document.getElementById("location");
const unitSwitch = document.getElementById("unit-switch");
const unitLabel = document.getElementById("unit-label");

// API Keys (Replace with your own API keys)
const OPENWEATHERMAP_API_KEY = "YOUR_OPENWEATHERMAP_API_KEY";
const GEOAPIFY_API_KEY = "YOUR_GEOAPIFY_API_KEY";

// Global Variables
let currentUnit = "metric";
let lastPosition = null;

// Event Listeners
document.addEventListener("DOMContentLoaded", initializeAutosuggest);
unitSwitch.addEventListener("change", handleUnitSwitch);
geolocationBtn.addEventListener("click", handleGeolocation);
searchBtn.addEventListener("click", handleSearch);
input.addEventListener("keydown", handleEnterKey);

// Function to initialize autosuggest
function initializeAutosuggest() {
  setupAutosuggest(input);
}

// Handle unit toggle switch
function handleUnitSwitch() {
  currentUnit = unitSwitch.checked ? "imperial" : "metric";
  unitLabel.textContent = unitSwitch.checked ? "°F" : "°C";

  if (weatherBox.classList.contains("active")) {
    const city = input.value.trim();
    const lat = input.getAttribute("data-lat");
    const lon = input.getAttribute("data-lon");

    if (lat && lon) {
      fetchWeatherByCoordinates(lat, lon);
    } else if (city !== "") {
      fetchWeatherByCity(city);
    } else if (navigator.geolocation && lastPosition) {
      fetchWeatherByCoordinates(
        lastPosition.coords.latitude,
        lastPosition.coords.longitude
      );
    }
  }
}

// Handle geolocation button click
function handleGeolocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        lastPosition = position;
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherByCoordinates(lat, lon);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(
          "Unable to retrieve your location. Please enter your location manually."
        );
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

// Handle search button click
function handleSearch() {
  const city = input.value.trim();
  const lat = input.getAttribute("data-lat");
  const lon = input.getAttribute("data-lon");

  if (lat && lon) {
    fetchWeatherByCoordinates(lat, lon);
  } else if (city !== "") {
    fetchWeatherByCity(city);
  }
}

// Handle enter key press in input
function handleEnterKey(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    searchBtn.click();
  }
}

// Fetch weather data by city name
function fetchWeatherByCity(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&units=${currentUnit}&appid=${OPENWEATHERMAP_API_KEY}`;

  fetchWeatherData(url);
}

// Fetch weather data by coordinates
function fetchWeatherByCoordinates(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${OPENWEATHERMAP_API_KEY}`;

  fetchWeatherData(url);
}

// Fetch weather data from API
function fetchWeatherData(url) {
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.cod === "404" || data.cod !== 200) {
        showError();
        return;
      }
      updateWeatherUI(data);
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error);
      showError();
    });
}

// Update the weather UI with fetched data
function updateWeatherUI(data) {
  container.style.height = "555px";
  weatherBox.classList.add("active");
  weatherDetails.classList.add("active");
  error404.classList.remove("active");

  const image = document.querySelector(".weather-box img");
  const temperature = document.querySelector(".weather-box .temperature");
  const description = document.querySelector(".weather-box .description");
  const humidity = document.querySelector(".weather-details .humidity span");
  const wind = document.querySelector(".weather-details .wind span");

  const weatherDescription = data.weather[0].main;
  setBackground(weatherDescription);

  const iconCode = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
  image.src = iconUrl;

  const unitSymbol = currentUnit === "metric" ? "°C" : "°F";
  const windSpeedUnit = currentUnit === "metric" ? "km/h" : "mph";

  temperature.innerHTML = `${Math.round(
    data.main.temp
  )}<span>${unitSymbol}</span>`;
  description.textContent = data.weather[0].description;
  humidity.textContent = `${data.main.humidity}%`;
  wind.textContent = `${Math.round(data.wind.speed)} ${windSpeedUnit}`;
}

// Show error message
function showError() {
  container.style.height = "400px";
  weatherBox.classList.remove("active");
  weatherDetails.classList.remove("active");
  error404.classList.add("active");
}

// Set background image based on weather condition
function setBackground(weatherDescription) {
  const weatherBackgrounds = {
    Clear:
      "url('https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=1974&auto=format&fit=crop')",
    Clouds:
      "url('https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?q=80&w=2070&auto=format&fit=crop')",
    Rain: "url('https://images.unsplash.com/photo-1511634829096-045a111727eb?q=80&w=1934&auto=format&fit=crop')",
    Drizzle:
      "url('https://images.unsplash.com/photo-1541919329513-35f7af297129?q=80&w=2070&auto=format&fit=crop')",
    Mist: "url('https://images.unsplash.com/photo-1580193483760-d0ef2abaa348?q=80&w=1974&auto=format&fit=crop')",
    Thunderstorm:
      "url('https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?q=80&w=2071&auto=format&fit=crop')",
    Snow: "url('https://images.unsplash.com/photo-1511131341194-24e2eeeebb09?q=80&w=2070&auto=format&fit=crop')",
    Fog: "url('https://images.unsplash.com/photo-1506452305024-9d3f02d1c9b5?q=80&w=2070&auto=format&fit=crop')",
    Default:
      "url('https://images.unsplash.com/photo-1682685797828-d3b2561deef4?q=80&w=2070&auto=format&fit=crop')",
  };

  document.body.style.backgroundImage =
    weatherBackgrounds[weatherDescription] || weatherBackgrounds["Default"];
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
}

// Setup autosuggest feature
function setupAutosuggest(input) {
  const searchBox = input.parentElement;
  const suggestionsContainer = createSuggestionsContainer(searchBox);
  const loadingIndicator = createLoadingIndicator(searchBox);

  const updateSuggestions = debounce(async (query) => {
    if (!query) {
      clearSuggestions(suggestionsContainer, loadingIndicator);
      return;
    }

    loadingIndicator.style.display = "block";
    const suggestions = await getCitySuggestions(query);
    loadingIndicator.style.display = "none";

    displaySuggestions(suggestions, suggestionsContainer, input);
  }, 300);

  input.addEventListener("input", (e) => updateSuggestions(e.target.value));
  input.addEventListener("keydown", (e) =>
    handleSuggestionNavigation(e, suggestionsContainer)
  );
  document.addEventListener("click", (e) =>
    closeSuggestionsOnClickOutside(e, searchBox, suggestionsContainer)
  );
}

// Create suggestions container
function createSuggestionsContainer(parent) {
  const container = document.createElement("div");
  container.className = "suggestions-container";
  parent.appendChild(container);
  return container;
}

// Create loading indicator
function createLoadingIndicator(parent) {
  const indicator = document.createElement("div");
  indicator.className = "loading-indicator";
  indicator.innerHTML = '<div class="spinner"></div>';
  parent.appendChild(indicator);
  indicator.style.display = "none";
  return indicator;
}

// Get city suggestions from Geoapify API
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

// Display suggestions in the dropdown
function displaySuggestions(suggestions, container, input) {
  container.innerHTML = "";

  if (suggestions.length > 0) {
    suggestions.forEach((suggestion) => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.textContent = formatLocation(suggestion);

      div.addEventListener("click", () => {
        handleSuggestionSelect(suggestion, input, container);
        searchBtn.click();
      });

      container.appendChild(div);
    });
    container.style.display = "block";
  } else {
    container.style.display = "none";
  }
}

// Format location string for display
function formatLocation(suggestion) {
  const parts = [];
  if (suggestion.name) parts.push(suggestion.name);
  if (suggestion.state) parts.push(suggestion.state);
  if (suggestion.country) parts.push(suggestion.country);
  return parts.join(", ");
}

// Handle suggestion selection
function handleSuggestionSelect(suggestion, input, container) {
  input.setAttribute("data-lat", suggestion.lat);
  input.setAttribute("data-lon", suggestion.lon);
  input.value = suggestion.name;
  container.innerHTML = "";
  container.style.display = "none";
}

// Clear suggestions
function clearSuggestions(container, loadingIndicator) {
  container.innerHTML = "";
  container.style.display = "none";
  loadingIndicator.style.display = "none";
}

// Handle keyboard navigation in suggestions
function handleSuggestionNavigation(event, container) {
  const suggestions = container.querySelectorAll(".suggestion-item");
  let currentIndex = Array.from(suggestions).findIndex((el) =>
    el.classList.contains("active")
  );

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      if (currentIndex < suggestions.length - 1) {
        if (currentIndex >= 0)
          suggestions[currentIndex].classList.remove("active");
        suggestions[currentIndex + 1].classList.add("active");
        suggestions[currentIndex + 1].scrollIntoView({ block: "nearest" });
      }
      break;
    case "ArrowUp":
      event.preventDefault();
      if (currentIndex > 0) {
        suggestions[currentIndex].classList.remove("active");
        suggestions[currentIndex - 1].classList.add("active");
        suggestions[currentIndex - 1].scrollIntoView({ block: "nearest" });
      }
      break;
    case "Enter":
      event.preventDefault();
      const activeItem = container.querySelector(".suggestion-item.active");
      if (activeItem) {
        activeItem.click();
      }
      break;
  }
}

// Close suggestions when clicking outside
function closeSuggestionsOnClickOutside(event, searchBox, container) {
  if (!searchBox.contains(event.target)) {
    container.style.display = "none";
  }
}

// Debounce function to limit function calls
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
