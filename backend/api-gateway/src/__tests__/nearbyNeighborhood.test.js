const { AppError } = require("../errors");
const { resolveNeighborhoodCentroid } = require("../utils/neighborhoodCentroids");
const { parseNearbyQuery } = require("../utils/validate");

describe("neighborhoodCentroids", () => {
  it("resolves exact and partial Manhattan neighbourhood names", () => {
    expect(resolveNeighborhoodCentroid("Manhattan")).toEqual({
      lat: 40.7831,
      lng: -73.9712,
      label: "manhattan",
    });
    expect(resolveNeighborhoodCentroid("midtown")).toMatchObject({
      lat: 40.7549,
      lng: -73.984,
    });
    expect(resolveNeighborhoodCentroid("East Village")).toMatchObject({
      lat: 40.7265,
      lng: -73.9815,
    });
  });

  it("returns null for unknown neighbourhoods", () => {
    expect(resolveNeighborhoodCentroid("Brooklyn")).toBeNull();
  });
});

describe("parseNearbyQuery", () => {
  it("geocodes neighborhood when lat/lng are omitted", () => {
    expect(parseNearbyQuery({ neighborhood: "Manhattan" })).toEqual({
      lat: 40.7831,
      lng: -73.9712,
      radiusM: 1500,
      neighborhood: "Manhattan",
      geocoded: true,
    });
  });

  it("still requires coordinates when neighborhood is omitted", () => {
    expect(() => parseNearbyQuery({})).toThrow(/lat and lng are required/);
  });

  it("prefers explicit coordinates when both are supplied", () => {
    expect(
      parseNearbyQuery({
        lat: 40.73,
        lng: -73.99,
        neighborhood: "Midtown",
      })
    ).toEqual({
      lat: 40.73,
      lng: -73.99,
      radiusM: 1500,
      neighborhood: "Midtown",
      geocoded: false,
    });
  });

  it("returns 404 for unknown neighbourhood-only searches", () => {
    expect(() => parseNearbyQuery({ neighborhood: "Queens" })).toThrow(AppError);
    expect(() => parseNearbyQuery({ neighborhood: "Queens" })).toThrow(
      /Unknown neighborhood: Queens/
    );
  });
});
