export const TIMEZONES = [
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "America/Sao_Paulo", label: "São Paulo (GMT-3)" },
  { value: "America/Montevideo", label: "Montevideo (GMT-3)" },
  { value: "America/Santiago", label: "Santiago (GMT-3/-4)" },
  { value: "America/Lima", label: "Lima (GMT-5)" },
  { value: "America/Bogota", label: "Bogotá (GMT-5)" },
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
  { value: "America/Chicago", label: "Chicago (GMT-6)" },
  { value: "America/Denver", label: "Denver (GMT-7)" },
  { value: "America/Los_Angeles", label: "Los Ángeles (GMT-8)" },
  { value: "Europe/Madrid", label: "Madrid (GMT+1/+2)" },
  { value: "Europe/Paris", label: "París (GMT+1/+2)" },
  { value: "Europe/Berlin", label: "Berlín (GMT+1/+2)" },
  { value: "Europe/Rome", label: "Roma (GMT+1/+2)" },
  { value: "Europe/London", label: "Londres (GMT+0/+1)" },
  { value: "Europe/Lisbon", label: "Lisboa (GMT+0/+1)" },
  { value: "Europe/Amsterdam", label: "Ámsterdam (GMT+1/+2)" },
  { value: "Asia/Tokyo", label: "Tokio (GMT+9)" },
  { value: "Asia/Shanghai", label: "Shanghái (GMT+8)" },
  { value: "Australia/Sydney", label: "Sídney (GMT+10/+11)" },
  { value: "UTC", label: "UTC (GMT+0)" },
];

export const REFRESH_FREQUENCIES = [
{ value: "1h", label: "Cada 1 hora" },
  { value: "3h", label: "Cada 3 horas" },
  { value: "24h", label: "1 vez al día" },
];

const CONFIG_KEY = "recalendar_config";

export function loadConfig() {
  try {
    var raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : getDefaultConfig();
  } catch (e) {
    return getDefaultConfig();
  }
}

export function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function getDefaultConfig() {
  return {
    general: {
      selectedPdfId: null,
      selectedPdfName: "",
      pageTypes: { agenda: false, tasks: false, notes: false },
      timezone: "Europe/Madrid",
      refreshFrequency: "recalendar",
    },
    agenda: {},
    tasks: {
      vikunjaUrl: "",
      vikunjaTokenEncrypted: "",
      vikunjaProjectId: null,
      vikunjaProjectName: "",
    },
    notes: {},
  };
}
