import postgres from "postgres";

let sql: ReturnType<typeof postgres> | undefined;

export function pleskDatabase() {
  const url = process.env["ENES_DATABASE_URL"];
  if (!url) return undefined;
  return (sql ??= postgres(url, { max: 4, connect_timeout: 5, idle_timeout: 20 }));
}
