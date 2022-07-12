export const percentage = (value, total) => ((100 * value) / total).toFixed(2);
export const getClientData = () => {
  const data = require("./data.json");

  return data;
};
