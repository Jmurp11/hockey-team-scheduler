export const rankingsExtract = (s: string, isSquirt: boolean) => ({
  rankings: [
    {
      selector: `${s}`,
      value: {
        team: {
          selector: isSquirt ? "td:nth-of-type(1)" : "td:nth-of-type(2)",
          value: {
            selector: "a",
            value: "text",
          },
        },
        link: {
          selector: isSquirt ? "td:nth-of-type(1) a" : "td:nth-of-type(2) a",
          value: "href",
        },
        record: isSquirt ? "td:nth-of-type(2)" : "td:nth-of-type(3)",
        rating: isSquirt ? "td:nth-of-type(3)" : "td:nth-of-type(4)",
        avg_goal_diff: isSquirt ? "td:nth-of-type(4)" : "td:nth-of-type(5)",
        schedule: isSquirt ? "td:nth-of-type(5)" : "td:nth-of-type(6)",
      },
    },
  ],
});

export const associationExtract = (s: string) => ({
  association: {
    selector: `${s}`,
    value: {
      selector: "a",
    },
  },
});

export const leagueInfoExtract = (s: string) => ({
  league: {
    selector: `${s}`,
    value: {
      selector: "ul",
      value: [
        {
          selector: "a",
        },
      ],
    },
  },
});

export const locationExtract = (s: string) => ({
  location: {
    selector: `${s}`,
  },
});

export const leaguesExtract = (s: string) => ({
  leagues: [
    {
      selector: `${s}`,
      value: {
        name: {
          selector: "a > div",
          value: {
            selector: "h4",
            value: "text",
          },
        },
        abbreviation: {
          selector: "a > div > p",
          value: {
            selector: "span",
            value: "text",
          },
        },
        location: {
          selector: "a > div",
          value: {
            selector: "p",
            value: "text",
          },
        },
      },
    },
  ],
});

export const organizationsExtract = (s: string) => ({
  organizations: [
    {
      selector: `${s}`,
      value: {
        name: {
          selector: "div > a > div",
          value: {
            selector: "p:nth-of-type(1)",
            value: "text",
          },
        },
        leagues: {
          selector: "div.text-right",
          value: {
            selector: "div",
            value: "text",
          },
        },
        location: {
          selector: "a > div",
          value: {
            selector: "p:nth-of-type(2)",
            value: "text",
          },
        },
      },
    },
  ],
});
