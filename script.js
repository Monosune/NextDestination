"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const calcDate = function () {
  let yourDate = new Date();
  let day = yourDate.getDate();
  let month = yourDate.getMonth() + 1;
  if (day < 10) {
    day = "0" + day;
  }
  if (month < 10) {
    month = "0" + month;
  }
  let year = yourDate.getFullYear();
  let today = `${year}-${month}-${day}`;
  return today;
};
let today = calcDate();

const form = document.querySelector(".form");
const containerDestinations = document.querySelector(".destinations");
const yourLocationInput = document.querySelector(".yourLocation");
const fromInput = document.querySelector('input[name="thisPlace"]');
const inputTo = document.querySelector(".form__input--to");
const inputTravelDate = document.querySelector(".date");
inputTravelDate.setAttribute("min", today);
inputTravelDate.setAttribute("value", today);
let yourCity;
let destinationList = [];

// --------------------------------------------------------------//
// PARENT CLASS //
class DestinationCl {
  id = (Date.now() + "").slice(-10);

  constructor(coords, travelDate) {
    this.coords = coords;
    this.travelDate = travelDate;
  }
}

// --------------------------------------------------------------//
// APPLICATION FUNCTIONALITIES //

class Brain {
  #map;
  #destinationsArray = [];
  #mapEvent; // #mapEvent will hold the information of your click location.
  #yourCoords;

  constructor() {
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Handling events.
    form.addEventListener("submit", this._newDestObj.bind(this)); // It's necessary to bind the function to the class or else the "this" will be attatched to the form.

    containerDestinations.addEventListener(
      "click",
      this._moveToPopup.bind(this)
    );
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
    }
  }

  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    this.#yourCoords = [latitude, longitude];

    this.#map = L.map("map").setView(this.#yourCoords, 6);

    L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on("click", this._showForm.bind(this));

    // Showing all markers on map
    this.#destinationsArray.forEach((local) => {
      this._newDestMarker(local);
    });
    this._geocoding(this.#yourCoords, this._yourLocation);
  }

  _yourLocation(location) {
    yourCity = location[0] + ", " + location[1] + ", " + location[2];
    yourLocationInput.value = yourCity;
  }

  // Uses the desired position to get data from the location like city and country. Params must be a array with latitude and longitude values.
  async _geocoding(destination, callback) {
    let coords = Array.isArray(destination) ? destination : destination.coords;
    let url = `https://geocode.maps.co/reverse?lat=${coords[0]}&lon=${coords[1]}&api_key=6792a487ad4ba553733388ahb137c60`;

    const response = await fetch(url);
    const json = await response.json();
    const city = json.address.city;
    const state = json.address.state;
    const country = json.address.country;
    const markedLocation = [city, state, country];

    // this._flightInformations(markedLocation, "");

    callback(markedLocation, destination);
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    form.focus();
  }

  // Creates new DestinationCl object
  _newDestObj(e) {
    const travelDate = inputTravelDate.value; // Data from form
    const { lat, lng } = this.#mapEvent.latlng;
    let destinationObj;

    e.preventDefault();

    if (fromInput.value != "") {
      //Create YourLocation object
      destinationObj = new DestinationCl([lat, lng], travelDate);

      // Hide form
      form.classList.add("hidden");

      // Add new object to destination array
      this.#destinationsArray.push(destinationObj);

      // Render destination on map as marker
      this._newDestMarker(destinationObj);

      this._geocoding(destinationObj, this._displayList); // Passes informations from the object created to the geocoding and callback (_displayList) functions

      // Set local storage to all workouts
      this._setLocalStorage();
    } else {
      alert("You need to select your origin place");
    }
  }

  // Creates a new marker on selected position on map
  _newDestMarker(destinationObj) {
    L.marker(destinationObj.coords).addTo(this.#map).openPopup();
  }

  // Handles the HTML, displaying the informations of the travel aquired from the form.
  _displayList(markedLocation, destinationObj) {
    let trvDate = destinationObj.travelDate.split("-");
    let from = fromInput.value.split(",");
    // prettier-ignore
    let html = `
        <div class="destination" data-id="${
          destinationObj.id}">
          <div>
          <h2 class="destination__title">✈️Travel on ${months[Number(trvDate[1]) - 1]} ${trvDate[2]} ${trvDate[0]}</h2>
          </div>
          <div>
          <div class="destination__details">
            <span class="destination__icon">📍</span>
            <span class="destination__unit">From: </span>
            <span class="destination__value">${from[0]}</span> 
          </div>
          <div class="destination__details">
            <span class="destination__icon">➡️</span>
            <span class="destination__unit">To: </span>
            <span class="destination__value">${markedLocation[0]}</span>
          </div>
        </div>`;
    destinationList.push(html);
    localStorage.setItem("destHtml", JSON.stringify(destinationList));
    form.insertAdjacentHTML("afterend", html);
  }

  // When you click on any travel information on the form you will go to the assigned marker.
  _moveToPopup(e) {
    const destinationEl = e.target.closest(".destination");

    if (!destinationEl) return;

    const destination = this.#destinationsArray.find(
      (local) => local.id === destinationEl.dataset.id
    );

    this.#map.setView(destination.coords, 6, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem(
      "destinations",
      JSON.stringify(this.#destinationsArray)
    );
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("destinations"));
    const dataHtml = JSON.parse(localStorage.getItem("destHtml"));

    if (!data) return;
    if (!dataHtml) return;

    this.#destinationsArray = data;
    destinationList = dataHtml;

    destinationList.forEach((html) => {
      form.insertAdjacentHTML("afterend", html);
    });
  }
}

const brain = new Brain();
