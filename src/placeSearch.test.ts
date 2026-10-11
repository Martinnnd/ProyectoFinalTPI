import { afterEach, expect, it, vi } from "vitest";
import { findPlaces } from "./placeSearch";
afterEach(() => vi.unstubAllGlobals());
it("keeps valid coordinates and formats the address without duplicate names", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok:true, json:async () => ({features:[
    {geometry:{coordinates:[-58.4,-34.6]},properties:{name:"Buenos Aires",city:"Buenos Aires",country:"Argentina"}},
    {geometry:{coordinates:[181,95]},properties:{name:"Invalid"}},
    {geometry:{coordinates:["-58",-34]},properties:{name:"Invalid"}}
  ]}) }));
  const results = await findPlaces("Buenos Aires", new AbortController().signal);
  expect(results).toHaveLength(1);
  expect(results[0]).toMatchObject({lat:-34.6,lng:-58.4,label:"Buenos Aires, Argentina"});
});
it("reports service failure rather than an empty successful search", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok:false}));
  await expect(findPlaces("Buenos Aires",new AbortController().signal)).rejects.toThrow();
});
