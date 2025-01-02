"use strict";

const main = document.querySelector(".main");
const lodingLogoEl = document.querySelector(".loading--logo");
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const btnFormClose = document.querySelector(".btn__close");
const btnDeleteAll = document.querySelector(".btn__delete--all");
const btnSort = document.querySelector(".btn__sort");
const sidebarMessage = document.querySelector(".sidebar__message");
const btnEdit = document.querySelector(".btn__edit");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #markers = [];
  #zoomLevel = 13;
  #sorted = false;
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    inputType.addEventListener("change", this._toggleElevationField);
    form.addEventListener("submit", this._newWorkout.bind(this));
    containerWorkouts.addEventListener("click", this._moveToMarker.bind(this));
    document.addEventListener("keydown", this._hideForm);
    btnFormClose.addEventListener("click", this._hideForm);
    btnDeleteAll.addEventListener("click", this._deleteAll.bind(this));
    btnSort.addEventListener("click", this._sortWorkouts.bind(this));
    // setInterval(() => this._removeLoading(), 2000);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Unable to get your position");
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, this.#zoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));
    this.#workouts.forEach((workout) => this._renderWorkoutMarker(workout));
  }

  _showForm(mapE) {
    form.classList.remove("hidden");
    inputDistance.focus();
    this.#mapEvent = mapE;
  }

  _hideForm(e) {
    if (e?.key === "Escape" || e?.pointerType === "mouse" || !e) {
      e?.preventDefault();
      inputDistance.value =
        inputDuration.value =
        inputCadence.value =
        inputElevation.value =
          "";
      form.style.display = "none";
      form.classList.add("hidden");
      setTimeout(() => (form.style.display = "grid"), 500);
    }
  }

  _toggleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();
    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const elevationGain = +inputElevation.value;
    let workout;
    // validate data
    const checkFinite = (...inputs) =>
      inputs.every((input) => Number.isFinite(input));
    const checkPositive = (...inputs) => inputs.every((input) => input > 0);
    // if type is running then create a running object
    const { lat, lng } = this.#mapEvent.latlng;
    if (type === "running") {
      if (
        !checkFinite(distance, duration, cadence) ||
        !checkPositive(distance, duration, cadence)
      )
        return alert("Invalid values");
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // if type is cycling then create a cycling object
    if (type === "cycling") {
      if (
        !checkFinite(distance, duration, elevationGain) ||
        !checkPositive(distance, duration)
      )
        return alert("Invalid values");
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }
    console.log(workout);
    this.#workouts.push(workout);
    // render marker on map
    this._renderWorkoutMarker(workout);
    // render workout on list
    this._renderWorkout(workout);
    // hide form
    this._hideForm();
    // set local storage
    this._setLocalStorage();
    // hide welcome message
    sidebarMessage.classList.add("hide");
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <button class="btn btn__edit">
          <ion-icon name="create-outline"></ion-icon>
          </button>
          <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </button>
    `;
    if (workout.type === "running") {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }
    if (workout.type === "cycling") {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }
    form.insertAdjacentHTML("afterend", html);
  }

  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴"} ${workout.description}`
      )
      .openPopup();
    this.#markers.push(marker);
  }

  _moveToMarker(e) {
    let workout;
    const workoutEl = e.target.closest(".workout");
    const btnEl = () => e.target.closest(".btn")?.classList.contains("btn");
    if (!workoutEl) return;
    workout = this.#workouts.find(
      (workout) => workout.id === workoutEl.dataset.id
    );
    if (!btnEl()) {
      this.#map.setView(workout.coords, this.#zoomLevel, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
    } else if (
      btnEl() &&
      e.target.closest(".btn").classList.contains("btn__delete")
    ) {
      this._deleteWorkout(workout);
    } else if (
      btnEl() &&
      e.target.closest(".btn").classList.contains("btn__edit")
    ) {
      this._editWorkout(workout);
    }
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach((workout) => this._renderWorkout(workout));
    if (this.#workouts.length !== 0) sidebarMessage.classList.add("hide");
  }

  clearStorage() {
    localStorage.removeItem("workouts");
    location.reload();
  }

  _deleteWorkout(workout) {
    const check = confirm("Are you sure? you want to delete this workout");
    if (check) {
      const index = this.#workouts.findIndex((w) => w.id === workout.id);
      const layer = this.#markers.find((marker, i) => {
        const { lat, lng } = marker._latlng;
        const coords = [lat, lng];
        if (
          workout.coords[0] === coords[0] &&
          workout.coords[1] === coords[1]
        ) {
          return marker;
        }
      });
      this.#workouts.splice(index, 1);
      // update UI
      this.#map.removeLayer(layer);
      this.#markers = this.#markers.filter((l) => l !== layer);
      const workoutEl = document.querySelector(
        `.workout[data-id="${workout.id}"]`
      );
      workoutEl.remove();
      this._setLocalStorage();
      if (this.#workouts.length === 0) sidebarMessage.classList.remove("hide");
    }
  }

  _removeLoading() {
    main.classList.remove("loading");
    lodingLogoEl.classList.add("hidden");
  }

  _deleteAll() {
    if (this.#workouts.length === 0) return;
    const check = confirm(`Are you sure? You want to delete all workouts`);
    if (check) {
      this.#workouts = [];
      this.#markers.forEach((layer) => this.#map.removeLayer(layer));
      this._setLocalStorage();
      // update UI
      document
        .querySelectorAll(".workout")
        .forEach((workout) => workout.remove());
      // display welcome message
      sidebarMessage.classList.remove("hide");
    }
  }

  _sortWorkouts() {
    if (this.#workouts.length === 0) return;
    this.#sorted = !this.#sorted;
    document
      .querySelectorAll(".workout")
      .forEach((workout) => workout.remove());
    if (this.#sorted) {
      const sorted = this.#workouts.toSorted(
        (workout1, workout2) => workout1.distance - workout2.distance
      );
      sorted.forEach((workout) => this._renderWorkout(workout));
    }
    if (!this.#sorted) {
      this.#workouts.forEach((workout) => this._renderWorkout(workout));
    }
  }
  /*
  _toggleInputs(field) {
    inputCadence.closest(".form__row").classList.add("form__row--hidden");
    inputElevation.closest(".form__row").classList.add("form__row--hidden");
    if (field === "cadence") {
      inputCadence.closest(".form__row").classList.remove("form__row--hidden");
      inputElevation.value = "";
    }
    if (field === "elevation") {
      inputElevation
        .closest(".form__row")
        .classList.remove("form__row--hidden");
      inputCadence.value = "";
    }
  }
  
  _checkFinite(...inputs) {
    const check = inputs.every((input) => Number.isFinite(input));
    return check;
  }

  _checkPositive(...inputs) {
    const check = inputs.every((input) => input > 0);
    return check;
  }

  _editWorkout(workout) {
    console.log(workout);
    // display form
    form.classList.remove("hidden");
    inputDistance.focus();
    // set values
    inputType.value = workout.type;
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;

    if (workout.type === "running") {
      inputCadence.value = workout.cadence;
      this._toggleInputs("cadence");
    }
    if (workout.type === "cycling") {
      inputElevation.value = workout.elevationGain;
      this._toggleInputs("elevation");
    }
    // get values
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const type = inputType.value;
      const distance = inputDistance.value;
      const duration = inputDuration.value;
      const cadence = inputCadence.value;
      const elevation = inputElevation.value;
      let newWorkout;

      if (type === "running") {
        if (
          !this._checkFinite(distance, duration, cadence) ||
          !this._checkPositive(distance, duration, cadence)
        )
          return alert("Invalid values");
        newWorkout = new Running(workout.coords, distance, duration, cadence);
      }
      if (type === "cycling") {
        if (
          !this._checkFinite(distance, duration, elevation) ||
          !this._checkPositive(distance, duration)
        )
          return alert("Invalid values");
        newWorkout = new Cycling(workout.coords, distance, duration, elevation);
      }
      console.log(newWorkout);
    });

    // create object
    // update UI
  }
    */
}

const app = new App();
console.log(app);
