"use strict";

console.log(
  "https://geocode.maps.co/reverse?lat=40.7558017&lon=-73.9787414&api_key=6792a487ad4ba553733388ahb137c60"
);

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
// CHILD CLASS //

class YourLocation extends DestinationCl {
  type = "your"; // Mudar tipo!

  constructor(coords, travelDate) {
    super(coords, travelDate);
  }
}

class OtherLocation extends DestinationCl {
  type = "other"; // Mudar tipo!

  constructor(coords, travelDate, from) {
    super(coords, travelDate);
    this.from = from;
  }
}

// --------------------------------------------------------------//
// APPLICATION FUNCTIONALITIES //

const form = document.querySelector(".form");
const containerDestinations = document.querySelector(".destinations");
const inputType = document.querySelector(".form__input--type");
const inputWhere = document.querySelector(".form__input--where"); // Está hidden
const inputTo = document.querySelector(".form__input--to");
const inputTravelDate = document.querySelector(".date");
inputTravelDate.setAttribute("min", today);
inputTravelDate.setAttribute("value", today);

class Brain {
  #map;
  #destinations = [];
  #mapEvent; // #mapEvent will hold the information of your click location.
  #formlist = [];
  #yourCoords;

  constructor() {
    this._getPosition();

    // Handling events.
    form.addEventListener("submit", this._newDestiny.bind(this)); // It's necessary to bind the function to the class or else the "this" will be attatched to the form.
    inputType.addEventListener("change", this._toggleOtherDestination);
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

    this.#map = L.map("map").setView(this.#yourCoords, 7);

    L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on("click", this._showForm.bind(this));

    // Showing all markers on map
    this.#destinations.forEach((local) => {
      this._newDestinyMarker(local);
    });
  }

  _findLocation() {}

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputType.focus();
  }

  // Creates new object
  _newDestiny(e) {
    // Data from form
    const type = inputType.value;
    const travelDate = inputTravelDate.value; // Mudar nome!
    const { lat, lng } = this.#mapEvent.latlng;
    let destiny;

    e.preventDefault();

    //If type of origin is "your" create YourLocation object
    if (type === "your") {
      destiny = new YourLocation([lat, lng], travelDate);
      console.log(destiny);
    }

    //If type of origin is "other" create OtherLocation object
    if (type === "other") {
      destiny = new OtherLocation([lat, lng], travelDate, inputWhere);
    }

    // Hide form
    form.classList.add("hidden");

    this.#destinations.push(destiny);
    console.log(this.#destinations);

    this._newDestinyMarker(destiny);

    this._geocoding(destiny);
  }

  // Creates a new marker on selected position on map
  _newDestinyMarker(destiny) {
    L.marker(destiny.coords)
      .addTo(this.#map)
      .bindPopup("A pretty CSS popup.<br> Easily customizable.")
      .openPopup();
  }

  // Handles the HTML, displaying the informations of the travel aquired from the form.
  _displayList(destiny, yourCity, otherCity) {
    let trvDate = destiny.travelDate;
    let trvDateMonth = Number(trvDate.split("-")[1]);
    let trvDateDay = trvDate.split("-")[2];
    let trvDateYear = trvDate.split("-")[0];

    // prettier-ignore
    let html = `
        <div class="destination destination--${destiny.type}" data-id="${
          destiny.id}">
          <div>
          <h2 class="destination__title">✈️Travel on ${months[trvDateMonth]} ${trvDateDay} ${trvDateYear}</h2>
          </div>
          <div>
          <button class="close">x</button>
          </div>
          <div class="destination__details">
            <span class="destination__icon">📍</span>
            <span class="destination__unit">From: </span>
            <span class="destination__value">${
              destiny.type === "your" ? yourCity : yourCity
            }</span> 
          </div>
          <div class="destination__details">
            <span class="destination__icon">➡️</span>
            <span class="destination__unit">To: </span>
            <span class="destination__value">${otherCity}</span>
          </div>
        </div>`;
    this.#formlist.push(html);
    form.insertAdjacentHTML("afterend", html);
  }

  _deleteDestination(e) {}

  // Change informations on the form depending on your location. If you are traveling from your city or from another place.
  _toggleOtherDestination() {
    inputWhere.closest(".form__row").classList.toggle("form__row--hidden");
  }

  // When you click on any travel information on the form you will go to the assigned marker.
  _moveToPopup(e) {
    console.log(e);
    const destinyEl = e.target.closest(".destination");

    if (!destinyEl) return;

    const destiny = this.#destinations.find(
      (local) => local.id === destinyEl.dataset.id
    );

    this.#map.setView(destiny.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // Uses the desired position to get data from the location like city and country.
  async _geocoding(destiny) {
    console.log(destiny.coords);

    let yourUrl = `https://geocode.maps.co/reverse?lat=${
      this.#yourCoords[0]
    }&lon=${this.#yourCoords[1]}&api_key=6792a487ad4ba553733388ahb137c60`;

    let otherUrl = `https://geocode.maps.co/reverse?lat=${destiny.coords[0]}&lon=${destiny.coords[1]}&api_key=6792a487ad4ba553733388ahb137c60`;

    let yourResult;
    let otherResult;

    await fetch(yourUrl)
      .then((response) => response.json())
      .then((response) => (yourResult = response))
      .catch((error) => console.error("Error:", error));
    const yourCity = yourResult.address.city;

    await fetch(otherUrl)
      .then((response) => response.json())
      .then((response) => (otherResult = response))
      .catch((error) => console.error("Error:", error));
    const otherCity = otherResult.address.city;

    this._displayList(destiny, yourCity, otherCity);
  }
}

const brain = new Brain();
