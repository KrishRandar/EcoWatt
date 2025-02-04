import React, { useState } from "react";
import styles from "./Address.module.css"; // Importing module CSS

const Address = () => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Please allow location access.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const confirmLocation = () => {
    if (latitude && longitude) {
      alert(`Address confirmed!\nLatitude: ${latitude}\nLongitude: ${longitude}`);
      // You can handle sending this data to your backend or other components here
    } else {
      alert("Please get your location first.");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Enter Your Location</h2>
      <div className={styles.addressBox}>
        <label>Latitude</label>
        <input type="text" value={latitude} readOnly className={styles.addressInput} />

        <label>Longitude</label>
        <input type="text" value={longitude} readOnly className={styles.addressInput} />

        <button onClick={getLocation} className={styles.locationButton}>
          Get My Location
        </button>

        <button onClick={confirmLocation} className={styles.confirmButton}>
          Confirm
        </button>
      </div>
    </div>
  );
};

export default Address;
