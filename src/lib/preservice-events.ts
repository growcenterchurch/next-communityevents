export type PreServiceIrOption = {
  number: string;
  time: string;
  location: string;
  team: string;
  eventStartTime: string;
  eventEndTime: string;
  registrationStartTime: string;
  registrationEndTime: string;
};

export type PreServiceEventConfig = {
  eventCode: string;
  irOptions: PreServiceIrOption[];
};

export const PRE_SERVICE_EVENTS: Record<string, PreServiceEventConfig> = {
  "5f75ed1": {
    eventCode: "5f75ed1",
    irOptions: [
      {
        number: "IR 1",
        time: "Pk. 07:30 WIB",
        location: "GC Hall, PIOT 6 Lantai 3",
        team: "Tim IR 08:30",
        eventStartTime: "07:30",
        eventEndTime: "08:00",
        registrationStartTime: "06:00",
        registrationEndTime: "08:30",
      },
      {
        number: "IR 2",
        time: "Pk. 09:00 WIB",
        location: "Fellowship IR, PIOT 6 Lantai 6",
        team: "Tim IR 10:30",
        eventStartTime: "09:00",
        eventEndTime: "10:00",
        registrationStartTime: "08:30",
        registrationEndTime: "10:30",
      },

      {
        number: "IR 3",
        time: "Pk. 11:00 WIB",
        location: "Fellowship IR, PIOT 6 Lantai 6",
        team: "Tim IR 13:00",
        eventStartTime: "11:00",
        eventEndTime: "12:00",
        registrationStartTime: "10:00",
        registrationEndTime: "13:00",
      },

      {
        number: "IR 4",
        time: "Pk. 14:30 WIB",
        location: "Fellowship IR, PIOT 6 Lantai 6",
        team: "Tim IR 16:00",
        eventStartTime: "14:30",
        eventEndTime: "15:30",
        registrationStartTime: "13:30",
        registrationEndTime: "16:00",
      },
      {
        number: "IR 5",
        time: "Pk. 16:30 WIB",
        location: "Fellowship IR, PIOT 6 Lantai 6",
        team: "Tim IR 18:00",
        eventStartTime: "16:30",
        eventEndTime: "17:30",
        registrationStartTime: "15:30",
        registrationEndTime: "18:00",
      },
    ],
  },
  "0b855b5": {
    eventCode: "0b855b5",
    irOptions: [
      {
        number: "GROW Youth",
        time: "Pk. 09:30 WIB",
        location: "GCX Room, PIOT 6 Lantai 6",
        team: "Tim Grow Youth",
        eventStartTime: "09:30",
        eventEndTime: "10:00",
        registrationStartTime: "08:30",
        registrationEndTime: "10:30",
      },
      {
        number: "GROW College",
        time: "Pk. 11:30 WIB",
        location: "GCX Room, PIOT 6 Lantai 6",
        team: "Tim Grow College",
        eventStartTime: "11:30",
        eventEndTime: "12:30",
        registrationStartTime: "10:30",
        registrationEndTime: "13:00",
      },
    ],
  },
  c011b1d: {
    eventCode: "c011b1d",
    irOptions: [
      {
        number: "GC MANADO",
        time: "Pk. 15:00 WIT",
        location: "Star Square Mall",
        team: "Tim IR 16:00",
        eventStartTime: "15:00",
        eventEndTime: "16:00",
        registrationStartTime: "14:00",
        registrationEndTime: "16:00",
      },
      {
        number: "GC MINUT",
        time: "Pk. 08:00 WIT",
        location: "The Sentra Hotel",
        team: "Tim IR 09:00",
        eventStartTime: "08:00",
        eventEndTime: "09:00",
        registrationStartTime: "07:00",
        registrationEndTime: "09:00",
      },
    ],
  },
};

export function getPreServiceEventConfig(eventCode: string) {
  return PRE_SERVICE_EVENTS[eventCode];
}

export function isPreServiceEventCode(eventCode: string) {
  return Boolean(getPreServiceEventConfig(eventCode));
}
