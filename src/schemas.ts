export const schemas = [
  {
    keys: [
      "id",
      "chainId",
      "tokenAddress",
      "title",
      "image",
      "status",
      "startDate",
      "endDate",
      "visits",
      "totalVisits",
      "impressions",
      "usedImpressions",
      "impressionURL",
      "kind",
      "description",
      "websites",
      "socials",
      "acquiredImpressions",
    ],
    fields: {
      id: {},
      chainId: {},
      tokenAddress: {},
      title: {},
      image: {
        source: {},
      },
      status: {
        values: ["pending", "running", "ended"],
      },
      startDate: {},
      endDate: {
        schemas: [{}, {}],
      },
      visits: {
        schemas: [
          {},
          {
            item: {
              keys: ["date", "count"],
              fields: {
                date: {},
                count: {},
              },
            },
            cardinality: "single",
          },
        ],
      },
      totalVisits: {},
      impressions: {
        schemas: [
          {},
          {
            item: {
              keys: ["date", "count"],
              fields: {
                date: {},
                count: {},
              },
            },
            cardinality: "single",
          },
        ],
      },
      usedImpressions: {},
      impressionURL: {
        source: {},
      },
      kind: {
        value: "pair-details",
      },
      description: {},
      websites: {
        schemas: [
          {},
          {
            item: {
              keys: ["label", "url"],
              fields: {
                label: {},
                url: {},
              },
            },
            cardinality: "single",
          },
        ],
      },
      socials: {
        schemas: [
          {},
          {
            item: {
              keys: ["type", "url"],
              fields: {
                type: {
                  values: ["telegram", "twitter", "discord", "facebook", "tiktok"],
                },
                url: {
                  source: {},
                },
              },
            },
            cardinality: "single",
          },
        ],
      },
      acquiredImpressions: {},
    },
  },
  {
    keys: [
      "id",
      "chainId",
      "tokenAddress",
      "title",
      "image",
      "status",
      "startDate",
      "visits",
      "totalVisits",
      "impressions",
      "usedImpressions",
      "impressionURL",
      "kind",
      "endDate",
    ],
    fields: {
      id: {},
      chainId: {},
      tokenAddress: {},
      title: {},
      image: {
        source: {},
      },
      status: {
        values: ["pending", "running", "ended"],
      },
      startDate: {},
      visits: {
        schemas: [
          {},
          {
            item: {
              keys: ["date", "count"],
              fields: {
                date: {},
                count: {},
              },
            },
            cardinality: "single",
          },
        ],
      },
      totalVisits: {},
      impressions: {
        schemas: [
          {},
          {
            item: {
              keys: ["date", "count"],
              fields: {
                date: {},
                count: {},
              },
            },
            cardinality: "single",
          },
        ],
      },
      usedImpressions: {},
      impressionURL: {
        source: {},
      },
      kind: {
        value: "trending-bar",
      },
      endDate: {},
    },
  },
];
