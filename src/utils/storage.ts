import { openDB } from "idb";
import type { Walk, Route } from "../types";

const DB_NAME = "ayamonte-a-pie";
const DB_VERSION = 2;

async function db() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("walks")) {
        const store = db.createObjectStore("walks", { keyPath: "id" });
        store.createIndex("startedAt", "startedAt");
      }
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv");
      }
      if (!db.objectStoreNames.contains("routes")) {
        db.createObjectStore("routes", { keyPath: "id" });
      }
    },
  });
}

export async function saveWalk(walk: Walk): Promise<void> {
  const d = await db();
  await d.put("walks", walk);
}

export async function getAllWalks(): Promise<Walk[]> {
  const d = await db();
  const all = await d.getAll("walks");
  return all.sort((a, b) => b.startedAt - a.startedAt);
}

export async function deleteWalk(id: string): Promise<void> {
  const d = await db();
  await d.delete("walks", id);
}

export async function clearWalks(): Promise<void> {
  const d = await db();
  await d.clear("walks");
}

export async function getKV<T>(key: string): Promise<T | undefined> {
  const d = await db();
  return d.get("kv", key);
}

export async function setKV(key: string, value: unknown): Promise<void> {
  const d = await db();
  await d.put("kv", value, key);
}

export async function getChosenRouteId(): Promise<string | null> {
  const d = await db();
  const v = await d.get("kv", "chosenRouteId");
  return (v ?? null) as string | null;
}

export async function setChosenRouteId(id: string | null): Promise<void> {
  const d = await db();
  if (id) await d.put("kv", id, "chosenRouteId");
  else await d.delete("kv", "chosenRouteId");
}

export async function saveCustomRoute(route: Route): Promise<void> {
  const d = await db();
  await d.put("routes", route);
}

export async function getAllCustomRoutes(): Promise<Route[]> {
  const d = await db();
  const all = await d.getAll("routes");
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export async function deleteCustomRoute(id: string): Promise<void> {
  const d = await db();
  await d.delete("routes", id);
}