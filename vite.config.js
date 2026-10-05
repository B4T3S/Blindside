import { defineConfig } from "vite";

export default defineConfig({
    root: "client",

    server: {
        proxy: {
            "/api": "http://localhost:3000",

            "/socket": {
                target: "ws://localhost:3000",
                ws: true,
            },
        },
    },

    build: {
        outDir: "../dist",
        emptyOutDir: true,
    },
});
