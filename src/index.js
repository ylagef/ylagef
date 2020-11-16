const fs = require("fs").promises;
const axios = require("axios");

const { AEMET_API_KEY } = process.env;

const getLatestTemperature = async () => {
  return axios({
    url: `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/horaria/32054?api_key=${AEMET_API_KEY}`,
    method: "get",
  })
    .then(async (response) => {
      if (response.data.estado === 200) {
        return getHourlyData(response.data.datos);
      } else {
        return Promise.resolve(null);
      }
    })
    .catch((e) => {
      console.error(e);
      return Promise.resolve(null);
    });
};

function getHourlyData(url) {
  return axios({
    url: `${url}`,
    method: "get",
  })
    .then(async (response) => {
      if (response.data.estado === 404) {
        return Promise.resolve(null);
      } else {
        return +response.data[0].prediccion.dia
          .find(
            (p) => +p.fecha.split("T")[0].split("-")[2] === new Date().getDate()
          )
          .temperatura.find((t) => +t.periodo === new Date().getHours()).value;
      }
    })
    .catch((e) => {
      console.error(e);
      return Promise.resolve(null);
    });
}

function getCurrentHourMinute() {
  const now = new Date();
  return `${now.getHours()}:${now.getMinutes()}`;
}

(async () => {
  const [template, temperature] = await Promise.all([
    fs.readFile("./src/README.md.tpl", { encoding: "utf-8" }),
    getLatestTemperature(),
  ]);

  // replace all placeholders with info
  if (temperature) {
    const newMarkdown = template
      .replace("%{{temperature}}%", temperature)
      .replace("%{{last_update}}%", getCurrentHourMinute);

    await fs.writeFile("README.md", newMarkdown);
  }
})();
