import {  useEffect, useState } from "react";

export default function App() {
  const [location, setLocation] = useState("");
  const [displayLocation, setDisplayLocation] = useState("");
  const [weatherInfo, setWeatherInfo] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function convertToFlag(countryCode) {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  }

  useEffect(
    function () {
      async function getWeatherData() {
        try {
          setIsLoading(true);
          setErrorMsg("");
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
          );
          const data = await res.json();

          if (!data.results) throw new Error("Location not found!");

          const { latitude, longitude, timezone, name, country_code } =
            data.results.at(0);

          setDisplayLocation(name);

          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
          );
          const weatherData = await weatherRes.json();
          setWeatherInfo(weatherData.daily);
        } catch (err) {
          setErrorMsg(err.message);
        } finally {
          setIsLoading(false);
        }
      }

      location && getWeatherData();

      return () => setDisplayLocation("");
    },
    [location]
  );

  return (
    <div className="classy-weather">
      <h1 className="classy-weather__title">Classy Weather</h1>
      <input
        type="text"
        name="place"
        id="place"
        className="classy-weather__input"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      {isLoading && <Message>Fetching details...</Message>}
      {!location && (
        <Message>Enter the location to fetch weather details</Message>
      )}
      {!isLoading && location && errorMsg && <Message>{errorMsg}</Message>}
      {!isLoading && location && !errorMsg && (
        <WeatherInfo
          weatherInfo={weatherInfo}
          displayLocation={displayLocation}
        />
      )}
    </div>
  );
}

function WeatherInfo({ displayLocation, weatherInfo }) {
  function getWeatherIcon(wmoCode) {
    const icons = new Map([
      [[0], "☀️"],
      [[1], "🌤"],
      [[2], "⛅️"],
      [[3], "☁️"],
      [[45, 48], "🌫"],
      [[51, 56, 61, 66, 80], "🌦"],
      [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
      [[71, 73, 75, 77, 85, 86], "🌨"],
      [[95], "🌩"],
      [[96, 99], "⛈"],
    ]);
    const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
    if (!arr) return "NOT FOUND";
    return icons.get(arr);
  }

  function formatDay(dateStr) {
    return new Intl.DateTimeFormat("en", {
      weekday: "short",
    }).format(new Date(dateStr));
  }

  return (
    <div className="classy-weather__info">
      <Message>Weather details for {displayLocation}</Message>
      <ul className="classy-weather__infolist">
        {displayLocation !== "" &&
          weatherInfo.time?.map((time, i) => (
            <WeatherInfoItem
              key={time}
              weatherIcon={getWeatherIcon(weatherInfo.weathercode[i])}
              weatherDay={formatDay(time)}
              minTemp={Math.floor(weatherInfo.temperature_2m_min[i])}
              maxTemp={Math.ceil(weatherInfo.temperature_2m_max[i])}
            />
          ))}
      </ul>
    </div>
  );
}

function WeatherInfoItem({ weatherIcon, weatherDay, minTemp, maxTemp }) {
  return (
    <li className="classy-weather__infoitem">
      <div className="classy-weather__infoitem-img">{weatherIcon}</div>
      <label className="classy-weather__infoitem-day">{weatherDay}</label>
      <p className="classy-weather__infoitem-data">
        {minTemp}&deg; - {maxTemp}&deg;
      </p>
    </li>
  );
}

function Message({ children }) {
  return <h3 className="classy-weather__info-msg">{children}</h3>;
}
