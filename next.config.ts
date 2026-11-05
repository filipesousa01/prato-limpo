import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  experimental: {
    // duas fotos de até 10 MB no formulário web (Server Action)
    serverActions: { bodySizeLimit: "22mb" },
  },
};

export default nextConfig;
