// Plesk (Phusion Passenger) başlangıç dosyası.
// Passenger CommonJS dosyası bekler; derlenmiş Nitro sunucusunu (ESM) buradan başlatır.
// Port, Passenger tarafından PORT ortam değişkeniyle verilir; Nitro bunu kendisi okur.
import("./.output/server/index.mjs").catch((err) => {
  console.error("Enes Yapı sunucusu başlatılamadı:", err);
  process.exit(1);
});
